const MODULE_BASE = "tabs";
const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type TabsItemPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class TabsItem<BaseElementType extends HTMLElement = HTMLElement> {
  animationFrame = 0;
  element: BaseElementType;

  constructor({ element }: TabsItemPropsType<BaseElementType>) {
    this.element = element;
    this.element.addEventListener("transitionend", this.handleTransitionEnd);
  }

  handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.element) {
      return;
    }

    if (event.propertyName !== "opacity") {
      return;
    }

    this.element.style.removeProperty("opacity");
  };

  show = () => {
    if (this.element.hasAttribute(ATTRIBUTE_ITEM_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(
          `${ATTRIBUTE_ITEM}`
        )}"][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
      });

    this.element.style.opacity = "0";

    this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, "");

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.opacity = "1";
      this.animationFrame = 0;
      if (matchMedia("(prefers-reduced-motion)").matches) {
        this.element.dispatchEvent(
          new TransitionEvent("transitionend", { propertyName: "opacity" })
        );
      }
    });
  };

  hide = () => {
    if (!this.element.hasAttribute(ATTRIBUTE_ITEM_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(
          `${ATTRIBUTE_ITEM}`
        )}"][${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
      });

    this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);
  };

  removeEventsListeners = () => {
    this.element.removeEventListener("transitionend", this.handleTransitionEnd);
  };
}

type TabsPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Tabs<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  items: TabsItem[] = [];

  constructor({ element }: TabsPropsType<BaseElementType>) {
    this.element = element;

    this.update();

    document.addEventListener("click", this.handleDocumentClick);
  }

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
      const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);

      if (!actionArgs) {
        return;
      }

      const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

      if (!actionFlush) {
        event.preventDefault();
      }

      return actionFunc({
        args: actionArgs,
        event,
      });
    }
  };

  show = ({ args }: { args: string | number }) => {
    if (args == null) {
      return;
    }

    this.items.forEach((item) => {
      if (item.element.getAttribute(ATTRIBUTE_ITEM) == args) {
        item.show();
      } else {
        item.hide();
      }
    });
  };

  update = () => {
    this.items.forEach((item) => item.removeEventsListeners());

    this.items = [
      ...document.querySelectorAll<HTMLElement>(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          ATTRIBUTE_BASE_ID
        )}"][${ATTRIBUTE_ITEM}]`
      ),
    ].map((element) => {
      return new TabsItem({
        element,
      });
    });
  };

  removeEventsListeners = () => {
    document.removeEventListener("click", this.handleDocumentClick);
  };
}

export { Tabs as tabs, TabsPropsType, TabsItem as tabsItem, TabsItemPropsType };
