import { ExtractComponentActions } from '../typer';

const COMPONENT_BASE = 'accordion';

const ATTRIBUTE_BASE = `data-w-${COMPONENT_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type _AccordionPropsType = {
  element: HTMLElement;
};

type _AccordionItemPropsType = {
  element: HTMLElement;
  accordion: _Accordion;
};

class _AccordionItem {
  accordion: _Accordion;

  element: HTMLElement;

  animationFrame = 0;

  constructor({ element, accordion }: _AccordionItemPropsType) {
    this.accordion = accordion;

    this.element = element;

    this.element.ontransitionend = this._handleTransitionEnd;
  }

  //! НЕ ВЫЗЫВАЕТСЯ ПРИ prefers-reduced-motion: reduce
  protected _handleTransitionEnd = (event: TransitionEvent) => {
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

class _Accordion {
  static readonly SUPPORTED_ACTIONS: ExtractComponentActions<
    _Accordion,
    ({ args, event }: { args: unknown; event?: Event }) => void
  >[] = ['show'];

  element: HTMLElement;

  constructor({ element }: _AccordionPropsType) {
    this.element = element;

    document.addEventListener('click', this._handleDocumentClick);
  }

  protected _handleDocumentClick = (event: MouseEvent) => {
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
      !_Accordion.SUPPORTED_ACTIONS.includes(
        action as ExtractComponentActions<_Accordion>
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

  show = ({ args }: { args?: unknown; event?: Event }) => {
    if (!args) {
      return;
    }

    let _item;

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          ATTRIBUTE_BASE_ID
        )}"][${ATTRIBUTE_ITEM}]`
      )
      .forEach((item) => {
        _item = new _AccordionItem({
          element: item as HTMLElement,
          accordion: this,
        });
        if (item.getAttribute(ATTRIBUTE_ITEM) === args) {
          _item.show();
        } else {
          _item.hide();
        }
        _item = undefined;
      });
  };
}

export {
  _Accordion as _accordion,
  _AccordionPropsType,
  _AccordionItem as _accordionItem,
  _AccordionItemPropsType,
};
