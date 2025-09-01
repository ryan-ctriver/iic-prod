(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3001"}/esbuild`).addEventListener("change", () => location.reload());

  // node_modules/kdbush/index.js
  var ARRAY_TYPES = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ];
  var VERSION = 1;
  var HEADER_SIZE = 8;
  var KDBush = class _KDBush {
    /**
     * Creates an index from raw `ArrayBuffer` data.
     * @param {ArrayBuffer} data
     */
    static from(data) {
      if (!(data instanceof ArrayBuffer)) {
        throw new Error("Data must be an instance of ArrayBuffer.");
      }
      const [magic, versionAndType] = new Uint8Array(data, 0, 2);
      if (magic !== 219) {
        throw new Error("Data does not appear to be in a KDBush format.");
      }
      const version = versionAndType >> 4;
      if (version !== VERSION) {
        throw new Error(`Got v${version} data when expected v${VERSION}.`);
      }
      const ArrayType = ARRAY_TYPES[versionAndType & 15];
      if (!ArrayType) {
        throw new Error("Unrecognized array type.");
      }
      const [nodeSize] = new Uint16Array(data, 2, 1);
      const [numItems] = new Uint32Array(data, 4, 1);
      return new _KDBush(numItems, nodeSize, ArrayType, data);
    }
    /**
     * Creates an index that will hold a given number of items.
     * @param {number} numItems
     * @param {number} [nodeSize=64] Size of the KD-tree node (64 by default).
     * @param {TypedArrayConstructor} [ArrayType=Float64Array] The array type used for coordinates storage (`Float64Array` by default).
     * @param {ArrayBuffer} [data] (For internal use only)
     */
    constructor(numItems, nodeSize = 64, ArrayType = Float64Array, data) {
      if (isNaN(numItems) || numItems < 0) throw new Error(`Unpexpected numItems value: ${numItems}.`);
      this.numItems = +numItems;
      this.nodeSize = Math.min(Math.max(+nodeSize, 2), 65535);
      this.ArrayType = ArrayType;
      this.IndexArrayType = numItems < 65536 ? Uint16Array : Uint32Array;
      const arrayTypeIndex = ARRAY_TYPES.indexOf(this.ArrayType);
      const coordsByteSize = numItems * 2 * this.ArrayType.BYTES_PER_ELEMENT;
      const idsByteSize = numItems * this.IndexArrayType.BYTES_PER_ELEMENT;
      const padCoords = (8 - idsByteSize % 8) % 8;
      if (arrayTypeIndex < 0) {
        throw new Error(`Unexpected typed array class: ${ArrayType}.`);
      }
      if (data && data instanceof ArrayBuffer) {
        this.data = data;
        this.ids = new this.IndexArrayType(this.data, HEADER_SIZE, numItems);
        this.coords = new this.ArrayType(this.data, HEADER_SIZE + idsByteSize + padCoords, numItems * 2);
        this._pos = numItems * 2;
        this._finished = true;
      } else {
        this.data = new ArrayBuffer(HEADER_SIZE + coordsByteSize + idsByteSize + padCoords);
        this.ids = new this.IndexArrayType(this.data, HEADER_SIZE, numItems);
        this.coords = new this.ArrayType(this.data, HEADER_SIZE + idsByteSize + padCoords, numItems * 2);
        this._pos = 0;
        this._finished = false;
        new Uint8Array(this.data, 0, 2).set([219, (VERSION << 4) + arrayTypeIndex]);
        new Uint16Array(this.data, 2, 1)[0] = nodeSize;
        new Uint32Array(this.data, 4, 1)[0] = numItems;
      }
    }
    /**
     * Add a point to the index.
     * @param {number} x
     * @param {number} y
     * @returns {number} An incremental index associated with the added item (starting from `0`).
     */
    add(x, y) {
      const index = this._pos >> 1;
      this.ids[index] = index;
      this.coords[this._pos++] = x;
      this.coords[this._pos++] = y;
      return index;
    }
    /**
     * Perform indexing of the added points.
     */
    finish() {
      const numAdded = this._pos >> 1;
      if (numAdded !== this.numItems) {
        throw new Error(`Added ${numAdded} items when expected ${this.numItems}.`);
      }
      sort(this.ids, this.coords, this.nodeSize, 0, this.numItems - 1, 0);
      this._finished = true;
      return this;
    }
    /**
     * Search the index for items within a given bounding box.
     * @param {number} minX
     * @param {number} minY
     * @param {number} maxX
     * @param {number} maxY
     * @returns {number[]} An array of indices correponding to the found items.
     */
    range(minX, minY, maxX, maxY) {
      if (!this._finished) throw new Error("Data not yet indexed - call index.finish().");
      const { ids, coords, nodeSize } = this;
      const stack = [0, ids.length - 1, 0];
      const result = [];
      while (stack.length) {
        const axis = stack.pop() || 0;
        const right = stack.pop() || 0;
        const left = stack.pop() || 0;
        if (right - left <= nodeSize) {
          for (let i = left; i <= right; i++) {
            const x2 = coords[2 * i];
            const y2 = coords[2 * i + 1];
            if (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY) result.push(ids[i]);
          }
          continue;
        }
        const m = left + right >> 1;
        const x = coords[2 * m];
        const y = coords[2 * m + 1];
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[m]);
        if (axis === 0 ? minX <= x : minY <= y) {
          stack.push(left);
          stack.push(m - 1);
          stack.push(1 - axis);
        }
        if (axis === 0 ? maxX >= x : maxY >= y) {
          stack.push(m + 1);
          stack.push(right);
          stack.push(1 - axis);
        }
      }
      return result;
    }
    /**
     * Search the index for items within a given radius.
     * @param {number} qx
     * @param {number} qy
     * @param {number} r Query radius.
     * @returns {number[]} An array of indices correponding to the found items.
     */
    within(qx, qy, r) {
      if (!this._finished) throw new Error("Data not yet indexed - call index.finish().");
      const { ids, coords, nodeSize } = this;
      const stack = [0, ids.length - 1, 0];
      const result = [];
      const r2 = r * r;
      while (stack.length) {
        const axis = stack.pop() || 0;
        const right = stack.pop() || 0;
        const left = stack.pop() || 0;
        if (right - left <= nodeSize) {
          for (let i = left; i <= right; i++) {
            if (sqDist(coords[2 * i], coords[2 * i + 1], qx, qy) <= r2) result.push(ids[i]);
          }
          continue;
        }
        const m = left + right >> 1;
        const x = coords[2 * m];
        const y = coords[2 * m + 1];
        if (sqDist(x, y, qx, qy) <= r2) result.push(ids[m]);
        if (axis === 0 ? qx - r <= x : qy - r <= y) {
          stack.push(left);
          stack.push(m - 1);
          stack.push(1 - axis);
        }
        if (axis === 0 ? qx + r >= x : qy + r >= y) {
          stack.push(m + 1);
          stack.push(right);
          stack.push(1 - axis);
        }
      }
      return result;
    }
  };
  function sort(ids, coords, nodeSize, left, right, axis) {
    if (right - left <= nodeSize) return;
    const m = left + right >> 1;
    select(ids, coords, m, left, right, axis);
    sort(ids, coords, nodeSize, left, m - 1, 1 - axis);
    sort(ids, coords, nodeSize, m + 1, right, 1 - axis);
  }
  function select(ids, coords, k, left, right, axis) {
    while (right > left) {
      if (right - left > 600) {
        const n = right - left + 1;
        const m = k - left + 1;
        const z = Math.log(n);
        const s = 0.5 * Math.exp(2 * z / 3);
        const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
        const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
        const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
        select(ids, coords, k, newLeft, newRight, axis);
      }
      const t = coords[2 * k + axis];
      let i = left;
      let j = right;
      swapItem(ids, coords, left, k);
      if (coords[2 * right + axis] > t) swapItem(ids, coords, left, right);
      while (i < j) {
        swapItem(ids, coords, i, j);
        i++;
        j--;
        while (coords[2 * i + axis] < t) i++;
        while (coords[2 * j + axis] > t) j--;
      }
      if (coords[2 * left + axis] === t) swapItem(ids, coords, left, j);
      else {
        j++;
        swapItem(ids, coords, j, right);
      }
      if (j <= k) left = j + 1;
      if (k <= j) right = j - 1;
    }
  }
  function swapItem(ids, coords, i, j) {
    swap(ids, i, j);
    swap(coords, 2 * i, 2 * j);
    swap(coords, 2 * i + 1, 2 * j + 1);
  }
  function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  function sqDist(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

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
      currentSite: {},
      watersheds: [],
      waterbodies: [],
      organizations: [],
      states: [],
      counties: [],
      towns: [],
      boudaries: {},
      query: {},
      dischargeData: [],
      kdIndex: [],
      points: [],
      isBoundariesLoaded: false,
      lang: "en",
      initialized: false,
      setSites: (sites) => set(() => ({ sites })),
      setCurrentSite: (currentSite) => set(() => ({ currentSite })),
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
      setDischargeData: (dischargeData) => set(() => ({ dischargeData })),
      setAccessibility: (accessibility) => set(() => ({ accessibility })),
      setKdIndex: (kdIndex) => set(() => ({ kdIndex })),
      setPoints: (points) => set(() => ({ points })),
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
      getCurrentSite: () => get().currentSite,
      getInitialized: () => get().initialized,
      getDischargeData: () => get().dischargeData,
      getAccessibility: () => get().accessibility,
      getKdIndex: () => get().kdIndex,
      getPoints: () => get().points
    }));
  }
  var useDataStore = window.__GLOBAL_DATA_STORE__;

  // src/modules/data-processing.js
  var { setSites, setCurrentSite, setKdIndex, setPoints } = useDataStore.getState();
  async function initializeData() {
    const sitesElements = document.querySelectorAll(".data_site");
    const siteElem = document.querySelector(".data_current-site");
    const siteSamples = document.querySelector(".data_site-samples");
    const currentSiteDate = siteElem.getAttribute("data-date");
    const currentSiteQuality = siteElem.getAttribute("data-quality");
    const rawSamples = JSON.parse(siteSamples.textContent).filter((sample) => sample.date);
    const uniqueSamples = Array.from(
      new Map(rawSamples.map((sample) => [new Date(sample.date).getTime(), sample])).values()
    );
    const currentSite = {
      id: siteElem.getAttribute("data-site-id"),
      name: siteElem.getAttribute("data-site-name"),
      date: currentSiteDate ? new Date(currentSiteDate) : void 0,
      quality: currentSiteQuality ? +currentSiteQuality : void 0,
      latitude: siteElem.getAttribute("data-latitude"),
      longitude: siteElem.getAttribute("data-longitude"),
      predictionDry: {
        clean: +siteElem.getAttribute("data-clean-dry"),
        boating: +siteElem.getAttribute("data-boating-dry"),
        notClean: +siteElem.getAttribute("data-not-clean-dry")
      },
      predictionWet: {
        clean: +siteElem.getAttribute("data-clean-wet"),
        boating: +siteElem.getAttribute("data-boating-wet"),
        notClean: +siteElem.getAttribute("data-not-clean-wet")
      },
      samples: uniqueSamples.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      usgsId: siteElem.getAttribute("data-usgs")
    };
    const sites = await mapSites(sitesElements, currentSite);
    if (!sites) return false;
    const points = makPoints(sites);
    const kdIndex = makeIndex(points);
    setSites(sites);
    setPoints(points);
    setKdIndex(kdIndex);
    console.log("Final state:");
    console.log(useDataStore.getState());
    setInitialized();
  }
  async function mapSites(sitesOptions, currentSite) {
    if (sitesOptions.length < 250) return false;
    const apiUrl = "https://is-it-clean-089e6447542b.herokuapp.com/api/v1/weathers";
    const data = [];
    sitesOptions.forEach((item) => {
      const image = item.querySelector(".site-image");
      const siteDate = item.getAttribute("data-sample-date");
      data.push({
        id: item.getAttribute("data-site-id"),
        name: item.getAttribute("data-site-name"),
        latitude: item.getAttribute("data-latitude"),
        longitude: item.getAttribute("data-longitude"),
        image: !image?.classList?.contains("w-dyn-bind-empty") ? image?.src : void 0,
        quality: +item.getAttribute("data-quality"),
        date: siteDate ? new Date(siteDate) : void 0,
        predictionDry: {
          clean: +item.getAttribute("data-clean-dry"),
          boat: +item.getAttribute("data-boat-dry"),
          notClean: +item.getAttribute("data-not-clean-dry")
        },
        predictionWet: {
          clean: +item.getAttribute("data-clean-wet"),
          boat: +item.getAttribute("data-boat-wet"),
          notClean: +item.getAttribute("data-not-clean-wet")
        },
        slug: item.getAttribute("data-slug")
      });
    });
    const filteredSites = data.filter(
      // (site) => (site.organizations.length > 0 && site.quality && site.date)
      (site) => site.quality && site.date
    );
    const requestSites = [...filteredSites.map((station) => station.id)];
    if (!requestSites.find((site) => site === currentSite.id)) requestSites.push(currentSite.id);
    const weatherDataResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      body: JSON.stringify({
        stations: requestSites
      })
    });
    const weatherData = await weatherDataResponse.json();
    const dataWithWeather = filteredSites.map((item) => ({
      ...item,
      wasRain: weatherData.data.find((weather) => weather.id === item.id).wasRain || false
    }));
    setCurrentSite({
      ...currentSite,
      wasRain: weatherData.data.find((weather) => weather.id === currentSite.id)?.wasRain
    });
    return dataWithWeather;
  }
  function makPoints(sites) {
    const normalized = sites.map((s, idx) => ({
      ...s,
      latitude: typeof s.latitude === "string" ? Number(s.latitude) : s.latitude,
      longitude: typeof s.longitude === "string" ? Number(s.longitude) : s.longitude,
      _idx: idx
    }));
    const points = normalized.map((s) => ({
      lon: s.longitude,
      lat: s.latitude,
      idx: s._idx
    }));
    return points;
  }
  function makeIndex(points) {
    const index = new KDBush(points.length, 64, Float64Array);
    for (const p of points) index.add(p.lon, p.lat);
    index.finish();
    return index;
  }

  // src/site-init-data.js
  window.FinsweetAttributes ||= [];
  window.FinsweetAttributes.push([
    "list",
    async (listInstances) => {
      if (listInstances.length > 0) {
        listInstances.forEach((list) => {
          if (list.listElement.querySelector(".data_site"))
            list.addHook("render", async () => {
              await initialize();
            });
        });
      } else {
        await initialize();
      }
    }
  ]);
  async function initialize() {
    await initializeData();
  }
  function setInitialized() {
    window.dataInitialized = true;
    if (window.initQueries) window.initQueries();
    if (window.buildSitePage) window.buildSitePage();
  }
})();
//# sourceMappingURL=site-init-data.js.map
