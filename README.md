# MASCO Election Multi-Branch Bangla V20

V20 removes the static header artwork and rebuilds the premium election header entirely with native HTML + CSS.

## Main V20 changes
- No static header/banner image is used.
- MASCO logo remains a real image element.
- MASCO GROUP / People / Products / Progress / Together is responsive HTML text.
- “মাসকো গ্রুপ”, election title and “চূড়ান্ত ফলাফল” are live responsive text.
- Gold seal and Full Screen are native responsive UI elements.
- Curves, blue depth and gold accents are generated with CSS.
- Desktop, tablet, mobile, browser zoom and fullscreen all reflow naturally.
- Existing election JSON, result cards, footer, admin panel and save logic remain unchanged.

## Run
Run `START.bat`.

To stop the server, press Ctrl+C in the same terminal or run `STOP.bat`.

V21 update
- Public header left side now shows only the MASCO logo; the English MASCO GROUP / People / Products / Progress / Together block was removed.
- Empty seat categories are hidden from the public result dashboard.
- If a unit has winners in only one seat category, that category expands to the full card width.
- Winner cards now prioritize candidate photo, large symbol image/icon, candidate name, winner badge, and a large vote total on the right.
- Uploaded candidate photos and symbol photos are used automatically; when an image is missing, a clean fallback is shown.


V25 update: unit result uses V23 working data logic, larger candidate/photo/symbol/vote text, natural row heights, no forced desktop zoom, and empty candidate sections remain hidden.


## V30 changes
- UI terminology changed from Unit to Section (internal JSON keys remain compatible).
- Section-wise public result publishing.
- Admin Preview shows all section results; public dashboard reveals only published sections.
- Unpublished sections remain visible by name as empty cards.
- Ties at the winner cutoff include all tied candidates, even beyond configured seat count.
- Public final dashboard refreshes data automatically every 5 seconds.


## Symbol Spin Allocation Update
- Symbol lottery UI replaced with animated Spin Wheel.
- Wheel only contains currently available symbols for the selected candidate's section.
- Secure browser random selection is used before the animation.
- Allocation is saved only after the spin finishes.
- Used symbols in the same section are excluded automatically.
- Manual allocation, release/reassign, allocation history, KPI and management dashboard remain available.
