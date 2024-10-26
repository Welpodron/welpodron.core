//! v4 Добавить поддержку событий
const MODULE_BASE = "collapse";
const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

// FOR MINIFICATION
const DEFAULT_CANCEL_ANIMATION_FRAME = window.cancelAnimationFrame;

type CollapsePropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Collapse<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  animationFrame = 0;

  constructor({ element }: CollapsePropsType<BaseElementType>) {
    this.element = element;

    this.element.addEventListener("transitionend", this.handleTransitionEnd);
    document.addEventListener("click", this.handleDocumentClick);
  }

  handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.element) {
      return;
    }

    if (event.propertyName !== "height") {
      return;
    }

    this.element.style.removeProperty("height");
    this.element.style.removeProperty("display");
  };

  handleDocumentClick = (event: MouseEvent) => {
    let { target } = event;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    target = target.closest(
      `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
        `${ATTRIBUTE_BASE_ID}`
      )}"][${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`
    );

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.getAttribute(ATTRIBUTE_ACTION) as keyof this;

    if (!action) {
      return;
    }

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

      if (!actionFlush) {
        event.preventDefault();
      }

      return actionFunc();
    }
  };

  show = () => {
    if (this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
      });

    this.element.style.height = this.element.style.height || "0";

    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, "");

    this.element.style.height = this.element.scrollHeight + "px";

    if (matchMedia("(prefers-reduced-motion)").matches) {
      this.element.dispatchEvent(
        new TransitionEvent("transitionend", { propertyName: "height" })
      );
    }
  };

  hide = () => {
    if (!this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
      });

    this.element.style.height =
      this.element.style.height || this.element.scrollHeight + "px";

    this.element.style.display = "block";

    this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.height = "0";
      this.animationFrame = 0;
      if (matchMedia("(prefers-reduced-motion)").matches) {
        this.element.dispatchEvent(
          new TransitionEvent("transitionend", { propertyName: "height" })
        );
      }
    });
  };

  toggle = () => {
    if (this.animationFrame) {
      DEFAULT_CANCEL_ANIMATION_FRAME(this.animationFrame);
    }

    return this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)
      ? this.hide()
      : this.show();
  };

  removeEventsListeners = () => {
    this.element.removeEventListener("transitionend", this.handleTransitionEnd);
    document.removeEventListener("click", this.handleDocumentClick);
  };
}

export { Collapse as collapse, CollapsePropsType };
