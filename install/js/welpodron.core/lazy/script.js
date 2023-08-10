const defaultSettings = {
  elements_selector: '.lazy',
  container: document,
  threshold: 300,
  thresholds: null,
  data_src: 'src',
  data_srcset: 'srcset',
  data_sizes: 'sizes',
  data_bg: 'bg',
  data_bg_hidpi: 'bg-hidpi',
  data_bg_multi: 'bg-multi',
  data_bg_multi_hidpi: 'bg-multi-hidpi',
  data_poster: 'poster',
  unobserve_completed: true,
  unobserve_entered: false,
  cancel_on_exit: true
};

const getExtendedSettings = (customSettings) => {
  return Object.assign({}, defaultSettings, customSettings);
};

const SRC = 'src';
const SRCSET = 'srcset';
const SIZES = 'sizes';
const dataPrefix = 'data-';

const getData = (element, attribute) => {
  return element.getAttribute(dataPrefix + attribute);
};

const unobserve = (element, instance) => {
  observer.unobserve(element);
};

const getSourceTags = (parentTag) => {
  let sourceTags = [];
  for (let i = 0, childTag; (childTag = parentTag.children[i]); i += 1) {
    if (childTag.tagName === 'SOURCE') {
      sourceTags.push(childTag);
    }
  }
  return sourceTags;
};

const forEachPictureSource = (element, fn) => {
  let sourceTags = getSourceTags(element.parentNode);
  sourceTags.forEach(fn);
};

const attrsSrcSrcsetSizes = [SRC, SRCSET, SIZES];

const setAttributeIfValue = (element, attrName, value) => {
  element.setAttribute(attrName, value);
};

const setImageAttributes = (element, settings) => {
  setAttributeIfValue(element, SIZES, getData(element, settings.data_sizes));
  setAttributeIfValue(element, SRCSET, getData(element, settings.data_srcset));
  setAttributeIfValue(element, SRC, getData(element, settings.data_src));
};

const setSourcesImg = (imgEl, settings) => {
  forEachPictureSource(imgEl, (sourceTag) => {
    setOriginalsObject(sourceTag, attrsSrcSrcsetSizes);
    setImageAttributes(sourceTag, settings);
  });
  setOriginalsObject(imgEl, attrsSrcSrcsetSizes);
  setImageAttributes(imgEl, settings);
};

const setSources = (element, settings, instance) => {
  setSourcesImg(element, settings);
};

const addEventListener = (element, eventName, handler) => {
  element.addEventListener(eventName, handler);
};

const removeEventListener = (element, eventName, handler) => {
  element.removeEventListener(eventName, handler);
};

const addEventListeners = (element, loadHandler, errorHandler) => {
  const loadEventName = 'load';
  addEventListener(element, loadEventName, loadHandler);
};

const removeEventListeners = (element) => {
  const eventListeners = element.llEvLisnrs;
  for (let eventName in eventListeners) {
    const handler = eventListeners[eventName];
    removeEventListener(element, eventName, handler);
  }
  delete element.llEvLisnrs;
};

const doneHandler = (element, settings, instance) => {
  if (settings.unobserve_completed) {
    unobserve(element, instance);
  }
};

const loadHandler = (event, element, settings, instance) => {
  doneHandler(element, settings, instance);
};

const addOneShotEventListeners = (element, settings, instance) => {
  const elementToListenTo = getTempImage(element) || element;
  const _loadHandler = (event) => {
    loadHandler(event, element, settings, instance);
    removeEventListeners(elementToListenTo);
  };
  addEventListeners(elementToListenTo, _loadHandler, _errorHandler);
};

const loadRegular = (element, settings, instance) => {
  addOneShotEventListeners(element, settings, instance);
  setSources(element, settings, instance);
};

const load = (element, settings, instance) => {
  loadRegular(element, settings, instance);
};

const onEnter = (element, entry, settings, instance) => {
  load(element, settings, instance);
};

const getObserverSettings = (settings) => ({
  root: settings.container === document ? null : settings.container,
  rootMargin: settings.thresholds || settings.threshold + 'px'
});

const intersectionHandler = (entries, settings, instance) => {
  entries.forEach((entry) => onEnter(entry.target, entry, settings, instance));
};

const setObserver = (settings, instance) => {
  instance._observer = new IntersectionObserver((entries) => {
    intersectionHandler(entries, settings, instance);
  }, getObserverSettings(settings));
};

const LazyLoad = function (customSettings, elements) {
  const settings = getExtendedSettings(customSettings);
  this._settings = settings;
  this.loadingCount = 0;
  setObserver(settings, this);
  this.update(elements);
};

LazyLoad.load = (element, customSettings) => {
  const settings = getExtendedSettings(customSettings);
  load(element, settings);
};

export { LazyLoad as default };
