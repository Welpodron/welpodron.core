import { animate } from '../animate';

const MODULE_BASE = 'collapse';

const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type CollapsePropsType = {
  element: HTMLElement;
};

class Collapse {
  supportedActions = ['hide', 'show', 'toggle'];

  element: HTMLElement;

  animation: {
    promise: Promise<unknown> & {
      resolve: (value?: unknown | PromiseLike<unknown>) => void;
    };
    timer: number;
  } | null = null;

  constructor({ element }: CollapsePropsType) {
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

    const actionFlush = (target as Element).getAttribute(
      ATTRIBUTE_ACTION_FLUSH
    );

    if (!actionFlush) {
      event.preventDefault();
    }

    if (!action || !this.supportedActions.includes(action as string)) {
      return;
    }

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      return actionFunc();
    }
  };

  show = async () => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) != null) {
      return;
    }

    const controls = document.querySelectorAll(
      `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
        `${ATTRIBUTE_BASE_ID}`
      )}"][${ATTRIBUTE_CONTROL}]`
    );

    controls.forEach((control) => {
      control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
    });

    this.element.style.height = `0px`;
    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');
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

  hide = async () => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) == null) {
      return;
    }

    this.element.style.height = this.element.scrollHeight + 'px';
    this.element.style.display = 'block';

    this.animation = animate({
      element: this.element,
      callback: () => {
        this.element.style.height = this.element.scrollHeight + 'px';
        this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

        const controls = document.querySelectorAll(
          `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
            `${ATTRIBUTE_BASE_ID}`
          )}"][${ATTRIBUTE_CONTROL}]`
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

  toggle = async () => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    return this.element.getAttribute(ATTRIBUTE_BASE_ACTIVE) != null
      ? this.hide()
      : this.show();
  };

  removeEventsListeners = () => {
    document.removeEventListener('click', this.handleDocumentClick);
  };
}

export { Collapse as collapse, CollapsePropsType };
