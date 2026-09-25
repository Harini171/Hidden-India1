// ============================================================
// explore.js — wires up explore.html
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const all = hiAllDestinations();
  const PAGE_SIZE = 24;
  let visibleCount = PAGE_SIZE;

  const els = {
    search: document.getElementById("searchInput"),
    form: document.getElementById("searchForm"),
    state: document.getElementById("fState"),
    region: document.getElementById("fRegion"),
    type: document.getElementById("fType"),
    style: document.getElementById("fStyle"),
    budget: document.getElementById("fBudget"),
    duration: document.getElementById("fDuration"),
    season: document.getElementById("fSeason"),
    crowd: document.getElementById("fCrowd"),
    sort: document.getElementById("sortSelect"),
    grid: document.getElementById("resultsGrid"),
    count: document.getElementById("resultsCount"),
    banner: document.getElementById("fallbackBanner"),
    reset: document.getElementById("resetLink"),
    loadMoreWrap: document.getElementById("loadMoreWrap"),
    loadMoreBtn: document.getElementById("loadMoreBtn"),
  };

  function fillSelect(el, values, formatter) {
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = formatter ? formatter(v) : v;
      el.appendChild(opt);
    });
  }
  fillSelect(els.state, [...new Set(all.map((d) => d.state))].sort());
  fillSelect(els.region, [...new Set(all.map((d) => d.region))].sort());
  fillSelect(els.type, [...new Set(all.map((d) => d.type))].sort());
  fillSelect(
    els.style,
    [...new Set(all.flatMap((d) => d.styles || []))].sort()
  );
  fillSelect(els.budget, [...new Set(all.map((d) => d.budgetLabel))]);
  fillSelect(els.duration, [...new Set(all.map((d) => d.durationDays))].sort((a, b) => a - b), (v) => v + " Days");
  fillSelect(els.season, [...new Set(all.flatMap((d) => d.seasons || []))].sort());
  fillSelect(els.crowd, [...new Set(all.map((d) => d.crowd))]);

  // ---- Read initial state from URL ----
  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) els.search.value = params.get("q");
  if (params.get("state")) els.state.value = params.get("state");
  if (params.get("region")) els.region.value = params.get("region");
  if (params.get("type")) els.type.value = params.get("type");
  if (params.get("style")) els.style.value = params.get("style");
  if (params.get("budget")) els.budget.value = params.get("budget");
  if (params.get("duration")) els.duration.value = params.get("duration");
  if (params.get("season")) els.season.value = params.get("season");
  if (params.get("crowd")) els.crowd.value = params.get("crowd");
  const moodParam = params.get("mood");
  const moodStyles = moodParam ? (HI_MOODS.find((m) => m.label === moodParam) || {}).styles || [] : null;

  function applyFilters(list) {
    let out = list;
    if (els.state.value) out = out.filter((d) => d.state === els.state.value);
    if (els.region.value) out = out.filter((d) => d.region === els.region.value);
    if (els.type.value) out = out.filter((d) => d.type === els.type.value);
    if (els.style.value) out = out.filter((d) => (d.styles || []).includes(els.style.value));
    if (els.budget.value) out = out.filter((d) => d.budgetLabel === els.budget.value);
    if (els.duration.value) out = out.filter((d) => String(d.durationDays) === els.duration.value);
    if (els.season.value) out = out.filter((d) => (d.seasons || []).includes(els.season.value));
    if (els.crowd.value) out = out.filter((d) => d.crowd === els.crowd.value);
    if (moodStyles && moodStyles.length) out = out.filter((d) => (d.styles || []).some((s) => moodStyles.includes(s)));
    return out;
  }

  function applySort(list) {
    const v = els.sort.value;
    const copy = [...list];
    if (v === "name-asc") copy.sort((a, b) => a.name.localeCompare(b.name));
    else if (v === "name-desc") copy.sort((a, b) => b.name.localeCompare(a.name));
    else if (v === "budget-asc") copy.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    else if (v === "budget-desc") copy.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    else if (v === "duration-asc") copy.sort((a, b) => (a.durationDays || 0) - (b.durationDays || 0));
    return copy;
  }

  function anyFilterActive() {
    return [els.state, els.region, els.type, els.style, els.budget, els.duration, els.season, els.crowd].some((s) => s.value) || moodStyles;
  }

  function render() {
    const query = els.search.value.trim();
    let resultSet, mode, label;

    if (query) {
      const searched = hiSearch(query, 400);
      resultSet = searched.results;
      mode = searched.mode;
      label = searched.label;
      resultSet = applyFilters(resultSet);
    } else {
      resultSet = applyFilters(all);
      mode = resultSet.length ? "match" : "popular";
      label = "";
    }

    // If filters+search produced nothing, broaden gracefully rather than a blank page.
    if (resultSet.length === 0) {
      if (query) {
        // fall back to popular destinations still respecting filters where possible
        let broadened = applyFilters(all);
        if (broadened.length === 0) broadened = all;
        resultSet = broadened.slice(0, 60);
        mode = "popular";
        label = "No exact matches — here are destinations you might like instead";
      } else {
        resultSet = all.slice(0, 60);
        mode = "popular";
        label = "No destinations match these filters — showing popular picks instead";
      }
    }

    resultSet = applySort(resultSet);

    // Banner for non-exact modes
    if (mode !== "match" || (query && mode !== "exact")) {
      if (query || mode === "popular") {
        els.banner.innerHTML = `<div class="fallback-banner">${hiEscape(label || "Similar Destinations")}</div>`;
      } else {
        els.banner.innerHTML = "";
      }
    } else {
      els.banner.innerHTML = "";
    }

    const total = resultSet.length;
    els.count.textContent = `Showing ${Math.min(visibleCount, total)} of ${total} destination${total === 1 ? "" : "s"}`;

    const page = resultSet.slice(0, visibleCount);
    hiRenderCardsInto(els.grid, page, "Try a different search term or reset your filters.");

    els.loadMoreWrap.style.display = total > visibleCount ? "block" : "none";
  }

  function syncURL() {
    const p = new URLSearchParams();
    if (els.search.value.trim()) p.set("q", els.search.value.trim());
    if (els.state.value) p.set("state", els.state.value);
    if (els.region.value) p.set("region", els.region.value);
    if (els.type.value) p.set("type", els.type.value);
    if (els.style.value) p.set("style", els.style.value);
    if (els.budget.value) p.set("budget", els.budget.value);
    if (els.duration.value) p.set("duration", els.duration.value);
    if (els.season.value) p.set("season", els.season.value);
    if (els.crowd.value) p.set("crowd", els.crowd.value);
    const qs = p.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  [els.state, els.region, els.type, els.style, els.budget, els.duration, els.season, els.crowd, els.sort].forEach((el) => {
    el.addEventListener("change", () => {
      visibleCount = PAGE_SIZE;
      syncURL();
      render();
    });
  });
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    visibleCount = PAGE_SIZE;
    syncURL();
    render();
  });
  els.reset.addEventListener("click", (e) => {
    e.preventDefault();
    [els.search].forEach((el) => (el.value = ""));
    [els.state, els.region, els.type, els.style, els.budget, els.duration, els.season, els.crowd].forEach((el) => (el.value = ""));
    visibleCount = PAGE_SIZE;
    history.replaceState(null, "", window.location.pathname);
    render();
  });
  els.loadMoreBtn.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    render();
  });
  document.addEventListener("hi:favorites-changed", () => {}); // cards re-render on next filter action; fav state read live from storage

  render();
});
