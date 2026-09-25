// ============================================================
// destination.js — wires up destination.html
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const d = slug ? hiFindBySlug(slug) : null;

  if (!d) {
    document.getElementById("notFound").style.display = "block";
    return;
  }
  document.getElementById("detailRoot").style.display = "block";

  document.title = `${d.name} — Hidden India`;
  const descEl = document.getElementById("pageDesc");
  if (descEl) descEl.setAttribute("content", d.tagline || d.overview || "");

  const cover = d.cover || HI_FALLBACK_IMG;
  const heroImg = document.getElementById("heroImg");
  heroImg.src = cover;
  heroImg.alt = d.name;
  heroImg.onerror = () => hiImgOnError(heroImg);

  document.getElementById("locLine").textContent = `${d.state} · ${d.region}`;
  document.getElementById("destName").textContent = d.name;
  document.getElementById("tagline").textContent = d.tagline || "";

  document.getElementById("styleTags").innerHTML = (d.styles || [])
    .slice(0, 5)
    .map((s) => `<span class="tag-light">${hiEscape(s)}</span>`)
    .join("");

  document.getElementById("metaBudget").textContent = d.budgetLabel || "—";
  document.getElementById("metaDuration").textContent = d.durationDays ? d.durationDays + " Days" : "—";
  document.getElementById("metaSeason").textContent = d.bestSeason || "—";
  document.getElementById("metaCrowd").textContent = d.crowd || "—";

  document.getElementById("qfState").textContent = d.state || "—";
  document.getElementById("qfRegion").textContent = d.region || "—";
  document.getElementById("qfType").textContent = d.type || "—";
  document.getElementById("qfSeasons").textContent = (d.seasons || []).join(", ") || "—";

  document.getElementById("planTripBtn").href = "plan-trip.html?slug=" + encodeURIComponent(d.slug);

  // ---- Favorite ----
  const favBtn = document.getElementById("favBtn");
  function syncFav() { favBtn.classList.toggle("active", HI_STORAGE.isFavorite(d.id)); }
  syncFav();
  favBtn.addEventListener("click", () => {
    const now = HI_STORAGE.toggleFavorite(d.id);
    syncFav();
    hiToast(now ? "Saved to My List" : "Removed from My List");
  });

  // ---- Share ----
  document.getElementById("shareBtn").addEventListener("click", async () => {
    const url = window.location.href;
    const shareData = { title: d.name + " — Hidden India", text: d.tagline || "Check out this hidden India destination.", url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled — no-op */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        hiToast("Link copied to clipboard");
      } catch (e) {
        hiToast("Share this link: " + url);
      }
    }
  });

  // ---- Gallery ----
  const gallery = (d.gallery && d.gallery.length ? d.gallery : [d.cover]).filter(Boolean);
  document.getElementById("galleryStrip").innerHTML = gallery
    .map((src) => `<img src="${hiEscape(src)}" alt="${hiEscape(d.name)} photo" loading="lazy" onerror="hiImgOnError(this)">`)
    .join("") || "";
  if (gallery.length === 0) document.getElementById("galleryStrip").style.display = "none";

  // ---- Tabs ----
  const tabs = document.querySelectorAll(".detail-tab");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab === "map" && window.hiInitLargeMap) window.hiInitLargeMap();
    });
  });

  // ---- Overview / Why Visit ----
  document.getElementById("overviewText").textContent = d.overview || d.tagline || "No overview available for this destination yet.";
  const whyVisitIcons = ["✨", "🏔️", "🛕", "🌿", "📸", "🌄"];
  const whyGrid = document.getElementById("whyVisitGrid");
  if (d.whyVisit && d.whyVisit.length) {
    whyGrid.innerHTML = d.whyVisit
      .slice(0, 8)
      .map((w, i) => {
        const [title, ...rest] = String(w).split(":");
        const sub = rest.join(":").trim();
        return `<div class="info-card"><div style="font-size:1.3rem;">${whyVisitIcons[i % whyVisitIcons.length]}</div><div class="info-title">${hiEscape(sub ? title : title.slice(0, 40))}</div>${sub ? `<div class="info-sub">${hiEscape(sub.slice(0, 90))}</div>` : ""}</div>`;
      })
      .join("");
  } else {
    whyGrid.innerHTML = `<div class="empty-state"><p>No highlights listed for this destination yet.</p></div>`;
  }

  // ---- Things to do ----
  const thingsGrid = document.getElementById("thingsGrid");
  if (d.thingsToDo && d.thingsToDo.length) {
    thingsGrid.innerHTML = d.thingsToDo
      .map((t) => {
        const [title, ...rest] = String(t).split(":");
        const sub = rest.join(":").trim();
        return `<div class="item-card"><div class="item-card-body"><h4>${hiEscape(sub ? title : title)}</h4>${sub ? `<p>${hiEscape(sub)}</p>` : ""}</div></div>`;
      })
      .join("");
  } else {
    thingsGrid.innerHTML = `<div class="empty-state"><p>No activities listed yet for this destination.</p></div>`;
  }

  // ---- Food & cafes ----
  const foodChips = document.getElementById("foodChips");
  foodChips.innerHTML = (d.food || []).length
    ? d.food.map((f) => `<span class="chip">${hiEscape(f)}</span>`).join("")
    : `<div class="empty-state"><p>No local food info available.</p></div>`;
  const cafeChips = document.getElementById("cafeChips");
  cafeChips.innerHTML = (d.cafes || []).length
    ? d.cafes.map((c) => `<span class="chip">${hiEscape(c)}</span>`).join("")
    : `<div class="empty-state"><p>No café recommendations available.</p></div>`;

  // ---- Photo spots ----
  const photoGrid = document.getElementById("photoGrid");
  if (d.photoSpots && d.photoSpots.length) {
    photoGrid.innerHTML = d.photoSpots
      .map((p, i) => {
        const [title, ...rest] = String(p).split(":");
        const sub = rest.join(":").trim();
        const img = gallery[i % gallery.length] || cover;
        return `<div class="item-card"><img src="${hiEscape(img)}" alt="${hiEscape(title)}" loading="lazy" onerror="hiImgOnError(this)"><div class="item-card-body"><h4>${hiEscape(sub ? title : title)}</h4>${sub ? `<p>${hiEscape(sub)}</p>` : ""}</div></div>`;
      })
      .join("");
  } else {
    photoGrid.innerHTML = `<div class="empty-state"><p>No specific photo spots listed yet.</p></div>`;
  }

  // ---- Nearby & alternatives ----
  const nearby = hiNearbyDestinations(d);
  const nearbyChips = document.getElementById("nearbyChips");
  nearbyChips.innerHTML = nearby.length
    ? nearby
        .map((n) =>
          n.dest
            ? `<a class="chip-link" href="destination.html?slug=${encodeURIComponent(n.dest.slug)}">${hiEscape(n.label)}</a>`
            : `<span class="chip">${hiEscape(n.label)}</span>`
        )
        .join("")
    : `<div class="empty-state"><p>No nearby places listed for this destination.</p></div>`;

  const alt = hiAlternativeDestination(d);
  const altChips = document.getElementById("altChips");
  altChips.innerHTML = alt
    ? alt.dest
      ? `<a class="chip-link" href="destination.html?slug=${encodeURIComponent(alt.dest.slug)}">A quieter alternative to ${hiEscape(alt.label)}</a>`
      : `<span class="chip">A quieter alternative to ${hiEscape(alt.label)}</span>`
    : `<div class="empty-state"><p>No alternative comparison listed.</p></div>`;

  const similar = hiSimilarDestinations(d, 6);
  hiRenderCardsInto(document.getElementById("similarGrid"), similar, "No similar destinations found.");

  // ---- Stay ----
  document.getElementById("findStayBtn").href = hiHotelSearchLink(d);
  document.getElementById("findFoodBtn").href = hiFoodSearchLink(d);

  // ---- Map (sidebar, small) + large tab map ----
  const gmapsUrl = hiGoogleMapsLink(d);
  document.getElementById("gmapsLink").href = gmapsUrl;
  document.getElementById("gmapsLinkLarge").href = gmapsUrl;

  function buildMap(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    if (d.latitude == null || d.longitude == null || typeof L === "undefined") {
      el.innerHTML = `<div class="map-fallback">Map coordinates aren't available for this destination. Use "Open in Google Maps" instead.</div>`;
      return null;
    }
    try {
      el.innerHTML = "";
      const map = L.map(containerId, { scrollWheelZoom: false }).setView([d.latitude, d.longitude], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);
      L.marker([d.latitude, d.longitude]).addTo(map).bindPopup(`<strong>${hiEscape(d.name)}</strong>`).openPopup();
      return map;
    } catch (e) {
      el.innerHTML = `<div class="map-fallback">Map could not be loaded. Use "Open in Google Maps" instead.</div>`;
      return null;
    }
  }

  function plotPOIs(map, legendId) {
    if (!map || d.latitude == null || d.longitude == null) return;
    const legend = document.getElementById(legendId);
    if (legend) legend.textContent = "Finding nearby food, cafés & stays…";
    hiFetchNearbyPOIs(d.id, d.latitude, d.longitude).then(({ food, stay }) => {
      food.forEach((p) => {
        L.circleMarker([p.lat, p.lon], { radius: 6, color: "#C89B3C", fillColor: "#C89B3C", fillOpacity: 0.9, weight: 1 })
          .addTo(map)
          .bindPopup(`🍽️ <strong>${hiEscape(p.name)}</strong><br>${hiEscape(p.kind.replace(/_/g, " "))}`);
      });
      stay.forEach((p) => {
        L.circleMarker([p.lat, p.lon], { radius: 6, color: "#1F6F54", fillColor: "#1F6F54", fillOpacity: 0.9, weight: 1 })
          .addTo(map)
          .bindPopup(`🛏️ <strong>${hiEscape(p.name)}</strong><br>${hiEscape(p.kind.replace(/_/g, " "))}`);
      });
      if (legend) {
        if (food.length || stay.length) {
          legend.innerHTML = `<span style="color:#C89B3C;">●</span> Food &amp; cafés (${food.length}) &nbsp; <span style="color:#1F6F54;">●</span> Stays (${stay.length}) — live OpenStreetMap data`;
        } else {
          legend.textContent = "No nearby food, café or stay listings found in OpenStreetMap for this area yet.";
        }
      }
    });
  }

  const miniMap = buildMap("detailMap");
  plotPOIs(miniMap, "mapLegend");

  let largeMapBuilt = false;
  window.hiInitLargeMap = function () {
    if (largeMapBuilt) return;
    largeMapBuilt = true;
    const bigMap = buildMap("detailMapLarge");
    plotPOIs(bigMap, "mapLegendLarge");
  };
});
