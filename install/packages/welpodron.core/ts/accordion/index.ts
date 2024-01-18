import { animate } from '../animate';

const MODULE_BASE = 'accordion';

const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
const ATTRIBUTE_ITEM_ID = `${ATTRIBUTE_ITEM}-id`;
const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type AccordionConfigType = {};

type AccordionPropsType = {
  element: HTMLElement;
  config?: AccordionConfigType;
};

type AccordionItemConfigType = {};

type AccordionItemPropsType = {
  element: HTMLElement;
  accordion: Accordion;
  config?: AccordionItemConfigType;
};

class AccordionItem {
  supportedActions = ['hide', 'show'];

  accordion: Accordion;

  element: HTMLElement;

  animation: {
    promise: Promise<unknown> & {
      resolve: (value?: unknown | PromiseLike<unknown>) => void;
    };
    timer: number;
  } | null = null;

  constructor({ element, accordion, config = {} }: AccordionItemPropsType) {
    this.element = element;
    this.accordion = accordion;
  }

  show = async ({ args, event }: { args?: unknown; event?: Event } = {}) => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
      return;
    }

    this.element.style.height = `0px`;
    this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');

    const controls = document.querySelectorAll(
      `[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(
        `${ATTRIBUTE_ITEM_ID}`
      )}"]`
    );

    controls.forEach((control) => {
      control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
    });

    // Магичесий хак
    this.element.scrollHeight;

    this.animation = animate({
      element: this.element,
      callback: () => {
        this.element.style.height = this.element.scrollHeight + 'px';
      },
    });

    await this.animation?.promise;

    this.element.style.removeProperty('height');

    this.animation = null;
  };

  hide = async ({ args, event }: { args?: unknown; event?: Event } = {}) => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
      return;
    }

    this.element.style.height = this.element.scrollHeight + 'px';
    this.element.style.display = 'block';

    this.animation = animate({
      element: this.element,
      callback: () => {
        this.element.style.height = this.element.scrollHeight + 'px';
        this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);

        const controls = document.querySelectorAll(
          `[${ATTRIBUTE_ACTION_ARGS}="${this.element.getAttribute(
            `${ATTRIBUTE_ITEM_ID}`
          )}"]`
        );

        controls.forEach((control) => {
          control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
        });

        this.element.style.height = `0px`;
      },
    });

    await this.animation?.promise;

    this.element.style.removeProperty('display');
    this.element.style.removeProperty('height');

    this.animation = null;
  };
}

class Accordion {
  supportedActions = ['show'];

  element: HTMLElement;

  constructor({ element, config = {} }: AccordionPropsType) {
    this.element = element;

    document.addEventListener('click', this.handleDocumentClick);
  }

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

    if (!action || !this.supportedActions.includes(action as string)) {
      return;
    }

    const actionFunc = this[action] as any;

    if (actionFunc instanceof Function) {
      return actionFunc({
        args: actionArgs,
        event,
      });
    }
  };

  show = async ({ args, event }: { args?: unknown; event?: Event }) => {
    if (!args) {
      return;
    }

    const accordionId = this.element.getAttribute(ATTRIBUTE_BASE_ID);

    if (!accordionId) {
      return;
    }

    const items = this.element.querySelectorAll(
      `[${ATTRIBUTE_BASE_ID}="${accordionId}"][${ATTRIBUTE_ITEM_ID}]`
    );

    if (!items) {
      return;
    }

    const item = [...items].find((element) => {
      return element.getAttribute(ATTRIBUTE_ITEM_ID) === args;
    });

    if (!item) {
      return;
    }

    const promises = [];

    for (let _item of items) {
      const itemInstance = new AccordionItem({
        element: _item as HTMLElement,
        accordion: this,
      });

      if (_item === item) {
        promises.push(itemInstance.show({ args, event }));
      } else {
        promises.push(itemInstance.hide({ args, event }));
      }
    }

    await Promise.allSettled(promises);
  };
}

export {
  Accordion as accordion,
  AccordionConfigType,
  AccordionPropsType,
  AccordionItem as accordionItem,
  AccordionItemConfigType,
  AccordionItemPropsType,
};
