//!Original: https://github.com/michalsnik/aos

const MODULE_BASE = 'aos';

const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_DELAY = `${ATTRIBUTE_BASE}-delay`;
const ATTRIBUTE_BASE_ANIMATED = `${ATTRIBUTE_BASE}-animated`;
const ATTRIBUTE_BASE_ANIMATING = `${ATTRIBUTE_BASE}-animating`;

class AOS {
  observer?: IntersectionObserver;

  constructor() {
    /* eslint-disable */
    if ((AOS as any).instance) {
      return (AOS as any).instance;
    }
    /* eslint-enable */

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (
          entries: IntersectionObserverEntry[],
          observer: IntersectionObserver
        ) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.5) {
              observer.unobserve(entry.target);
              this.animate(entry.target as HTMLElement);
            }
          });
        },
        {
          root: null,
          rootMargin: '0% 50%',
          threshold: 0.5,
        }
      );
    }
  }

  animate = (element: HTMLElement) => {
    const delay = parseInt(element.getAttribute(ATTRIBUTE_BASE_DELAY) ?? '0');

    if (
      !isNaN(delay) &&
      delay > 0 &&
      !element.hasAttribute(ATTRIBUTE_BASE_ANIMATED) &&
      !element.hasAttribute(ATTRIBUTE_BASE_ANIMATING)
    ) {
      element.setAttribute(ATTRIBUTE_BASE_ANIMATING, '');
      setTimeout(() => {
        element.removeAttribute(ATTRIBUTE_BASE_ANIMATING);
        element.setAttribute(ATTRIBUTE_BASE_ANIMATED, '');
      }, delay);
    } else {
      element.removeAttribute(ATTRIBUTE_BASE_ANIMATING);
      element.setAttribute(ATTRIBUTE_BASE_ANIMATED, '');
    }
  };

  update = () => {
    if (!this.observer) {
      return;
    }

    this.observer.disconnect();

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE}]:not([${ATTRIBUTE_BASE_ANIMATED}]):not([${ATTRIBUTE_BASE_ANIMATING}])`
      )
      .forEach((element) => {
        this.observer?.observe(element);
      });
  };
}

export { AOS as aos };
