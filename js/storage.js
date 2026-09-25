// ============================================================
// storage.js — small localStorage wrapper. All favorites, saved
// trips and the theme preference live here. No backend, no DB.
// ============================================================

const HI_STORAGE = (() => {
  const KEYS = {
    favorites: "hi_favorites",
    trips: "hi_trips",
    theme: "hi_theme",
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    getFavorites() {
      return safeGet(KEYS.favorites, []);
    },
    isFavorite(id) {
      return this.getFavorites().includes(id);
    },
    toggleFavorite(id) {
      const favs = this.getFavorites();
      const idx = favs.indexOf(id);
      if (idx >= 0) favs.splice(idx, 1);
      else favs.push(id);
      safeSet(KEYS.favorites, favs);
      return idx < 0; // true if now favorited
    },
    removeFavorite(id) {
      const favs = this.getFavorites().filter((x) => x !== id);
      safeSet(KEYS.favorites, favs);
    },

    getTrips() {
      return safeGet(KEYS.trips, []);
    },
    saveTrip(trip) {
      const trips = this.getTrips();
      trips.unshift({ ...trip, id: "trip_" + Date.now(), createdAt: new Date().toISOString() });
      safeSet(KEYS.trips, trips);
      return trips;
    },
    deleteTrip(tripId) {
      const trips = this.getTrips().filter((t) => t.id !== tripId);
      safeSet(KEYS.trips, trips);
      return trips;
    },

    getTheme() {
      return safeGet(KEYS.theme, null);
    },
    setTheme(theme) {
      safeSet(KEYS.theme, theme);
    },
  };
})();
