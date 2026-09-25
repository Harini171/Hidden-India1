// ============================================================
// plan-trip.js — wires up plan-trip.html
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const all = hiAllDestinations();

  const regionSel = document.getElementById("pRegion");
  [...new Set(all.map((d) => d.region))].sort().forEach((r) => {
    const o = document.createElement("option");
    o.value = r; o.textContent = r;
    regionSel.appendChild(o);
  });

  const typeSel = document.getElementById("pType");
  [...new Set(all.map((d) => d.type))].sort().forEach((t) => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    typeSel.appendChild(o);
  });

  // Mood chips (reuse HI_MOODS)
  const moodGroup = document.getElementById("pMoodGroup");
  let selectedMood = null;
  moodGroup.innerHTML = HI_MOODS.map((m) => `<button type="button" class="chip-toggle" data-mood="${hiEscape(m.label)}">${hiEscape(m.label)}</button>`).join("");
  moodGroup.querySelectorAll(".chip-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const already = btn.classList.contains("selected");
      moodGroup.querySelectorAll(".chip-toggle").forEach((b) => b.classList.remove("selected"));
      if (!already) {
        btn.classList.add("selected");
        selectedMood = btn.dataset.mood;
      } else {
        selectedMood = null;
      }
    });
  });

  let lastResults = [];

  const budgetInput = document.getElementById("pBudget");
  const budgetVal = document.getElementById("pBudgetVal");
  budgetInput.addEventListener("input", () => {
    budgetVal.textContent = "₹" + Number(budgetInput.value).toLocaleString("en-IN");
  });

  function scoreDestination(d, prefs) {
    let score = 0;
    if (prefs.region && d.region === prefs.region) score += 4;
    if (prefs.type && d.type === prefs.type) score += 3;
    if (prefs.duration && String(d.durationDays) === prefs.duration) score += 3;
    if (prefs.crowd && d.crowd === prefs.crowd) score += 2;
    if (prefs.moodStyles && prefs.moodStyles.length) {
      const overlap = (d.styles || []).filter((s) => prefs.moodStyles.includes(s)).length;
      score += overlap * 2;
    }
    if (prefs.budget && d.budget != null) {
      const diff = Math.abs(d.budget - prefs.budget);
      score += Math.max(0, 5 - diff / 4000);
    }
    return score;
  }

  function renderResults(list, fallbackMsg) {
    const wrap = document.getElementById("planResults");
    const countEl = document.getElementById("planCount");
    const bannerEl = document.getElementById("planFallback");
    countEl.textContent = list.length ? `${list.length} matches` : "";
    bannerEl.innerHTML = fallbackMsg ? `<div class="fallback-banner">${hiEscape(fallbackMsg)}</div>` : "";

    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state"><h3>No destinations available</h3><p>Try broadening your preferences.</p></div>`;
      return;
    }
    wrap.innerHTML = list
      .map(
        (d) => `
      <div class="result-card">
        <img src="${hiEscape(d.cover) || HI_FALLBACK_IMG}" alt="${hiEscape(d.name)}" loading="lazy" onerror="hiImgOnError(this)">
        <div class="result-card-body">
          <h4>${hiEscape(d.name)}</h4>
          <div class="loc">${hiEscape(d.state)}</div>
          <p>${hiEscape(d.tagline || "")}</p>
          <a class="view" href="destination.html?slug=${encodeURIComponent(d.slug)}">View Details →</a>
        </div>
      </div>`
      )
      .join("");
  }

  function findTrip() {
    const prefs = {
      region: regionSel.value,
      type: typeSel.value,
      duration: document.getElementById("pDuration").value,
      crowd: document.getElementById("pCrowd").value,
      budget: Number(budgetInput.value),
      moodStyles: selectedMood ? (HI_MOODS.find((m) => m.label === selectedMood) || {}).styles : null,
    };

    let scored = all.map((d) => ({ d, score: scoreDestination(d, prefs) })).sort((a, b) => b.score - a.score);
    let top = scored.filter((x) => x.score > 0).map((x) => x.d);

    let fallbackMsg = null;
    if (top.length < 3) {
      // Broaden: drop the least-important constraints one by one so the
      // screen is never empty.
      const relaxed = { ...prefs, crowd: "", duration: "" };
      let scored2 = all.map((d) => ({ d, score: scoreDestination(d, relaxed) })).sort((a, b) => b.score - a.score);
      let top2 = scored2.filter((x) => x.score > 0).map((x) => x.d);
      if (top2.length >= top.length) {
        top = top2;
        fallbackMsg = "We broadened your preferences slightly to find more great matches.";
      }
      if (top.length === 0) {
        top = all.slice(0, 12);
        fallbackMsg = "No close matches for those exact preferences — here are some popular Hidden India picks instead.";
      }
    }

    lastResults = top.slice(0, 12);
    renderResults(lastResults, fallbackMsg);
  }

  document.getElementById("planForm").addEventListener("submit", (e) => {
    e.preventDefault();
    findTrip();
  });

  document.getElementById("saveTripBtn").addEventListener("click", () => {
    if (!lastResults.length) { hiToast("Find a trip first"); return; }
    HI_STORAGE.saveTrip({
      title: (regionSel.value || "All India") + (selectedMood ? " · " + selectedMood : ""),
      region: regionSel.value,
      mood: selectedMood,
      budget: Number(budgetInput.value),
      duration: document.getElementById("pDuration").value,
      destinationIds: lastResults.slice(0, 6).map((d) => d.id),
    });
    hiToast("Trip saved to My List");
  });

  // Preselect a mood/region if arriving with ?slug= from a destination page
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (slug) {
    const d = hiFindBySlug(slug);
    if (d) {
      regionSel.value = d.region;
      typeSel.value = d.type;
    }
  }

  findTrip();
});
