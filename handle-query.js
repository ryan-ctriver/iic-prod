(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

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

  // src/store/tabs-store.js
  var initialTabsState = {
    isAdministrative: true,
    isOutlook: true
  };
  if (!window.__GLOBAL_TABS_STORE__) {
    window.__GLOBAL_TABS_STORE__ = createStore((set, get) => ({
      tabsState: { ...initialTabsState },
      tabsHandlers: [],
      // This will be used to track the currently selected tab and provide filters logic
      isInitialized: false,
      setIsAdministrative: (isAdministrative) => set((state) => ({ tabsState: { ...state.tabsState, isAdministrative } })),
      setIsOutlook: (isOutlook) => set((state) => ({ tabsState: { ...state.tabsState, isOutlook } })),
      pushTabHandler: (handler) => set((state) => ({ tabsHandlers: [...state.tabsHandlers, handler] })),
      clearTabsHandlers: () => set(() => ({ tabsHandlers: [] })),
      setIsInitialized: (isInitialized) => set((state) => ({ isInitialized })),
      getIsAdministrative: () => get().tabsState.isAdministrative,
      getIsOutlook: () => get().tabsState.isOutlook,
      getTabsState: () => get().tabsState,
      getTabsHandlers: () => get().tabsHandlers,
      getIsInitialized: () => get().isInitialized
    }));
  }
  var useTabsStore = window.__GLOBAL_TABS_STORE__;

  // src/store/filters-store.js
  var initialFiltersState = {
    state: "",
    county: "",
    town: "",
    watershed: "",
    waterbody: "",
    organization: "",
    site: "",
    clean: false,
    boating: false,
    notClean: false,
    month: false,
    year: false,
    old: false
  };
  if (!window.__GLOBAL_FILTERS_STORE__) {
    window.__GLOBAL_FILTERS_STORE__ = createStore((set, get) => ({
      selectedFilters: { ...initialFiltersState },
      selectedInputLevel: void 0,
      inputHandlers: [],
      // This will be used to track the currently selected filter level and provide dependency logic
      setStateFilter: (stateFilter) => set((state) => ({ selectedFilters: { ...state.selectedFilters, state: stateFilter } })),
      setCountyFilter: (county) => set((state) => ({ selectedFilters: { ...state.selectedFilters, county } })),
      setTownFilter: (town) => set((state) => ({ selectedFilters: { ...state.selectedFilters, town } })),
      setWaterShedFilter: (watershed) => set((state) => ({ selectedFilters: { ...state.selectedFilters, watershed } })),
      setWaterBodyFilter: (waterbody) => set((state) => ({ selectedFilters: { ...state.selectedFilters, waterbody } })),
      setOrganizationFilter: (organization) => set((state) => ({ selectedFilters: { ...state.selectedFilters, organization } })),
      setSiteFilter: (site) => set((state) => ({ selectedFilters: { ...state.selectedFilters, site } })),
      setCleanFilter: (clean) => set((state) => ({ selectedFilters: { ...state.selectedFilters, clean } })),
      setBoatingFilter: (boating) => set((state) => ({ selectedFilters: { ...state.selectedFilters, boating } })),
      setNotCleanFilter: (notClean) => set((state) => ({ selectedFilters: { ...state.selectedFilters, notClean } })),
      setYearFilter: (year) => set((state) => ({ selectedFilters: { ...state.selectedFilters, year } })),
      setMonthFilter: (month) => set((state) => ({ selectedFilters: { ...state.selectedFilters, month } })),
      setOldFilter: (old) => set((state) => ({ selectedFilters: { ...state.selectedFilters, old } })),
      setSelectedInputLevel: (level) => set((state) => ({ selectedFilters: state.selectedFilters, selectedInputLevel: level })),
      pushInputHandler: (handler) => set((state) => ({ inputHandlers: [...state.inputHandlers, handler] })),
      clearInputHandlers: () => set(() => ({ inputHandlers: [] })),
      clearWaterFilters: () => set((state) => ({
        selectedFilters: { ...state.selectedFilters, watershed: "", waterbody: "" }
      })),
      clearAdminFilters: () => set((state) => ({
        selectedFilters: { ...state.selectedFilters, state: "", county: "", town: "" }
      })),
      getStateFilter: () => get().selectedFilters.state,
      getCountyFilter: () => get().selectedFilters.county,
      getTownFilter: () => get().selectedFilters.town,
      getWaterShedFilter: () => get().selectedFilters.watershed,
      getWaterBodyFilter: () => get().selectedFilters.waterbody,
      getOrganizationFilter: () => get().selectedFilters.organization,
      getSiteFilter: () => get().selectedFilters.site,
      getCleanFilter: () => get().selectedFilters.clean,
      getBoatingFilter: () => get().selectedFilters.boating,
      getNotCleanFilter: () => get().selectedFilters.notClean,
      getYearFilter: () => get().selectedFilters.year,
      getMonthFilter: () => get().selectedFilters.month,
      getSelectedInputLevel: () => get().selectedInputLevel,
      getOldFilter: () => get().selectedFilters.old,
      getAllFilters: () => get().selectedFilters,
      getInputHandlers: () => get().inputHandlers
    }));
  }
  var useFiltersStore = window.__GLOBAL_FILTERS_STORE__;

  // src/modules/handle-url-queries.js
  var {
    getWaterSheds,
    getWaterBodies,
    getOrganizations,
    getSites,
    getStates,
    getCounties,
    getTowns,
    setAccessibility
  } = useDataStore.getState();
  var {
    setStateFilter,
    setCountyFilter,
    setTownFilter,
    setWaterShedFilter,
    setWaterBodyFilter,
    setOrganizationFilter,
    setSiteFilter,
    setCleanFilter,
    setBoatingFilter,
    setNotCleanFilter,
    setMonthFilter,
    setYearFilter,
    setOldFilter
  } = useFiltersStore.getState();
  var { setIsAdministrative, setIsOutlook } = useTabsStore.getState();
  var querySetMap = {
    state: setStateFilter,
    county: setCountyFilter,
    town: setTownFilter,
    watershed: setWaterShedFilter,
    waterbody: setWaterBodyFilter,
    organization: setOrganizationFilter,
    site: setSiteFilter,
    clean: setCleanFilter,
    boating: setBoatingFilter,
    "not-clean": setNotCleanFilter,
    month: setMonthFilter,
    year: setYearFilter,
    old: setOldFilter,
    administrative: setIsAdministrative,
    quality: setIsOutlook,
    accessibility: setAccessibility
  };
  function initQueries() {
    const urlParams = new URLSearchParams(window.location.search);
    const parsed = {
      administrative: urlParams.get("administrative") === "true" ? true : urlParams.get("administrative") === "false" ? false : void 0,
      quality: urlParams.get("quality") === "true" ? true : urlParams.get("quality") === "false" ? false : void 0,
      watershed: urlParams.get("watershed"),
      waterbody: urlParams.get("waterbody"),
      state: urlParams.get("state"),
      county: urlParams.get("county"),
      town: urlParams.get("town"),
      organization: urlParams.get("organization"),
      site: urlParams.get("site"),
      clean: urlParams.get("clean") === "true" ? true : urlParams.get("clean") === "false" ? false : void 0,
      boating: urlParams.get("boating") === "true" ? true : urlParams.get("boating") === "false" ? false : void 0,
      "not-clean": urlParams.get("not-clean") === "true" ? true : urlParams.get("not-clean") === "false" ? false : void 0,
      month: urlParams.get("month") === "true" ? true : urlParams.get("month") === "false" ? false : void 0,
      year: urlParams.get("year") === "true" ? true : urlParams.get("year") === "false" ? false : void 0,
      old: urlParams.get("old") === "true" ? true : urlParams.get("old") === "false" ? false : void 0,
      accessibility: urlParams.get("accessibility") === "1" ? true : false
    };
    const validatedParams = validateUrlParams(parsed);
    if (Object.values(validatedParams).length > 0) {
      const queryEntries = Object.entries(validatedParams);
      queryEntries.forEach(([key, value]) => {
        querySetMap[key](value);
      });
    }
  }
  function validateUrlParams(params) {
    const validatedParams = { ...params };
    const data = createDataState();
    if (!validatedParams.watershed || validatedParams.watershed && !data.watersheds.find((watershed) => watershed.id === validatedParams.watershed))
      delete validatedParams.watershed;
    if (!validatedParams.waterbody || validatedParams.waterbody && !data.waterbodies.find((waterbody) => waterbody.id === validatedParams.waterbody))
      delete validatedParams.waterbody;
    if (!validatedParams.state || validatedParams.state && !data.states.find((state) => state.id === validatedParams.state))
      delete validatedParams.state;
    if (!validatedParams.county || validatedParams.county && !data.counties.find((county) => county.id === validatedParams.county))
      delete validatedParams.county;
    if (!validatedParams.town || validatedParams.town && !data.towns.find((town) => town.id === validatedParams.town))
      delete validatedParams.town;
    if (!validatedParams.organization || validatedParams.organization && !data.organizations.find((organization) => organization.id === validatedParams.organization))
      delete validatedParams.organization;
    if (!validatedParams.site || validatedParams.site && !data.sites.find((site) => site.id === validatedParams.site))
      delete validatedParams.site;
    if (typeof validatedParams.administrative !== "boolean") delete validatedParams.administrative;
    if (typeof validatedParams.quality !== "boolean") delete validatedParams.quality;
    if (typeof validatedParams.clean !== "boolean") delete validatedParams.clean;
    if (typeof validatedParams.boating !== "boolean") delete validatedParams.boating;
    if (typeof validatedParams["not-clean"] !== "boolean") delete validatedParams["not-clean"];
    if (typeof validatedParams.month !== "boolean") delete validatedParams.month;
    if (typeof validatedParams.year !== "boolean") delete validatedParams.year;
    if (typeof validatedParams.old !== "boolean") delete validatedParams.old;
    return validatedParams;
  }
  function createDataState() {
    return {
      states: getStates(),
      counties: getCounties(),
      towns: getTowns(),
      watersheds: getWaterSheds(),
      waterbodies: getWaterBodies(),
      organizations: getOrganizations(),
      sites: getSites()
    };
  }

  // src/handle-query.js
  if (window.dataInitialized) {
    initQueries();
  } else {
    window.initQueries = initQueries;
  }
})();
//# sourceMappingURL=handle-query.js.map
