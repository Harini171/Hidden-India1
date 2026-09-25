# Hidden India

**Discover the India You Haven't Seen.**

A complete, client-side travel discovery website covering all **328 offbeat Indian destinations** from `data/hidden_india_cleaned.csv`. Pure HTML5, CSS3 and vanilla JavaScript — no backend, no database, no build step.

## Run it

1. Unzip the project.
2. Double-click `index.html` (or open it in any browser).

That's it. Every page works directly from `file://`, because all 328 destinations are baked into `js/destinations.js` as a plain JavaScript array — nothing is fetched at runtime.

## Deploy it

Upload the folder as-is to GitHub Pages, Netlify, Vercel, or any static host. No environment variables, no server, no database.

## Project structure

```
Hidden-India/
├── index.html              Home — hero, filters, mood grid, curated picks
├── explore.html             All 328 destinations, search + combinable filters
├── destination.html         Dynamic destination detail page (?slug=...)
├── plan-trip.html           Preference-based trip recommender
├── recommendations.html     Curated category sections
├── my-list.html             Saved destinations & saved trips (localStorage)
│
├── css/
│   ├── style.css             Design system: variables, layout, components
│   ├── responsive.css        Tablet/mobile refinements
│   └── dark-mode.css         Dark-mode-only overrides
│
├── js/
│   ├── destinations.js       All 328 destinations (generated from the CSV)
│   ├── app.js                 Shared logic: theme, nav, cards, search engine
│   ├── home.js / explore.js / destination.js / plan-trip.js /
│   │   recommendations.js / my-list.js   Page-specific logic
│   └── storage.js             localStorage wrapper (favorites, trips, theme)
│
├── assets/                   Images, icons, logo (all photography is hot-linked
│                              from the dataset's own Unsplash/Wikimedia URLs)
├── data/
│   └── hidden_india_cleaned.csv   Source of truth — kept for reference/re-export
└── README.md
```

## How the data flows

`data/hidden_india_cleaned.csv` is the source of truth. It's pre-converted into `js/destinations.js` (a plain `const HIDDEN_INDIA_DESTINATIONS = [...]`) so the site never depends on `fetch()` or JSON loading, which is unreliable under `file://`. If you edit the CSV, regenerate `destinations.js` with any CSV → JSON → JS conversion of your choice — the field names in the JS objects mirror the CSV columns (camelCased), with `difficulty` intentionally dropped.

## Notable behavior

- **Search** never dead-ends: exact match → partial match → state/region/type match → style/activity match → alternative/nearby relation → popular picks. A labelled banner ("You May Also Like", "Alternative Destinations", etc.) explains what's being shown whenever it isn't an exact hit.
- **Live map** on every destination page uses Leaflet + OpenStreetMap with the record's real latitude/longitude, plus a genuine "Open in Google Maps" link. No coordinates are invented; if any are missing the map area shows a clear fallback instead of breaking.
- **Stay / hotels**: since the dataset has no hotel field, "Find Hotels Nearby" opens a real Google Maps hotel search for the destination's name and state — never a fabricated link.
- **Favorites & trips** live entirely in `localStorage`, so they persist across reloads without any account or server.
- **Dark mode** persists via `localStorage` and covers every page and component.

## Extending toward a PWA / app

All data, search and favorites logic is already isolated in `js/` and framework-free, so a web app manifest, service worker and icon set can be layered on later without touching the core logic.
