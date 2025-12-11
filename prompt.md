“Create a complete, production-ready web app using only HTML, CSS, and JavaScript (no backend, no frameworks).
This app must be a super-lightweight, offline QR Token Scanner system designed for very fast scanning of 400+ QR codes.

Requirements:
1️⃣ GENERAL

Must work offline on any phone browser (Chrome recommended).

Should not require internet after opening the page.

Must use the phone’s rear camera for scanning.

Must detect QR codes instantly, with minimal processing delay (<300ms).

Must show a clean, modern UI.

2️⃣ MAIN FEATURES
✔ REAL-TIME QR SCANNING

Implement scanning using camera + lightweight QR decoding library (jsQR or similar).

The scanner must:

Start automatically when page loads

Continuously scan frames

Detect QR instantly

Debounce scans (avoid duplicate reads within 1–2 seconds)

✔ VALIDATION RULES

When a QR is scanned:

Check if token ID exists in predefined valid list

The list will contain 400+ IDs like “TOKEN001 – TOKEN400”.

If token is valid AND not used:

Show green message: “VALID TOKEN: TOKEN123”

Play success sound

Mark it as USED in localStorage

Update stats

If token is valid BUT already used:

Show red message: “DUPLICATE TOKEN”

Play error sound

If QR not found in list:

Show red: “INVALID TOKEN”

✔ TOKEN STORAGE & TRACKING

Use localStorage for everything:

usedTokens = { tokenID: true }

totalUsed counter

firstScanTime, lastScanTime for stats

Provide:

A stats box showing:

Total tokens scanned

Valid new scans

Duplicates detected

Remaining tokens

Time of first scan

Time of last scan

3️⃣ USER INTERFACE

Simple, clean UI with:

Camera viewport

Status message box

Stats section

“Reset System” button (clears all localStorage)

All elements centered & mobile responsive

Color use:

Green for valid

Red for duplicate/invalid

Blue/black neutral

4️⃣ SECURITY & EFFICIENCY

Token list should be embedded in JS (400+ IDs).

Scanning loop must be highly optimized.

Use requestAnimationFrame instead of setInterval for performance.

Scanner should never freeze even during rapid scanning.

Avoid heavy libraries (no Bootstrap, no frameworks).

File size must be very small (<200kb total).

5️⃣ DELIVERABLES

Provide:

index.html (complete working UI + camera element)

style.css (clean responsive design)

script.js

QR scanning logic

Token validation

Stats tracking

LocalStorage saving/loading

Sounds

Debouncing

Instructions:

How to run offline

How to add/remove tokens

Write clean, well-commented code.

Make the entire solution extremely reliable and suitable for scanning 400–700 QR tokens during a college event.”