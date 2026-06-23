# SENTINEL AI v2.0
## Animated CCTV Threat Detection Platform

### Quick Start
Open `frontend/index.html` in Chrome or Firefox.
Login: `admin@sentinel.ai` / `sentinel2026`

### What's New in v2
- **8 fully animated CCTV feeds** — each with distinct threat scene
- **Realistic human figures** — layered body parts, skin tones, walking animation, arm/leg swing, facial features
- **4 unique threat scenarios per feed pair:**
  - CAM-01 & CAM-05: Kidnapping — suspect drags struggling victim
  - CAM-02 & CAM-06: Theft — pickpocket orbiting unaware victim
  - CAM-03 & CAM-07: Harassment — two suspects cornering victim
  - CAM-04 & CAM-08: Bag Stolen — suspect running with stolen luggage
- **Unique backgrounds per scene:** train platform with tiles, multi-storey car park with cars, marble departure hall with columns, vanishing-point corridor with wall lights
- **AI threat visualizations:** rotating reticle on suspects, proximity rings, drag vectors, struggle sparks, motion trails, danger zones, distress pulses
- **Film grain, vignette, REC indicator**, live timestamp on every feed
- **Real-time detection log** auto-updates every 3.4 seconds

### Navigate to Live CCTV
Click "Live CCTV (8 Feeds)" in the sidebar to activate all feeds.

### Files
```
sentinel-ai-v2/
└── frontend/
    ├── index.html       ← Full app shell + all page content
    ├── cctv-engine.js   ← Animated CCTV renderer (figures, backgrounds, AI FX)
    └── app.js           ← Navigation, charts, chatbot, network graph, modals
```

### No server needed — pure HTML/JS/Canvas.
