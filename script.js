// ===== CONFIGURATION =====
const CONFIG = {
    TOTAL_TOKENS: 400,
    TOKEN_PREFIX: 'TOKEN',
    DEBOUNCE_TIME: 1500, // milliseconds
    SCAN_INTERVAL: 100, // milliseconds between scans
};

// ===== TOKEN LIST GENERATION =====
// Generate valid token list: TOKEN001 to TOKEN400
const VALID_TOKENS = new Set();
for (let i = 1; i <= CONFIG.TOTAL_TOKENS; i++) {
    const tokenId = `${CONFIG.TOKEN_PREFIX}${String(i).padStart(3, '0')}`;
    VALID_TOKENS.add(tokenId);
}

// ===== STATE MANAGEMENT =====
let scanningActive = false;
let lastScanTime = 0;
let animationFrameId = null;

// ===== DOM ELEMENTS =====
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
const statusElement = document.getElementById('status');
const statusText = document.getElementById('statusText');
const resetBtn = document.getElementById('resetBtn');

// Stats elements
const totalScannedEl = document.getElementById('totalScanned');
const validScansEl = document.getElementById('validScans');
const duplicatesEl = document.getElementById('duplicates');
const remainingEl = document.getElementById('remaining');
const firstScanEl = document.getElementById('firstScan');
const lastScanEl = document.getElementById('lastScan');

// ===== STORAGE FUNCTIONS =====
function loadData() {
    const data = {
        usedTokens: JSON.parse(localStorage.getItem('usedTokens') || '{}'),
        totalScanned: parseInt(localStorage.getItem('totalScanned') || '0'),
        validScans: parseInt(localStorage.getItem('validScans') || '0'),
        duplicates: parseInt(localStorage.getItem('duplicates') || '0'),
        firstScanTime: localStorage.getItem('firstScanTime') || null,
        lastScanTime: localStorage.getItem('lastScanTime') || null,
    };
    return data;
}

function saveData(data) {
    localStorage.setItem('usedTokens', JSON.stringify(data.usedTokens));
    localStorage.setItem('totalScanned', data.totalScanned.toString());
    localStorage.setItem('validScans', data.validScans.toString());
    localStorage.setItem('duplicates', data.duplicates.toString());
    if (data.firstScanTime) {
        localStorage.setItem('firstScanTime', data.firstScanTime);
    }
    if (data.lastScanTime) {
        localStorage.setItem('lastScanTime', data.lastScanTime);
    }
}

function resetData() {
    if (confirm('⚠️ Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.clear();
        updateStats();
        showStatus('System reset successfully', 'neutral');
        playSound('success');
    }
}

// ===== AUDIO FEEDBACK =====
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
        // Pleasant beep for success
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'error') {
        // Lower buzz for error
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// ===== UI UPDATE FUNCTIONS =====
function showStatus(message, type = 'neutral') {
    statusText.textContent = message;
    statusElement.className = 'status-message ' + type;
}

function updateStats() {
    const data = loadData();
    const usedCount = Object.keys(data.usedTokens).length;
    const remaining = CONFIG.TOTAL_TOKENS - usedCount;
    
    totalScannedEl.textContent = data.totalScanned;
    validScansEl.textContent = data.validScans;
    duplicatesEl.textContent = data.duplicates;
    remainingEl.textContent = remaining;
    
    if (data.firstScanTime) {
        firstScanEl.textContent = formatTime(data.firstScanTime);
    }
    if (data.lastScanTime) {
        lastScanEl.textContent = formatTime(data.lastScanTime);
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ===== TOKEN VALIDATION =====
function validateToken(tokenId) {
    const data = loadData();
    const currentTime = new Date().toISOString();
    
    // Check if token exists in valid list
    if (!VALID_TOKENS.has(tokenId)) {
        // Invalid token
        data.totalScanned++;
        data.lastScanTime = currentTime;
        if (!data.firstScanTime) {
            data.firstScanTime = currentTime;
        }
        saveData(data);
        updateStats();
        showStatus(`❌ INVALID TOKEN: ${tokenId}`, 'error');
        playSound('error');
        return;
    }
    
    // Check if already used
    if (data.usedTokens[tokenId]) {
        // Duplicate
        data.totalScanned++;
        data.duplicates++;
        data.lastScanTime = currentTime;
        if (!data.firstScanTime) {
            data.firstScanTime = currentTime;
        }
        saveData(data);
        updateStats();
        showStatus(`⚠️ DUPLICATE TOKEN: ${tokenId}`, 'error');
        playSound('error');
        return;
    }
    
    // Valid new token
    data.usedTokens[tokenId] = true;
    data.totalScanned++;
    data.validScans++;
    data.lastScanTime = currentTime;
    if (!data.firstScanTime) {
        data.firstScanTime = currentTime;
    }
    saveData(data);
    updateStats();
    showStatus(`✅ VALID TOKEN: ${tokenId}`, 'valid');
    playSound('success');
}

// ===== CAMERA & SCANNING =====
async function initCamera() {
    try {
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' }, // Prefer rear camera
                width: { ideal: 1280 },
                height: { ideal: 1280 }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            scanningActive = true;
            showStatus('📷 Camera ready - Point at QR code', 'neutral');
            requestAnimationFrame(scanFrame);
        });
        
    } catch (error) {
        console.error('Camera error:', error);
        showStatus('❌ Camera access denied. Please allow camera permissions.', 'error');
    }
}

function scanFrame(timestamp) {
    if (!scanningActive) return;
    
    // Draw current video frame to canvas
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });
        
        if (code) {
            // Debouncing: only process if enough time has passed
            const now = Date.now();
            if (now - lastScanTime > CONFIG.DEBOUNCE_TIME) {
                lastScanTime = now;
                validateToken(code.data.trim());
            }
        }
    }
    
    // Continue scanning
    animationFrameId = requestAnimationFrame(scanFrame);
}

// ===== EVENT LISTENERS =====
resetBtn.addEventListener('click', resetData);

// Handle page visibility to pause/resume scanning
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        scanningActive = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    } else {
        scanningActive = true;
        requestAnimationFrame(scanFrame);
    }
});

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    updateStats();
    initCamera();
});

// ===== INSTRUCTIONS FOR CUSTOMIZATION =====
/*
HOW TO CUSTOMIZE TOKEN LIST:
1. Change CONFIG.TOTAL_TOKENS to your desired number (e.g., 700)
2. Change CONFIG.TOKEN_PREFIX to your desired prefix (e.g., 'EVENT')
3. For custom token list, replace the VALID_TOKENS generation with:
   const VALID_TOKENS = new Set(['TOKEN001', 'TOKEN002', 'CUSTOM123', ...]);

HOW TO ADJUST DEBOUNCE TIME:
- Change CONFIG.DEBOUNCE_TIME (in milliseconds)
- Default is 1500ms (1.5 seconds)

HOW TO RUN OFFLINE:
1. Download this entire folder
2. Open index.html in Chrome/Safari
3. Allow camera permissions
4. The app will work without internet after initial load
*/
