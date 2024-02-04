import { ExtractComponentActions } from '../typer';

/* eslint-disable */
const COMPONENT_BASE = 'slider';

const ATTRIBUTE_BASE = `data-w-${COMPONENT_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_STAGE = `${ATTRIBUTE_BASE}-stage`;
const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
const ATTRIBUTE_ITEM_TRANSLATING_FROM_LEFT = `${ATTRIBUTE_ITEM}-translating-from-left`;
const ATTRIBUTE_ITEM_TRANSLATING_FROM_RIGHT = `${ATTRIBUTE_ITEM}-translating-from-right`;
const ATTRIBUTE_ITEM_TRANSLATING_TO_LEFT = `${ATTRIBUTE_ITEM}-translating-to-left`;
const ATTRIBUTE_ITEM_TRANSLATING_TO_RIGHT = `${ATTRIBUTE_ITEM}-translating-to-right`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

// FOR MINIFICATION PURPOSES
const DEFAULT_EVENT_TOUCHSTART = 'touchstart';
const DEFAULT_EVENT_TOUCHMOVE = 'touchmove';
const DEFAULT_EVENT_TOUCHEND = 'touchend';
const DEFAULT_EVENT_CLICK = 'click';

type SliderItemPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
  stage: SliderStage;
};

class SliderItem<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  stage: SliderStage;

  width = 0;

  constructor({ element, stage }: SliderItemPropsType<BaseElementType>) {
    this.stage = stage;

    this.element = element;
  }

  resize = () => {
    const { width: componentWidth } =
      this.stage.slider.element.getBoundingClientRect();

    this.width =
      Number((componentWidth / this.stage.itemsOnScreen).toFixed(3)) -
      this.stage.itemsGap;

    this.element.style.width = this.width + 'px';
  };
}

type SliderStagePropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
  slider: Slider;
};

class SliderStage<BaseElementType extends HTMLElement = HTMLElement> {
  static readonly SUPPORTED_ACTIONS: ExtractComponentActions<
    SliderStage,
    ({ args, event }: { args: string | number; event?: Event }) => void
  >[] = ['show'];

  element: BaseElementType;

  slider: Slider;

  items: SliderItem[] = [];
  itemsOnScreen = 3;
  itemsGap = 0;

  drag = {
    delta: 0,
    start: 0,
    current: 0,
    end: 0,
  };

  width = 0;

  centerThreshold = 25;
  centerIndex = 0;

  constructor({ element, slider }: SliderStagePropsType<BaseElementType>) {
    this.slider = slider;

    this.element = element;

    this.element.style.transform = 'translate3d(0, 0, 0)';
    this.element.style.transition = 'transform .15s';

    document
      .querySelectorAll<HTMLElement>(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_ITEM}]`
      )
      .forEach((element) => {
        this.items.push(
          new SliderItem({
            element,
            stage: this,
          })
        );
      });

    this.element.addEventListener('touchstart', this.handleTouchStart, {
      passive: true,
    });

    document.addEventListener('click', this.handleDocumentClick);
  }

  handleTouchStart = ({ touches }: TouchEvent) => {
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchmove', this.handleTouchMove, {
      passive: true,
    });

    this.element.addEventListener('touchend', this.handleTouchEnd, {
      once: true,
    });

    this.drag.start = touches[0].clientX;

    this.drag.current = touches[0].clientX;
  };

  handleTouchMove = ({ touches }: TouchEvent) => {
    this.drag.delta = touches[0].clientX - this.drag.current;

    const [x, y, z] = this.element.style
      .getPropertyValue('transform')
      .split(/\w+\(|\);?/)[1]
      .split(/,\s?/g)
      .map(parseFloat);

    let delta = x + this.drag.delta;

    const minimum = (this.itemsOnScreen * this.items[0].width) / 2;
    const maximum = -(
      this.width -
      (this.items[0].width / 2) * this.itemsOnScreen
    );

    if (delta >= 0) {
      if (delta >= minimum) {
        delta = minimum;
      }
    } else {
      if (delta <= maximum) {
        delta = maximum;
      }
    }

    this.element.style.transform = `translate3d(${delta}px, ${y}px, ${z}px)`;

    this.drag.current = touches[0].clientX;
  };

  handleTouchEnd = ({ changedTouches }: TouchEvent) => {
    this.element.removeEventListener('touchmove', this.handleTouchMove);

    this.drag.end = changedTouches[0].clientX;
    this.drag.delta = changedTouches[0].clientX - this.drag.start;

    // if this.drag.delta < 0 slide to left
    // if this.drag.delta > 0 slide to right

    if (this.drag.delta < 0) {
      // find NEXT item from current center if threshold is passed
      // if none found stay on current center if exists
      if (this.centerIndex === -1) {
        this.centerIndex = this.closest();
        this.align(this.centerIndex);
      } else {
        // check for swap threshold
        if (Math.abs(this.drag.delta) > this.centerThreshold) {
          if (this.items[this.centerIndex + 1]) {
            this.align(++this.centerIndex);
          } else {
            this.align(this.centerIndex);
          }
        } else {
          this.align(this.centerIndex);
        }
      }
    }

    if (this.drag.delta > 0) {
      // find PREV item from current center if threshold is passed
      // if none found stay on current center if exists
      if (this.centerIndex === -1) {
        this.centerIndex = this.closest();
        this.align(this.centerIndex);
      } else {
        // check for swap threshold
        if (Math.abs(this.drag.delta) > this.centerThreshold) {
          if (this.items[this.centerIndex - 1]) {
            this.align(--this.centerIndex);
          } else {
            this.align(this.centerIndex);
          }
        } else {
          this.align(this.centerIndex);
        }
      }
    }
  };

  closest = () => {
    const { width: componentWidth, x: componentX } =
      this.slider.element.getBoundingClientRect();

    let bestIndex = -1;
    let bestDistance = Infinity;

    this.items.forEach((item, index) => {
      const { width: itemWidth, x: itemX } =
        item.element.getBoundingClientRect();

      const distance = Math.abs(
        itemX + itemWidth / 2 - (componentX + componentWidth / 2)
      );

      if (distance < bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });

    return bestIndex;
  };

  align = (index: number = -1) => {
    if (index > -1 && Number.isFinite(index)) {
      this.centerIndex = Number(index);

      let [x, y, z] = this.element.style
        .getPropertyValue('transform')
        .split(/\w+\(|\);?/)[1]
        .split(/,\s?/g)
        .map(parseFloat);

      x =
        (this.itemsOnScreen - 1) * -(this.items[0].width / 2) +
        this.centerIndex * this.items[0].width +
        this.centerIndex * this.itemsGap;

      this.element.style.transform = `translate3d(${-x}px, ${y}px, ${z}px)`;
    }
  };

  resize = () => {
    this.element.style.removeProperty('transition');

    //! CHECK ADAPTIVE SUPPORT
    const { width: componentWidth } =
      this.slider.element.getBoundingClientRect();

    if (componentWidth >= 900) {
      this.itemsOnScreen = 3;
    } else if (componentWidth >= 600) {
      this.itemsOnScreen = 2;
    } else {
      this.itemsOnScreen = 1;
    }
    //! CHECK ADAPTIVE SUPPORT

    let width = 0;

    this.items.forEach((item) => {
      item.resize();
      width += item.width + this.itemsGap;
    });

    this.width = width;

    this.element.style.width = Math.ceil(width) + 'px';

    this.align(this.centerIndex);

    window.requestAnimationFrame(() => {
      this.element.style.transition = 'transform .15s';
    });
  };

  //! FOR NOW THIS ONLY SUPPORTS EXACT NAVIGATION NOT IN BUCKETS!
  //! FOR BUCKETS WE NEED TO FIND "CENTER" OF EACH ITEMS BUCKET
  show = ({ args, event }: { args: string | number; event?: Event }) => {
    if (!args || args == this.centerIndex) {
      return;
    }

    let nextItemIndex;

    switch (args) {
      case 'next':
        nextItemIndex = (this.centerIndex + 1) % this.items.length;
        break;
      case 'prev':
        nextItemIndex =
          (this.centerIndex + this.items.length - 1) % this.items.length;
        break;
      case 'before':
        nextItemIndex = this.centerIndex - 1;
        break;
      case 'after':
        nextItemIndex = Math.min(this.items.length - 1, this.centerIndex + 1);
        break;
      default:
        nextItemIndex = Math.min(
          parseInt(args as string),
          this.items.length - 1
        );
        break;
    }

    this.align(Number.isFinite(nextItemIndex) ? nextItemIndex : -1);
  };

  handleDocumentClick = (event: MouseEvent) => {
    let { target } = event;

    if (!target) {
      return;
    }

    target = (target as Element).closest(
      `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
        `${ATTRIBUTE_BASE_ID}`
      )}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`
    );

    if (!target) {
      return;
    }

    const action = (target as Element).getAttribute(
      ATTRIBUTE_ACTION
    ) as keyof this;

    const actionArgs = (target as Element).getAttribute(ATTRIBUTE_ACTION_ARGS);

    const actionFlush = (target as Element).getAttribute(
      ATTRIBUTE_ACTION_FLUSH
    );

    if (!actionFlush) {
      event.preventDefault();
    }

    if (
      !action ||
      !SliderStage.SUPPORTED_ACTIONS.includes(
        action as ExtractComponentActions<
          SliderStage,
          ({ args, event }: { args: string | number; event?: Event }) => void
        >
      )
    ) {
      return;
    }

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      return actionFunc({
        args: actionArgs,
        event,
      });
    }
  };
}

type SliderPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Slider<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  stage: SliderStage;

  constructor({ element }: SliderPropsType<BaseElementType>) {
    this.element = element;

    this.stage = new SliderStage({
      element: this.element.querySelector(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_STAGE}]`
      ) as HTMLElement,
      slider: this,
    });

    //! TODO: well old browsers are fucked without poly :c
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.target === this.element) {
          this.stage.resize();
        }
      });
    });

    observer.observe(this.element);
  }
}

export { Slider as slider };
