(function attachStorageUtils(globalScope) {
  const storageKey = "rmroads-ai-prototype-state-v1";

  function loadState() {
    if (!hasLocalStorage()) return null;

    try {
      const raw = globalScope.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Failed to load RMRoads AI prototype state", error);
      return null;
    }
  }

  function saveState(state) {
    if (!hasLocalStorage()) return false;

    try {
      globalScope.localStorage.setItem(storageKey, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn("Failed to save RMRoads AI prototype state", error);
      return false;
    }
  }

  function clearState() {
    if (!hasLocalStorage()) return false;
    globalScope.localStorage.removeItem(storageKey);
    return true;
  }

  function hasLocalStorage() {
    return Boolean(globalScope.localStorage);
  }

  const api = {
    storageKey,
    loadState,
    saveState,
    clearState,
  };

  globalScope.RMRoadsStorage = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
