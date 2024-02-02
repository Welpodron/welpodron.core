import { ExtractComponentActions } from '../typer';

const COMPONENT_BASE = 'collapse';

const ATTRIBUTE_BASE = `data-w-${COMPONENT_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_BASE_ACTIVE = `${ATTRIBUTE_BASE}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type _CollapsePropsType = {
  element: HTMLElement;
};

class _Collapse {
  static readonly SUPPORTED_ACTIONS: ExtractComponentActions<_Collapse>[] = [
    'hide',
    'show',
    'toggle',
  ];

  element: HTMLElement;

  animationFrame = 0;

  constructor({ element }: _CollapsePropsType) {
    this.element = element;

    this.element.ontransitionend = this._handleTransitionEnd;

    document.addEventListener('click', this._handleDocumentClick);
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

    const actionFlush = (target as Element).getAttribute(
      ATTRIBUTE_ACTION_FLUSH
    );

    if (!actionFlush) {
      event.preventDefault();
    }

    if (
      !action ||
      !_Collapse.SUPPORTED_ACTIONS.includes(
        action as ExtractComponentActions<_Collapse>
      )
    ) {
      return;
    }

    const actionFunc = this[action];

    if (actionFunc instanceof Function) {
      return actionFunc();
    }
  };

  show = () => {
    if (this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    document
      .querySelectorAll(
        `[${ATTRIBUTE_BASE_ID}="${this.element.getAttribute(
          `${ATTRIBUTE_BASE_ID}`
        )}"][${ATTRIBUTE_CONTROL}]`
      )
      .forEach((control) => {
        control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, '');
      });

    this.element.style.height = this.element.style.height || '0';

    this.element.setAttribute(ATTRIBUTE_BASE_ACTIVE, '');

    this.element.style.height = this.element.scrollHeight + 'px';
  };

  hide = () => {
    if (!this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)) {
      return;
    }

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
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
      this.element.style.height || this.element.scrollHeight + 'px';

    this.element.style.display = 'block';

    this.element.removeAttribute(ATTRIBUTE_BASE_ACTIVE);

    this.animationFrame = window.requestAnimationFrame(() => {
      this.element.style.height = '0';
      this.animationFrame = 0;
    });
  };

  toggle = () => {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
    }

    return this.element.hasAttribute(ATTRIBUTE_BASE_ACTIVE)
      ? this.hide()
      : this.show();
  };
}

export { _Collapse as _collapse, _CollapsePropsType };
