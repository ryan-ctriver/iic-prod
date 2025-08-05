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

  // src/modules/handle-url-queries.js
  var { setAccessibility } = useDataStore.getState();
  var querySetMap = {
    accessibility: setAccessibility
  };
  function initQueries() {
    const urlParams = new URLSearchParams(window.location.search);
    const parsed = {
      accessibility: urlParams.get("accessibility") === "1" ? true : false
    };
    if (Object.values(parsed).length > 0) {
      const queryEntries = Object.entries(parsed);
      queryEntries.forEach(([key, value]) => {
        querySetMap[key](value);
      });
    }
  }

  // src/handle-query.js
  if (window.dataInitialized) {
    initQueries();
  } else {
    window.initQueries = initQueries;
  }
})();
//# sourceMappingURL=handle-query.js.map
