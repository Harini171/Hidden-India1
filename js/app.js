// ============================================================
// app.js — global functionality shared by every page:
// theme toggle, nav wiring, destination-card rendering,
// the search/recommendation engine, and small utilities.
// Depends on: destinations.js (HIDDEN_INDIA_DESTINATIONS), storage.js
// ============================================================

const HI_FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="100%" height="100%" fill="#dfd8c4"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#8a7f63" text-anchor="middle" dy=".3em">Hidden India</text></svg>'
  );

const HI_MOOD_IMAGES = {
  Peaceful: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=70",
  Adventurous: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=600&q=70",
  Cultural: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=70",
  Nature: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=600&q=70",
  Photography: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=600&q=70",
  Spiritual: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=70",
};

// Canonical "mood" categories shown on Home, each mapped to real
// dataset style tags so a click always filters real destinations.
const HI_MOODS = [
  { label: "Peaceful", styles: ["Peaceful Retreat", "Relaxed Escape", "Meditation"] },
  { label: "Adventurous", styles: ["Adventure", "Trek", "Trekking", "Rock Climbing", "Water Sports"] },
  { label: "Cultural", styles: ["Culture", "Heritage", "Heritage Walk", "History", "Temple Visit"] },
  { label: "Nature", styles: ["Nature", "Nature Walks", "Wildlife", "Forest Trail", "Waterfalls"] },
  { label: "Photography", styles: ["Photography"] },
  { label: "Spiritual", styles: ["Spiritual", "Spirituality", "Temple Visit", "Meditation"] },
];

// ---- Theme ----
function hiInitTheme() {
  const saved = HI_STORAGE.getTheme();
  const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}
function hiToggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  HI_STORAGE.setTheme(next);
}

// ---- Toast ----
let hiToastTimer = null;
function hiToast(msg) {
  let el = document.getElementById("hiToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "hiToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(hiToastTimer);
  hiToastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---- Nav wiring (mobile menu, theme toggle, active link, fav count) ----
function hiInitNav() {
  const burger = document.getElementById("navBurger");
  const mobile = document.getElementById("mobileNav");
  if (burger && mobile) {
    burger.addEventListener("click", () => mobile.classList.toggle("open"));
    mobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mobile.classList.remove("open")));
  }
  document.querySelectorAll(".theme-toggle").forEach((t) => t.addEventListener("click", hiToggleTheme));

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });
}

