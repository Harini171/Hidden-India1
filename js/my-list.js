// ============================================================
// my-list.js — wires up my-list.html
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".seg-tab");
  const panels = { saved: document.getElementById("panel-saved"), trips: document.getElementById("panel-trips") };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(panels).forEach((p) => (p.style.display = "none"));
      panels[tab.dataset.panel].style.display = "block";
    });
  });

  function renderSaved() {
    const ids = HI_STORAGE.getFavorites();
    const list = hiAllDestinations().filter((d) => ids.includes(d.id));
    hiRenderCardsInto(
      document.getElementById("savedGrid"),
      list,
      "You haven't saved any destinations yet. Tap the heart icon on any destination to add it here."
    );
  }

  function renderTrips() {
    const trips = HI_STORAGE.getTrips();
    const wrap = document.getElementById("tripsList");
    if (!trips.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>No saved trips yet</h3><p>Head to <a href="plan-trip.html" style="color:var(--c-accent);font-weight:600;">Plan Trip</a> to build and save your first itinerary.</p></div>`;
      return;
    }
    wrap.innerHTML = trips
      .map((t) => {
        const dests = hiAllDestinations().filter((d) => (t.destinationIds || []).includes(d.id));
        const date = new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        return `
        <div class="trip-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--sp-3);">
            <div>
              <h4>${hiEscape(t.title || "My Trip")}</h4>
              <div class="trip-meta">Saved ${date} · ${t.duration ? t.duration + " days · " : ""}${t.budget ? "₹" + Number(t.budget).toLocaleString("en-IN") + " budget" : ""}</div>
            </div>
            <button class="btn-icon" data-delete-trip="${hiEscape(t.id)}" aria-label="Delete trip" title="Delete trip">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
          <div class="chip-list">
            ${dests.length
              ? dests.map((d) => `<a class="chip-link" href="destination.html?slug=${encodeURIComponent(d.slug)}">${hiEscape(d.name)}</a>`).join("")
              : `<span class="chip">Destinations no longer available</span>`}
          </div>
        </div>`;
      })
      .join("");

    wrap.querySelectorAll("[data-delete-trip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        HI_STORAGE.deleteTrip(btn.getAttribute("data-delete-trip"));
        hiToast("Trip deleted");
        renderTrips();
      });
    });
  }

  renderSaved();
  renderTrips();
  document.addEventListener("hi:favorites-changed", renderSaved);
});
