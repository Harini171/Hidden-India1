// ============================================================
// home.js — wires up index.html
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const all = hiAllDestinations();

  // ---- Populate hero filter selects from real dataset values ----
  function fillSelect(el, values, formatter) {
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = formatter ? formatter(v) : v;
      el.appendChild(opt);
    });
  }
  const states = [...new Set(all.map((d) => d.state))].sort();
  const types = [...new Set(all.map((d) => d.type))].sort();
  const budgets = [...new Set(all.map((d) => d.budgetLabel))];
  const durations = [...new Set(all.map((d) => d.durationDays))].sort((a, b) => a - b);

  fillSelect(document.getElementById("fState"), states);
  fillSelect(document.getElementById("fType"), types);
  fillSelect(document.getElementById("fBudget"), budgets);
  fillSelect(document.getElementById("fDuration"), durations, (v) => v + " Days");
  fillSelect(document.getElementById("fMood"), HI_MOODS.map((m) => m.label));

  function goExplore(params) {
    const qs = new URLSearchParams(params).toString();
    window.location.href = "explore.html" + (qs ? "?" + qs : "");
  }

  ["fState", "fType", "fBudget", "fDuration", "fMood"].forEach((id) => {
    document.getElementById(id).addEventListener("change", function () {
      if (!this.value) return;
      const map = { fState: "state", fType: "type", fBudget: "budget", fDuration: "duration", fMood: "mood" };
      goExplore({ [map[id]]: this.value });
    });
  });

  document.getElementById("heroSearchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("heroSearchInput").value.trim();
    goExplore(q ? { q } : {});
  });

  // ---- Surprise Me ----
  function surpriseMe() {
    const d = hiRandomDestination();
    if (d) window.location.href = "destination.html?slug=" + encodeURIComponent(d.slug);
  }
  document.getElementById("surpriseBtn").addEventListener("click", surpriseMe);
  document.getElementById("footerSurprise").addEventListener("click", (e) => { e.preventDefault(); surpriseMe(); });

  // ---- Mood grid ----
  const moodGrid = document.getElementById("moodGrid");
  moodGrid.innerHTML = HI_MOODS.map(
    (m) => `
    <a class="mood-card" href="explore.html?mood=${encodeURIComponent(m.label)}">
      <img src="${m.image || HI_MOOD_IMAGES[m.label]}" alt="${m.label}" loading="lazy" onerror="hiImgOnError(this)">
      <span>${m.label}</span>
    </a>`
  ).join("");

  // ---- Curated destinations: a deterministic, varied sample of real records ----
  const curated = [];
  const seenStates = new Set();
  for (const d of all) {
    if (curated.length >= 6) break;
    if (!seenStates.has(d.state)) {
      curated.push(d);
      seenStates.add(d.state);
    }
  }
  hiRenderCardsInto(document.getElementById("curatedGrid"), curated);
});
