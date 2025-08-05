(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3002"}/esbuild`).addEventListener("change", () => location.reload());

  // node_modules/zustand/esm/vanilla.mjs
  var createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const api = { setState, getState, getInitialState, subscribe };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  var createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

  // src/store/data-store.js
  if (!window.__GLOBAL_DATA_STORE__) {
    window.__GLOBAL_DATA_STORE__ = createStore((set, get) => ({
      sites: [],
      watersheds: [],
      waterbodies: [],
      organizations: [],
      states: [],
      counties: [],
      towns: [],
      boudaries: {},
      query: {},
      isBoundariesLoaded: false,
      lang: "en",
      initialized: false,
      accessibility: false,
      setSites: (sites) => set(() => ({ sites })),
      setQuery: (query) => set(() => ({ query })),
      setStates: (states) => set(() => ({ states })),
      setCounties: (counties) => set(() => ({ counties })),
      setTowns: (towns) => set(() => ({ towns })),
      setWaterSheds: (watersheds) => set(() => ({ watersheds })),
      setWaterBodies: (waterbodies) => set(() => ({ waterbodies })),
      setOrganizations: (organizations) => set(() => ({ organizations })),
      setBoundaries: (boudaries) => set(() => ({ boudaries })),
      setIsBoundariesLoaded: (isBoundariesLoaded) => set(() => ({ isBoundariesLoaded })),
      setLang: (lang) => set(() => ({ lang })),
      setInitialized: (initialized) => set(() => ({ initialized })),
      setAccessibility: (accessibility) => set(() => ({ accessibility })),
      toggleAccessibility: () => set((state) => ({ accessibility: !state.accessibility })),
      getSites: () => get().sites,
      getWaterSheds: () => get().watersheds,
      getWaterBodies: () => get().waterbodies,
      getStates: () => get().states,
      getCounties: () => get().counties,
      getTowns: () => get().towns,
      getOrganizations: () => get().organizations,
      getBoundaries: () => get().boudaries,
      getIsBoundariesLoaded: () => get().isBoundariesLoaded,
      getLang: () => get().lang,
      getQuery: () => get().query,
      getInitialized: () => get().initialized,
      getAccessibility: () => get().accessibility
    }));
  }
  var useDataStore = window.__GLOBAL_DATA_STORE__;

  // src/modules/localization-processing.js
  var { setLang } = useDataStore.getState();
  var LANG_KEY = "lang";
  var LOCALIZED_PREFIX = "/es";
  var DEFAULT_LANG = "en";
  function isLocalizedPath(pathname) {
    return pathname.startsWith(LOCALIZED_PREFIX);
  }
  function getCachedLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch {
      return null;
    }
  }
  function setCachedLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
    }
  }
  function isSpanishPreferred() {
    const languages = navigator.languages || [navigator.language || DEFAULT_LANG];
    const isHaveSpanish = languages.some((lang) => lang.toLowerCase().startsWith("es"));
    return isHaveSpanish && languages.findIndex((lang) => lang.toLowerCase().startsWith("es")) < languages.findIndex((lang) => lang.toLowerCase().startsWith("en"));
  }
  function redirectToLocalized(pathname, search, hash) {
    const normalizedPath = pathname === "/" ? "" : pathname;
    const newUrl = `${window.location.origin}${LOCALIZED_PREFIX}${normalizedPath}${search}${hash}`;
    window.location.replace(newUrl);
  }
  function handleLanguageRedirect() {
    const { pathname, search, hash } = window.location;
    if (isLocalizedPath(pathname)) {
      setLang("es");
      return;
    }
    const cachedLang = getCachedLang();
    if (cachedLang === "es") {
      redirectToLocalized(pathname, search, hash);
      return;
    }
    if (!cachedLang) {
      if (isSpanishPreferred()) {
        setCachedLang("es");
        redirectToLocalized(pathname, search, hash);
      } else {
        setCachedLang("en");
      }
    }
    setLang("en");
  }
  function handleLocChanger() {
    const locLinks = document.querySelectorAll(".lang_link");
    locLinks.forEach((link) => {
      addEventListener("click", changeLocHandling);
    });
  }
  function changeLocHandling(e) {
    console.log("Hadled");
    const loc = e.target.getAttribute("data-lang");
    if (loc) setCachedLang(loc);
  }

  // src/process-locs.js
  handleLanguageRedirect();
  handleLocChanger();
})();
//# sourceMappingURL=process-locs.js.map
