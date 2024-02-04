const ATTRIBUTE_BASE_ID = 'data-w-accordion-id';
const ATTRIBUTE_ITEM = 'data-w-accordion-item';
const ATTRIBUTE_ITEM_ACTIVE = 'data-w-accordion-item-active';
const ATTRIBUTE_CONTROL = 'data-w-accordion-control';
const ATTRIBUTE_CONTROL_ACTIVE = 'data-w-accordion-control-active';
const ATTRIBUTE_ACTION = 'data-w-accordion-action';
const ATTRIBUTE_ACTION_ARGS = 'data-w-accordion-action-args';
const ATTRIBUTE_ACTION_FLUSH = 'data-w-accordion-action-flush';

type AccordionPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

type AccordionItemPropsType<BaseElementType extends HTMLElement> = {
  element: BaseElementType;
};

class AccordionItem<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  animationFrame = 0;

  constructor({ element }: AccordionItemPropsType<BaseElementType>) {
    this.element = element;

    this.element.ontransitionend = this.handleTransitionEnd;
  }

  //! НЕ ВЫЗЫВАЕТСЯ ПРИ prefers-reduced-motion: reduce
  handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.element) {
      return;
    }

    if (event.propertyName !== 'height') {
      return;
    }

    this.element.style.removeProperty('height');
    this.element.style.removeProperty('display');
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

    this.element.style.height = this.element.style.height || '0';

    this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');

    this.element.style.height = this.element.scrollHeight + 'px';
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

    this.element.style.height =
      this.element.style.height || this.element.scrollHeight + 'px';

    this.element.style.display = 'block';

    this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.height = '0';
      this.animationFrame = 0;
    });
  };
}

class Accordion<BaseElementType extends HTMLElement = HTMLElement> {
  element: BaseElementType;

  items: AccordionItem[] | null = [];

  constructor({ element }: AccordionPropsType<BaseElementType>) {
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

    const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);

    const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);

    if (!actionFlush) {
      event.preventDefault();
    }

    if (!action) {
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
      return new AccordionItem({
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

export {
  Accordion as accordion,
  AccordionPropsType,
  AccordionItem as _accordionItem,
  AccordionItemPropsType,
};
