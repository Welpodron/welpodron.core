(function (window) {
  let options = {
    root: null,
    rootMargin: '0% 50%',
    threshold: 0.5,
    animateClassName: 'sal-animate',
    disabledClassName: 'sal-disabled',
    enterEventName: 'sal:in',
    exitEventName: 'sal:out',
    selector: '[data-sal]',
    once: true,
    disabled: false
  };

  let elements = [];
  let intersectionObserver = null;

  const setOptions = (settings) => {
    if (settings && settings !== options) {
      options = {
        ...options,
        ...settings
      };
    }
  };

  const fireEvent = (name, entry) => {
    const event = new CustomEvent(name, {
      bubbles: true,
      detail: entry
    });

    entry.target.dispatchEvent(event);
  };

  const animate = (entry) => {
    entry.target.classList.add(options.animateClassName);
    fireEvent(options.enterEventName, entry);
  };

  const isAnimated = (element) =>
    element.classList.contains(options.animateClassName);

  const onIntersection = (entries, observer) => {
    entries.forEach((entry) => {
      const { target } = entry;

      if (entry.intersectionRatio >= options.threshold) {
        animate(entry);

        observer.unobserve(target);
      }
    });
  };

  const getObservedElements = () => {
    const collection = [].filter.call(
      document.querySelectorAll(options.selector),
      (element) => !isAnimated(element, options.animateClassName)
    );

    collection.forEach((element) => intersectionObserver.observe(element));

    return collection;
  };

  const enable = () => {
    intersectionObserver = new IntersectionObserver(onIntersection, {
      root: options.root,
      rootMargin: options.rootMargin,
      threshold: options.threshold
    });

    elements = getObservedElements();
  };

  const update = () => {
    const newElements = getObservedElements();
    elements.push(newElements);
  };

  const init = (settings = options) => {
    setOptions(settings);

    enable();

    return {
      elements,
      enable,
      update
    };
  };

  init();
})(window);
