import { ExtractComponentActions } from '../typer';

const COMPONENT_BASE = 'tabs';

const ATTRIBUTE_BASE = `data-w-${COMPONENT_BASE}`;
const ATTRIBUTE_BASE_ID = `${ATTRIBUTE_BASE}-id`;
const ATTRIBUTE_ITEM = `${ATTRIBUTE_BASE}-item`;
const ATTRIBUTE_ITEM_ACTIVE = `${ATTRIBUTE_ITEM}-active`;
const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;

type _TabsPropsType = {
  element: HTMLElement;
};

type _TabsItemPropsType = {
  element: HTMLElement;
  tabs: _Tabs;
};

class _TabsItem {
  tabs: _Tabs;

  element: HTMLElement;

  animationFrame = 0;

  constructor({ element, tabs }: _TabsItemPropsType) {
    this.tabs = tabs;

    this.element = element;

    this.element.ontransitionend = this._handleTransitionEnd;
  }

  //! НЕ ВЫЗЫВАЕТСЯ ПРИ prefers-reduced-motion: reduce
  protected _handleTransitionEnd = (event: TransitionEvent) => {
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

class _Tabs {
  static readonly SUPPORTED_ACTIONS: ExtractComponentActions<
    _Tabs,
    ({ args, event }: { args: unknown; event?: Event }) => void
  >[] = ['show'];

  element: HTMLElement;

  constructor({ element }: _TabsPropsType) {
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
      !_Tabs.SUPPORTED_ACTIONS.includes(
        action as ExtractComponentActions<_Tabs>
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
        _item = new _TabsItem({
          element: item as HTMLElement,
          tabs: this,
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
  _Tabs as _tabs,
  _TabsPropsType,
  _TabsItem as _tabsItem,
  _TabsItemPropsType,
};
