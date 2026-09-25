// ============================================================
// recommendations.js — wires up recommendations.html
// Categories are generated dynamically against real style tags
// present in the dataset, so every section is guaranteed to have
// real destinations behind it.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const all = hiAllDestinations();
  const container = document.getElementById("recoContainer");

  const CATEGORIES = [
    { label: "Peaceful Escapes", styles: ["Peaceful Retreat", "Relaxed Escape", "Meditation"], icon: "🧘" },
    { label: "Adventure", styles: ["Adventure", "Trekking", "Rock Climbing", "Water Sports"], icon: "🧗" },
    { label: "Nature & Wildlife", styles: ["Nature", "Nature Walks", "Wildlife", "Forest Trail"], icon: "🌿" },
    { label: "Culture & Heritage", styles: ["Culture", "Heritage", "Heritage Walk", "History"], icon: "🏛️" },
    { label: "Spirituality", styles: ["Spiritual", "Spirituality", "Temple Visit"], icon: "🛕" },
    { label: "Photography", styles: ["Photography"], icon: "📸" },
    { label: "Beaches", types: ["Beach"], icon: "🏖️" },
    { label: "Mountains & Valleys", types: ["Mountain", "Valley"], icon: "⛰️" },
  ];

  let html = "";
  CATEGORIES.forEach((cat) => {
    let matches;
    if (cat.styles) {
      matches = all.filter((d) => (d.styles || []).some((s) => cat.styles.includes(s)));
    } else {
      matches = all.filter((d) => cat.types.includes(d.type));
    }
    if (matches.length === 0) return; // never render an empty category
    const picks = matches.slice(0, 6);
    const seeAllHref = cat.styles
      ? `explore.html?style=${encodeURIComponent(cat.styles[0])}`
      : `explore.html?type=${encodeURIComponent(cat.types[0])}`;

    html += `
    <section class="section" style="padding-top:var(--sp-6);padding-bottom:var(--sp-6);">
      <div class="container">
        <div class="section-head">
          <div><div class="eyebrow">${cat.icon} ${matches.length} destinations</div><h2>${hiEscape(cat.label)}</h2></div>
          <a href="${seeAllHref}" class="section-link">See all →</a>
        </div>
        <div class="card-grid" data-cat="${hiEscape(cat.label)}"></div>
      </div>
    </section>`;
  });

  container.innerHTML = html;

  CATEGORIES.forEach((cat) => {
    const grid = container.querySelector(`[data-cat="${cat.label}"]`);
    if (!grid) return;
    let matches = cat.styles
      ? all.filter((d) => (d.styles || []).some((s) => cat.styles.includes(s)))
      : all.filter((d) => cat.types.includes(d.type));
    hiRenderCardsInto(grid, matches.slice(0, 6));
  });
});
