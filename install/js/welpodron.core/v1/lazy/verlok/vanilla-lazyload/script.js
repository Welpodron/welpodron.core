var LazyLoad = (function () {
  'use strict';

  function _extends() {
    _extends =
      Object.assign ||
      function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }

        return target;
      };

    return _extends.apply(this, arguments);
  }

  var runningOnBrowser = typeof window !== 'undefined';
  var isBot =
    (runningOnBrowser && !('onscroll' in window)) ||
    (typeof navigator !== 'undefined' &&
      /(gle|ing|ro)bot|crawl|spider/i.test(navigator.userAgent));
  var supportsIntersectionObserver =
    runningOnBrowser && 'IntersectionObserver' in window;
  var isHiDpi = runningOnBrowser && window.devicePixelRatio > 1;

  var defaultSettings = {
    elements_selector: '[data-lz]',
    container: isBot || runningOnBrowser ? document : null,
    threshold: 300,
    thresholds: null,
    data_src: 'src',
    data_srcset: 'srcset',
    data_sizes: 'sizes',
    data_bg: 'bg',
    data_bg_hidpi: 'bg-hidpi',
    data_bg_multi: 'bg-multi',
    data_bg_multi_hidpi: 'bg-multi-hidpi',
    unobserve_completed: true,
    unobserve_entered: false,
    cancel_on_exit: true
  };
  var getExtendedSettings = function getExtendedSettings(customSettings) {
    return _extends({}, defaultSettings, customSettings);
  };

  /* Creates instance and notifies it through the window element */
  var createInstance = function createInstance(classObj, options) {
    var event;
    var eventString = 'LazyLoad::Initialized';
    var instance = new classObj(options);

    event = new CustomEvent(eventString, {
      detail: {
        instance: instance
      }
    });

    window.dispatchEvent(event);
  };
  /* Auto initialization of one or more instances of lazyload, depending on the 
      options passed in (plain object or an array) */

  var autoInitialize = function autoInitialize(classObj, options) {
    if (!options) {
      return;
    }

    if (!options.length) {
      // Plain object
      createInstance(classObj, options);
    } else {
      // Array of objects
      for (var i = 0, optionsItem; (optionsItem = options[i]); i += 1) {
        createInstance(classObj, optionsItem);
      }
    }
  };

  var SRC = 'src';
  var SRCSET = 'srcset';
  var SIZES = 'sizes';
  var ORIGINALS = 'llOriginalAttrs';

  var statusLoading = 'loading';
  var statusLoaded = 'loaded';
  var statusApplied = 'applied';
  var statusEntered = 'entered';
  var statusError = 'error';
  var statusNative = 'native';

  var dataPrefix = 'data-';
  var statusDataName = 'll-status';
  var getData = function getData(element, attribute) {
    return element.getAttribute(dataPrefix + attribute);
  };
  var setData = function setData(element, attribute, value) {
    var attrName = dataPrefix + attribute;

    if (value === null) {
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, value);
  };
  var getStatus = function getStatus(element) {
    return getData(element, statusDataName);
  };
  var setStatus = function setStatus(element, status) {
    return setData(element, statusDataName, status);
  };
  var resetStatus = function resetStatus(element) {
    return setStatus(element, null);
  };
  var hasEmptyStatus = function hasEmptyStatus(element) {
    return getStatus(element) === null;
  };
  var hasStatusLoading = function hasStatusLoading(element) {
    return getStatus(element) === statusLoading;
  };
  var hasStatusError = function hasStatusError(element) {
    return getStatus(element) === statusError;
  };
  var statusesAfterLoading = [
    statusLoading,
    statusLoaded,
    statusApplied,
    statusError
  ];
  var hadStartedLoading = function hadStartedLoading(element) {
    return statusesAfterLoading.indexOf(getStatus(element)) >= 0;
  };

  var addTempImage = function addTempImage(element) {
    element.llTempImage = document.createElement('IMG');
  };
  var deleteTempImage = function deleteTempImage(element) {
    delete element.llTempImage;
  };
  var getTempImage = function getTempImage(element) {
    return element.llTempImage;
  };

  var unobserve = function unobserve(element, instance) {
    if (!instance) return;
    var observer = instance._observer;
    if (!observer) return;
    observer.unobserve(element);
  };
  var resetObserver = function resetObserver(observer) {
    observer.disconnect();
  };
  var unobserveEntered = function unobserveEntered(
    element,
    settings,
    instance
  ) {
    if (settings.unobserve_entered) unobserve(element, instance);
  };

  var updateLoadingCount = function updateLoadingCount(instance, delta) {
    if (!instance) return;
    instance.loadingCount += delta;
  };
  var decreaseToLoadCount = function decreaseToLoadCount(instance) {
    if (!instance) return;
    instance.toLoadCount -= 1;
  };
  var setToLoadCount = function setToLoadCount(instance, value) {
    if (!instance) return;
    instance.toLoadCount = value;
  };

  var getSourceTags = function getSourceTags(parentTag) {
    var sourceTags = [];

    for (var i = 0, childTag; (childTag = parentTag.children[i]); i += 1) {
      if (childTag.tagName === 'SOURCE') {
        sourceTags.push(childTag);
      }
    }

    return sourceTags;
  };

  var forEachPictureSource = function forEachPictureSource(element, fn) {
    var parent = element.parentNode;

    if (!parent || parent.tagName !== 'PICTURE') {
      return;
    }

    var sourceTags = getSourceTags(parent);
    sourceTags.forEach(fn);
  };

  var attrsSrcSrcsetSizes = [SRC, SRCSET, SIZES];
  var hasOriginalAttrs = function hasOriginalAttrs(element) {
    return !!element[ORIGINALS];
  };
  var getOriginalAttrs = function getOriginalAttrs(element) {
    return element[ORIGINALS];
  };

  var setOriginalsObject = function setOriginalsObject(element, attributes) {
    if (hasOriginalAttrs(element)) {
      return;
    }

    var originals = {};
    attributes.forEach(function (attribute) {
      originals[attribute] = element.getAttribute(attribute);
    });
    element[ORIGINALS] = originals;
  };
  var saveOriginalBackgroundStyle = function saveOriginalBackgroundStyle(
    element
  ) {
    if (hasOriginalAttrs(element)) {
      return;
    }

    element[ORIGINALS] = {
      backgroundImage: element.style.backgroundImage
    };
  }; // ## RESTORE ##

  var setOrResetAttribute = function setOrResetAttribute(
    element,
    attrName,
    value
  ) {
    if (!value) {
      element.removeAttribute(attrName);
      return;
    }

    element.setAttribute(attrName, value);
  };

  var restoreOriginalAttrs = function restoreOriginalAttrs(
    element,
    attributes
  ) {
    if (!hasOriginalAttrs(element)) {
      return;
    }

    var originals = getOriginalAttrs(element);
    attributes.forEach(function (attribute) {
      setOrResetAttribute(element, attribute, originals[attribute]);
    });
  };

  var manageApplied = function manageApplied(element, settings, instance) {
    setStatus(element, statusApplied); // Instance is not provided when loading is called from static class

    if (!instance) return;

    if (settings.unobserve_completed) {
      // Unobserve now because we can't do it on load
      unobserve(element, settings);
    }
  };
  var manageLoading = function manageLoading(element, settings, instance) {
    setStatus(element, statusLoading); // Instance is not provided when loading is called from static class

    if (!instance) return;
    updateLoadingCount(instance, +1);
  };
  var setAttributeIfValue = function setAttributeIfValue(
    element,
    attrName,
    value
  ) {
    if (!value) {
      return;
    }

    element.setAttribute(attrName, value);
  };
  var setImageAttributes = function setImageAttributes(element, settings) {
    setAttributeIfValue(element, SIZES, getData(element, settings.data_sizes));
    setAttributeIfValue(
      element,
      SRCSET,
      getData(element, settings.data_srcset)
    );
    setAttributeIfValue(element, SRC, getData(element, settings.data_src));
  };
  var setSourcesImg = function setSourcesImg(imgEl, settings) {
    forEachPictureSource(imgEl, function (sourceTag) {
      setOriginalsObject(sourceTag, attrsSrcSrcsetSizes);
      setImageAttributes(sourceTag, settings);
    });
    setOriginalsObject(imgEl, attrsSrcSrcsetSizes);
    setImageAttributes(imgEl, settings);
  };
  var setBackground = function setBackground(element, settings, instance) {
    var bg1xValue = getData(element, settings.data_bg);
    var bgHiDpiValue = getData(element, settings.data_bg_hidpi);
    var bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;
    if (!bgDataValue) return;
    element.style.backgroundImage = 'url("'.concat(bgDataValue, '")');
    getTempImage(element).setAttribute(SRC, bgDataValue);
    manageLoading(element, settings, instance);
  }; // NOTE: THE TEMP IMAGE TRICK CANNOT BE DONE WITH data-multi-bg
  // BECAUSE INSIDE ITS VALUES MUST BE WRAPPED WITH URL() AND ONE OF THEM
  // COULD BE A GRADIENT BACKGROUND IMAGE

  var setMultiBackground = function setMultiBackground(
    element,
    settings,
    instance
  ) {
    var bg1xValue = getData(element, settings.data_bg_multi);
    var bgHiDpiValue = getData(element, settings.data_bg_multi_hidpi);
    var bgDataValue = isHiDpi && bgHiDpiValue ? bgHiDpiValue : bg1xValue;

    if (!bgDataValue) {
      return;
    }

    element.style.backgroundImage = bgDataValue;
    manageApplied(element, settings, instance);
  };
  var setSourcesFunctions = {
    IMG: setSourcesImg
  };
  var setSourcesNative = function setSourcesNative(element, settings) {
    var setSourcesFunction = setSourcesFunctions[element.tagName];

    if (!setSourcesFunction) {
      return;
    }

    setSourcesFunction(element, settings);
  };
  var setSources = function setSources(element, settings, instance) {
    var setSourcesFunction = setSourcesFunctions[element.tagName];

    if (!setSourcesFunction) {
      return;
    }

    setSourcesFunction(element, settings);
    manageLoading(element, settings, instance);
  };

  var elementsWithLoadEvent = ['IMG'];
  var hasLoadEvent = function hasLoadEvent(element) {
    return elementsWithLoadEvent.indexOf(element.tagName) > -1;
  };
  var addEventListener = function addEventListener(
    element,
    eventName,
    handler
  ) {
    element.addEventListener(eventName, handler);
    element.llEvLisnrs[eventName] = handler;
  };
  var removeEventListener = function removeEventListener(
    element,
    eventName,
    handler
  ) {
    element.removeEventListener(eventName, handler);
  };
  var hasEventListeners = function hasEventListeners(element) {
    return !!element.llEvLisnrs;
  };
  var addEventListeners = function addEventListeners(
    element,
    loadHandler,
    errorHandler
  ) {
    if (!hasEventListeners(element)) element.llEvLisnrs = {};
    var loadEventName = 'load';
    addEventListener(element, loadEventName, loadHandler);
    addEventListener(element, 'error', errorHandler);
  };
  var removeEventListeners = function removeEventListeners(element) {
    if (!hasEventListeners(element)) {
      return;
    }

    var eventListeners = element.llEvLisnrs;

    for (var eventName in eventListeners) {
      var handler = eventListeners[eventName];
      removeEventListener(element, eventName, handler);
    }

    delete element.llEvLisnrs;
  };
  var doneHandler = function doneHandler(element, settings, instance) {
    deleteTempImage(element);
    updateLoadingCount(instance, -1);
    decreaseToLoadCount(instance);

    if (settings.unobserve_completed) {
      unobserve(element, instance);
    }
  };
  var loadHandler = function loadHandler(event, element, settings, instance) {
    doneHandler(element, settings, instance);
    setStatus(element, statusLoaded);
  };
  var errorHandler = function errorHandler(event, element, settings, instance) {
    doneHandler(element, settings, instance);
    setStatus(element, statusError);
  };
  var addOneShotEventListeners = function addOneShotEventListeners(
    element,
    settings,
    instance
  ) {
    var elementToListenTo = getTempImage(element) || element;

    if (hasEventListeners(elementToListenTo)) {
      // This happens when loading is retried twice
      return;
    }

    var _loadHandler = function _loadHandler(event) {
      loadHandler(event, element, settings, instance);
      removeEventListeners(elementToListenTo);
    };

    var _errorHandler = function _errorHandler(event) {
      errorHandler(event, element, settings, instance);
      removeEventListeners(elementToListenTo);
    };

    addEventListeners(elementToListenTo, _loadHandler, _errorHandler);
  };

  var loadBackground = function loadBackground(element, settings, instance) {
    addTempImage(element);
    addOneShotEventListeners(element, settings, instance);
    saveOriginalBackgroundStyle(element);
    setBackground(element, settings, instance);
    setMultiBackground(element, settings, instance);
  };

  var loadRegular = function loadRegular(element, settings, instance) {
    addOneShotEventListeners(element, settings, instance);
    setSources(element, settings, instance);
  };

  var load = function load(element, settings, instance) {
    if (hasLoadEvent(element)) {
      loadRegular(element, settings, instance);
    } else {
      loadBackground(element, settings, instance);
    }
  };

  var removeImageAttributes = function removeImageAttributes(element) {
    element.removeAttribute(SRC);
    element.removeAttribute(SRCSET);
    element.removeAttribute(SIZES);
  };

  var resetSourcesImg = function resetSourcesImg(element) {
    forEachPictureSource(element, function (sourceTag) {
      removeImageAttributes(sourceTag);
    });
    removeImageAttributes(element);
  };

  var restoreImg = function restoreImg(imgEl) {
    forEachPictureSource(imgEl, function (sourceEl) {
      restoreOriginalAttrs(sourceEl, attrsSrcSrcsetSizes);
    });
    restoreOriginalAttrs(imgEl, attrsSrcSrcsetSizes);
  };

  var cancelLoading = function cancelLoading(
    element,
    entry,
    settings,
    instance
  ) {
    if (!settings.cancel_on_exit) return;
    if (!hasStatusLoading(element)) return;
    if (element.tagName !== 'IMG') return; //Works only on images

    removeEventListeners(element);
    resetSourcesImg(element);
    restoreImg(element);
    updateLoadingCount(instance, -1);
    resetStatus(element);
  };

  var onEnter = function onEnter(element, entry, settings, instance) {
    var dontLoad = hadStartedLoading(element);
    /* Save status 
    before setting it, to prevent loading it again. Fixes #526. */

    setStatus(element, statusEntered);
    unobserveEntered(element, settings, instance);
    if (dontLoad) return;
    load(element, settings, instance);
  };
  var onExit = function onExit(element, entry, settings, instance) {
    if (hasEmptyStatus(element)) return; //Ignore the first pass, at landing
    cancelLoading(element, entry, settings, instance);
  };

  var isIntersecting = function isIntersecting(entry) {
    return entry.isIntersecting || entry.intersectionRatio > 0;
  };

  var getObserverSettings = function getObserverSettings(settings) {
    return {
      root: settings.container === document ? null : settings.container,
      rootMargin: settings.thresholds || settings.threshold + 'px'
    };
  };

  var intersectionHandler = function intersectionHandler(
    entries,
    settings,
    instance
  ) {
    entries.forEach(function (entry) {
      return isIntersecting(entry)
        ? onEnter(entry.target, entry, settings, instance)
        : onExit(entry.target, entry, settings, instance);
    });
  };

  var observeElements = function observeElements(observer, elements) {
    elements.forEach(function (element) {
      observer.observe(element);
    });
  };
  var updateObserver = function updateObserver(observer, elementsToObserve) {
    resetObserver(observer);
    observeElements(observer, elementsToObserve);
  };
  var setObserver = function setObserver(settings, instance) {
    instance._observer = new IntersectionObserver(function (entries) {
      intersectionHandler(entries, settings, instance);
    }, getObserverSettings(settings));
  };

  var toArray = function toArray(nodeSet) {
    return Array.prototype.slice.call(nodeSet);
  };
  var queryElements = function queryElements(settings) {
    return settings.container.querySelectorAll(settings.elements_selector);
  };
  var excludeManagedElements = function excludeManagedElements(elements) {
    return toArray(elements).filter(hasEmptyStatus);
  };
  var hasError = function hasError(element) {
    return hasStatusError(element);
  };
  var filterErrorElements = function filterErrorElements(elements) {
    return toArray(elements).filter(hasError);
  };
  var getElementsToLoad = function getElementsToLoad(elements, settings) {
    return excludeManagedElements(elements || queryElements(settings));
  };

  var retryLazyLoad = function retryLazyLoad(settings, instance) {
    var errorElements = filterErrorElements(queryElements(settings));
    errorElements.forEach(function (element) {
      resetStatus(element);
    });
    instance.update();
  };
  var setOnlineCheck = function setOnlineCheck(settings, instance) {
    if (!runningOnBrowser) {
      return;
    }

    window.addEventListener('online', function () {
      retryLazyLoad(settings, instance);
    });
  };

  var LazyLoad = function LazyLoad(customSettings, elements) {
    var settings = getExtendedSettings(customSettings);
    this._settings = settings;
    this.loadingCount = 0;
    setObserver(settings, this);
    setOnlineCheck(settings, this);
    this.update(elements);
  };

  LazyLoad.prototype = {
    update: function update(givenNodeset) {
      var settings = this._settings;
      var elementsToLoad = getElementsToLoad(givenNodeset, settings);
      setToLoadCount(this, elementsToLoad.length);

      if (isBot || !supportsIntersectionObserver) {
        this.loadAll(elementsToLoad);
        return;
      }

      updateObserver(this._observer, elementsToLoad);
    }
  };

  LazyLoad.load = function (element, customSettings) {
    var settings = getExtendedSettings(customSettings);
    load(element, settings);
  };

  LazyLoad.resetStatus = function (element) {
    resetStatus(element);
  }; // Automatic instances creation if required (useful for async script loading)

  if (runningOnBrowser) {
    autoInitialize(LazyLoad, defaultSettings);
  }

  return LazyLoad;
})();
