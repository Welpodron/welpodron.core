const COMPONENT_BASE = 'slider';

const ATTRIBUTE_BASE = `data-w-${COMPONENT_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
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

type SliderPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Slider<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  touchLocalStartX = 0;
  touchGlobalStartX = 0;

  touchLocalDeltaX = 0;
  touchGlobalDeltaX = 0;

  childWidth: number;
  childrenOnScreen = 6;
  childrenGap = 10;

  sideThreshold = 20;

  elementWidth: number;

  centerItemIndex = -1;
  centerThreshold = 35;

  constructor({ element }: SliderPropsType<BaseElementType>) {
    this.element = element;

    const children = Array.from(this.element.children) as HTMLElement[];

    const { width: elementWidth } = this.element.getBoundingClientRect();

    this.childWidth = elementWidth / this.childrenOnScreen;

    this.elementWidth = Math.ceil(
      children.length * this.childWidth +
        (children.length - 1) * this.childrenGap +
        2
    );

    this.element.style.width = this.elementWidth + 'px';

    children.forEach((child, index) => {
      if (index !== children.length - 1) {
        child.style.marginRight = this.childrenGap + 'px';
      }
      child.style.width = this.childWidth + 'px';
    });

    this._centrify(0);

    this.element.addEventListener(
      DEFAULT_EVENT_TOUCHSTART,
      this._handleElementTouchStart.bind(this),
      {
        passive: true,
      }
    );

    this.element.addEventListener(
      'mousedown',
      this._handleElementMouseDown.bind(this)
    );
  }

  protected _handleElementMouseDown = (event: MouseEvent) => {
    this.element.addEventListener(
      'mouseup',
      this._handleElementMouseUp.bind(this),
      {
        once: true,
      }
    );
    this.element.addEventListener('mousemove', this._handleElementMouseMove);

    this.touchGlobalStartX = event.clientX;
    this.touchLocalStartX = event.clientX;
  };

  protected _handleElementMouseMove = (event: MouseEvent) => {
    this.touchLocalDeltaX = event.clientX - this.touchLocalStartX;

    this.touchGlobalDeltaX = event.clientX - this.touchGlobalStartX;

    this._processPointDeviceMovement();

    //!  UPDATE SO THEN NEXT TOUCH COMES WE CALCULATE FROM THERE
    this.touchLocalStartX = event.clientX;
  };

  protected _handleElementMouseUp = (event: MouseEvent) => {
    this.element.removeEventListener('mousemove', this._handleElementMouseMove);

    this._processPointDeviceUp();

    this.touchLocalDeltaX = 0;
    this.touchGlobalDeltaX = 0;
  };

  protected _handleElementTouchStart = (event: TouchEvent) => {
    this.element.addEventListener(
      DEFAULT_EVENT_TOUCHEND,
      this._handleElementTouchEnd.bind(this),
      {
        once: true,
      }
    );
    this.element.addEventListener(
      DEFAULT_EVENT_TOUCHMOVE,
      this._handleElementTouchMove,
      {
        passive: true,
      }
    );

    this.touchGlobalStartX = event.touches[0].clientX;
    this.touchLocalStartX = event.touches[0].clientX;
  };

  protected _handleElementTouchMove = (event: TouchEvent) => {
    this.touchLocalDeltaX =
      event.touches && event.touches.length > 1
        ? 0
        : event.touches[0].clientX - this.touchLocalStartX;

    this.touchGlobalDeltaX =
      event.touches && event.touches.length > 1
        ? 0
        : event.touches[0].clientX - this.touchGlobalStartX;

    this._processPointDeviceMovement();

    //!  UPDATE SO THEN NEXT TOUCH COMES WE CALCULATE FROM THERE
    this.touchLocalStartX = event.touches[0].clientX;
  };

  protected _handleElementTouchEnd = (event: TouchEvent) => {
    this.element.removeEventListener(
      DEFAULT_EVENT_TOUCHMOVE,
      this._handleElementTouchMove
    );

    this._processPointDeviceUp();

    this.touchLocalDeltaX = 0;
    this.touchGlobalDeltaX = 0;
  };

  protected _processPointDeviceMovement = () => {
    const values = this.element.style
      .getPropertyValue('transform')
      .split(/\w+\(|\);?/);
    let [x, y, z] = values[1].split(/,\s?/g).map(parseFloat);

    let deltaX = x + this.touchLocalDeltaX;

    if (this.touchLocalDeltaX >= 0) {
      if (deltaX >= this.childrenOnScreen * (this.childWidth / 2)) {
        deltaX = this.childrenOnScreen * (this.childWidth / 2);
      }
    } else {
      if (
        deltaX <=
        -(this.elementWidth - (this.childWidth / 2) * this.childrenOnScreen)
      ) {
        deltaX = -(
          this.elementWidth -
          (this.childWidth / 2) * this.childrenOnScreen
        );
      }
    }

    this.element.style.setProperty(
      'transform',
      `translate3d(${deltaX}px, ${y}px, ${z}px)`
    );
  };

  protected _processPointDeviceUp = () => {
    // if this.touchGlobalDeltaX < 0 slide to left
    // if this.touchGlobalDeltaX > 0 slide to right

    if (this.touchGlobalDeltaX < 0) {
      // find NEXT item from current center if threshold is passed
      // if none found stay on current center if exists
      if (this.centerItemIndex === -1) {
        this.centerItemIndex = this._findBestCandidateIndex();
        this._centrify(this.centerItemIndex);
      } else {
        // check for swap threshold
        if (Math.abs(this.touchGlobalDeltaX) > this.centerThreshold) {
          if (this.element.children[this.centerItemIndex + 1]) {
            this.centerItemIndex = this.centerItemIndex + 1;
            this._centrify(this.centerItemIndex);
          } else {
            this._centrify(this.centerItemIndex);
          }
        } else {
          this._centrify(this.centerItemIndex);
        }
      }
    }

    if (this.touchGlobalDeltaX > 0) {
      // find PREV item from current center if threshold is passed
      // if none found stay on current center if exists
      if (this.centerItemIndex === -1) {
        this.centerItemIndex = this._findBestCandidateIndex();
        this._centrify(this.centerItemIndex);
      } else {
        // check for swap threshold
        if (Math.abs(this.touchGlobalDeltaX) > this.centerThreshold) {
          if (this.element.children[this.centerItemIndex - 1]) {
            this.centerItemIndex = this.centerItemIndex - 1;
            this._centrify(this.centerItemIndex);
          } else {
            this._centrify(this.centerItemIndex);
          }
        } else {
          this._centrify(this.centerItemIndex);
        }
      }
    }
  };

  protected _findBestCandidateIndex = () => {
    let bestIndex = -1;
    let bestDistance = +Infinity;

    if (this.element.parentElement) {
      const { width: parentWidth, x: parentX } =
        this.element.parentElement.getBoundingClientRect();

      const children = Array.from(this.element.children) as HTMLElement[];

      children.forEach((child, index) => {
        const { width: childWidth, x: childX } = child.getBoundingClientRect();

        const offset = childX + childWidth / 2 - (parentX + parentWidth / 2);

        if (Math.abs(offset) < bestDistance) {
          //   if (this.centerItem === child) {
          //     if (Math.abs(offset) > this.centerThreshold) {
          //       return;
          //     }
          //   }
          bestDistance = Math.abs(offset);
          bestIndex = index;
        }
      });
    }

    return bestIndex;
  };

  protected _centrify = (itemIndex: number = -1) => {
    if (itemIndex !== -1) {
      const values = this.element.style
        .getPropertyValue('transform')
        .split(/\w+\(|\);?/);
      let [x, y, z] = values[1].split(/,\s?/g).map(parseFloat);

      switch (this.childrenOnScreen) {
        case 1:
          x = -(this.childWidth / 2) + this.childWidth / 2;
          break;
        default:
          x =
            (this.childrenOnScreen - 1) * -(this.childWidth / 2) +
            itemIndex * this.childWidth +
            itemIndex * this.childrenGap;
          break;
      }

      this.element.style.setProperty(
        'transform',
        `translate3d(${-x}px, ${y}px, ${z}px)`
      );
    }
  };
}

export { Slider as slider };