// ---- Data helpers ----
function hiAllDestinations() {
  return typeof HIDDEN_INDIA_DESTINATIONS !== "undefined" ? HIDDEN_INDIA_DESTINATIONS : [];
}
function hiFindBySlug(slug) {
  return hiAllDestinations().find((d) => d.slug === slug);
}
function hiFindByName(name) {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  return hiAllDestinations().find((d) => d.name.trim().toLowerCase() === norm);
}
function hiEscape(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
function hiImgOnError(imgEl) {
  imgEl.onerror = null;
  imgEl.src = HI_FALLBACK_IMG;
}

// ---- Destination card rendering ----
function hiRenderCard(d) {
  const isFav = HI_STORAGE.isFavorite(d.id);
  const tags = (d.styles || []).slice(0, 2);
  return `
  <article class="dest-card" data-id="${hiEscape(d.id)}">
    <a href="destination.html?slug=${encodeURIComponent(d.slug)}" class="dest-card-media" aria-label="${hiEscape(d.name)}">
      <img src="${hiEscape(d.cover) || HI_FALLBACK_IMG}" alt="${hiEscape(d.name)}" loading="lazy" onerror="hiImgOnError(this)">
    </a>
    <button class="dest-card-fav ${isFav ? "active" : ""}" data-fav-id="${hiEscape(d.id)}" aria-label="Save ${hiEscape(d.name)}" title="Save to My List">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2.3 5 5.7 5c2 0 3.4 1 4.3 2.4C10.9 6 12.3 5 14.3 5c3.4 0 5.2 3.4 3.7 6.8C19.5 16.4 12 21 12 21z"/></svg>
    </button>
    <div class="dest-card-body">
      <h3><a href="destination.html?slug=${encodeURIComponent(d.slug)}">${hiEscape(d.name)}</a></h3>
      <div class="dest-card-loc">${hiEscape(d.state)}</div>
      <div class="dest-card-tags">${tags.map((t) => `<span class="tag">${hiEscape(t)}</span>`).join("")}</div>
      <div class="dest-card-meta">
        <span>💰 ${hiEscape(d.budgetLabel || "—")}</span>
        <span>🗓️ ${d.durationDays ? d.durationDays + " Days" : "—"}</span>
        <span>👥 ${hiEscape(d.crowd || "—")}</span>
      </div>
      <div class="dest-card-footer">
        <a href="destination.html?slug=${encodeURIComponent(d.slug)}" class="btn btn-primary btn-sm btn-block">Explore →</a>
      </div>
    </div>
  </article>`;
}

function hiRenderCardsInto(container, list, emptyMsg) {
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>Nothing here yet</h3><p>${hiEscape(
      emptyMsg || "Try adjusting your filters or search."
    )}</p></div>`;
    return;
  }
  container.innerHTML = list.map(hiRenderCard).join("");
  hiWireFavButtons(container);
}

function hiWireFavButtons(scope) {
  (scope || document).querySelectorAll("[data-fav-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-fav-id");
      const nowFav = HI_STORAGE.toggleFavorite(id);
      btn.classList.toggle("active", nowFav);
      hiToast(nowFav ? "Saved to My List" : "Removed from My List");
      document.dispatchEvent(new CustomEvent("hi:favorites-changed"));
    });
  });
}

// ---- Search & recommendation engine ----
// Fallback hierarchy: exact name -> partial name/state/region/type ->
// style/activity keyword match -> alternative_to/nearby relation ->
// broader similar (same region) -> popular (first N) destinations.
function hiNormalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Small edit-distance helper for tolerating common spelling variations
// ("gokrna" -> "Gokarna", "banglore" -> "Bangalore"-ish state names).
function hiLevenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}
function hiFuzzyMatch(word, qNorm) {
  if (!word || !qNorm) return false;
  if (Math.abs(word.length - qNorm.length) > 3) return false;
  const maxDist = qNorm.length <= 4 ? 1 : qNorm.length <= 8 ? 2 : 3;
  return hiLevenshtein(word, qNorm) <= maxDist;
}

function hiSearchScore(d, qNorm) {
  const name = hiNormalize(d.name);
  if (name === qNorm) return 100;
  if (name.startsWith(qNorm)) return 90;
  if (name.includes(qNorm)) return 80;
  if (hiNormalize(d.state).includes(qNorm)) return 60;
  if (hiNormalize(d.region).includes(qNorm)) return 55;
  if (hiNormalize(d.type).includes(qNorm)) return 50;
  const styles = (d.styles || []).map(hiNormalize).join(" ");
  if (styles.includes(qNorm)) return 45;
  const haystack = [
    d.tagline,
    d.overview,
    (d.whyVisit || []).join(" "),
    (d.thingsToDo || []).join(" "),
    (d.food || []).join(" "),
    (d.cafes || []).join(" "),
    (d.seasons || []).join(" "),
    d.budgetLabel,
  ]
    .map(hiNormalize)
    .join(" ");
  if (haystack.includes(qNorm)) return 30;
  // Typo tolerance: fuzzy-match the query against the destination name
  // and its individual words (handles misspellings like "gokrna").
  if (hiFuzzyMatch(name, qNorm)) return 70;
  if (name.split(" ").some((w) => hiFuzzyMatch(w, qNorm))) return 65;
  if (hiFuzzyMatch(hiNormalize(d.state), qNorm)) return 40;
  return 0;
}

/**
 * hiSearch: returns { results, mode, label } where mode is one of
 * 'exact' | 'match' | 'related' | 'popular' — used to label the section.
 */
function hiSearch(query, limit) {
  const all = hiAllDestinations();
  const qNorm = hiNormalize(query);
  limit = limit || 60;

  if (!qNorm) {
    return { results: all.slice(0, limit), mode: "popular", label: "Popular Destinations" };
  }

  const scored = all
    .map((d) => ({ d, score: hiSearchScore(d, qNorm) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const top = scored[0].score;
    const mode = top >= 90 ? "exact" : top >= 45 ? "match" : "related";
    const label = mode === "exact" ? "Best Match" : mode === "match" ? "Matching Destinations" : "You May Also Like";
    return { results: scored.slice(0, limit).map((x) => x.d), mode, label };
  }

  // Nothing matched directly — try alternative_to / nearby relationships,
  // then fall back to popular destinations so the page is never empty.
  const relatedByAlt = all.filter((d) => hiNormalize(d.alternativeTo).includes(qNorm) || qNorm.includes(hiNormalize(d.alternativeTo)));
  if (relatedByAlt.length > 0) {
    return { results: relatedByAlt.slice(0, limit), mode: "related", label: "Alternative Destinations" };
  }

  return { results: all.slice(0, limit), mode: "popular", label: "Popular Destinations You Might Like" };
}

// Get "similar" destinations to a given one — used on the detail page
// and to broaden Plan Trip results. Scores on shared styles/state/type/budget.
function hiSimilarDestinations(base, limit) {
  limit = limit || 6;
  const all = hiAllDestinations().filter((d) => d.id !== base.id);
  const baseStyles = new Set(base.styles || []);
  const scored = all.map((d) => {
    let score = 0;
    (d.styles || []).forEach((s) => { if (baseStyles.has(s)) score += 3; });
    if (d.region === base.region) score += 2;
    if (d.state === base.state) score += 2;
    if (d.type === base.type) score += 1;
    if (d.crowd === base.crowd) score += 1;
    if (d.durationDays === base.durationDays) score += 1;
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.d);
}

function hiNearbyDestinations(base) {
  // nearby field is free-text names ("Cherrapunji (Sohra) (15 km)") — try
  // to resolve to a real record by matching the leading name; otherwise
  // keep as a plain text chip so we never invent data.
  return (base.nearby || []).map((raw) => {
    const cleanName = raw.replace(/\s*\([^)]*\)\s*/g, "").trim();
    const match = hiFindByName(cleanName);
    return { label: raw, dest: match || null };
  });
}

function hiAlternativeDestination(base) {
  if (!base.alternativeTo) return null;
  return { label: base.alternativeTo, dest: hiFindByName(base.alternativeTo) };
}

// Destinations that name THIS destination as their alternative_to.
function hiDestinationsAlternativeToThis(base) {
  return hiAllDestinations().filter((d) => hiNormalize(d.alternativeTo) === hiNormalize(base.name));
}

function hiRandomDestination() {
  const all = hiAllDestinations();
  const valid = all.filter((d) => d.slug && d.cover && d.name);
  return valid[Math.floor(Math.random() * valid.length)];
}

// ---- Google Maps / hotel search link builders (never fabricate URLs) ----
function hiGoogleMapsLink(d) {
  if (d.latitude != null && d.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name + ", " + d.state + ", India")}`;
}
function hiHotelSearchLink(d) {
  const q = encodeURIComponent(`hotels near ${d.name}, ${d.state}, India`);
  return `https://www.google.com/maps/search/${q}`;
}
function hiFoodSearchLink(d) {
  const q = encodeURIComponent(`restaurants and cafes near ${d.name}, ${d.state}, India`);
  return `https://www.google.com/maps/search/${q}`;
}

// ---- Live nearby places (food/beverage + stays) via OpenStreetMap Overpass ----
// Real, live-fetched OSM data only — never fabricated. Fails silently and
// caches per-destination so the mini map and the full map tab share one call.
const HI_POI_CACHE = {};
function hiFetchNearbyPOIs(destId, lat, lon, radiusM) {
  if (HI_POI_CACHE[destId]) return HI_POI_CACHE[destId];
  radiusM = radiusM || 3000;
  const query = `[out:json][timeout:8];(
    node["amenity"~"^(restaurant|cafe|fast_food|bar|pub)$"](around:${radiusM},${lat},${lon});
    node["amenity"~"^(hotel|guest_house|hostel)$"](around:${radiusM},${lat},${lon});
    node["tourism"="hotel"](around:${radiusM},${lat},${lon});
  );out center 40;`;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

  const promise = fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    signal: controller ? controller.signal : undefined,
  })
    .then((r) => (r.ok ? r.json() : { elements: [] }))
    .then((data) => {
      const elements = (data && data.elements) || [];
      const food = [];
      const stay = [];
      elements.forEach((el) => {
        const tags = el.tags || {};
        const name = tags.name || (tags.amenity ? "Unnamed " + tags.amenity.replace(/_/g, " ") : null);
        if (!name || el.lat == null || el.lon == null) return;
        const item = { name, lat: el.lat, lon: el.lon, kind: tags.amenity || tags.tourism || "place" };
        if (["hotel", "guest_house", "hostel"].includes(item.kind)) stay.push(item);
        else food.push(item);
      });
      return { food: food.slice(0, 20), stay: stay.slice(0, 15) };
    })
    .catch(() => ({ food: [], stay: [] }))
    .finally(() => { if (timeoutId) clearTimeout(timeoutId); });

  HI_POI_CACHE[destId] = promise;
  return promise;
}

document.addEventListener("DOMContentLoaded", () => {
  hiInitTheme();
  hiInitNav();
});
