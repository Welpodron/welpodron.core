const ATTRIBUTE_BASE_ID = 'data-w-tabs-id';
const ATTRIBUTE_ITEM = 'data-w-tabs-item';
const ATTRIBUTE_ITEM_ACTIVE = 'data-w-tabs-item-active';
const ATTRIBUTE_CONTROL = 'data-w-tabs-control';
const ATTRIBUTE_CONTROL_ACTIVE = 'data-w-tabs-control-active';
const ATTRIBUTE_ACTION = 'data-w-tabs-action';
const ATTRIBUTE_ACTION_ARGS = 'data-w-tabs-action-args';
const ATTRIBUTE_ACTION_FLUSH = 'data-w-tabs-action-flush';

type TabsItemPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class TabsItem<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  animationFrame = 0;

  constructor({ element }: TabsItemPropsType<BaseElementType>) {
    this.element = element;

    this.element.ontransitionend = this.handleTransitionEnd;
  }

  //! НЕ ВЫЗЫВАЕТСЯ ПРИ prefers-reduced-motion: reduce
  handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.element) {
      return;
    }

    if (event.propertyName !== 'opacity') {
      return;
    }

    this.element.style.removeProperty('opacity');
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
        control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
      });

    this.element.style.opacity = '0';

    this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.opacity = '1';
      this.animationFrame = 0;
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
}

type TabsPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class Tabs<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  items: TabsItem[] | null = [];

  constructor({ element }: TabsPropsType<BaseElementType>) {
    this.element = element;

    this.update();

    document.addEventListener('click', this.handleDocumentClick);
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

    const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

    const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
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
    if (!args) {
      return;
    }

    if (!this.items || !this.items.length) {
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

  destroy = () => {
    this.items?.forEach((item) => {
      item.element.ontransitionend = null;
    });

    this.items = null;

    document.removeEventListener('click', this.handleDocumentClick);
  };
}

export { Tabs as tabs, TabsPropsType, TabsItem as tabsItem, TabsItemPropsType };
