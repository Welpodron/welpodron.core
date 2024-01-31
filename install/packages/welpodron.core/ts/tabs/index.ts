import { ExtractComponentActions } from '../typer';
import { animate } from '../animate';

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

type TabsPropsType = {
  element: HTMLElement;
};

type TabsItemPropsType = {
  element: HTMLElement;
  tabs: Tabs;
};

class TabsItem {
  tabs: Tabs;

  element: HTMLElement;

  animation: {
    promise: Promise<unknown> & {
      resolve: (value?: unknown | PromiseLike<unknown>) => void;
    };
    timer: number;
  } | null = null;

  constructor({ element, tabs }: TabsItemPropsType) {
    this.element = element;
    this.tabs = tabs;
  }

  show = async () => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) != null) {
      return;
    }

    this.element.setAttribute(ATTRIBUTE_ITEM_ACTIVE, '');

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

    this.element.style.opacity = `0`;
    // Магичесий хак
    this.element.scrollHeight;

    this.animation = animate({
      element: this.element,
      callback: () => {
        this.element.style.opacity = `1`;
      },
    });

    await this.animation?.promise;

    this.element.style.removeProperty('opacity');

    this.animation = null;
  };

  hide = async () => {
    if (this.animation) {
      clearTimeout(this.animation.timer);
    }

    if (this.element.getAttribute(ATTRIBUTE_ITEM_ACTIVE) == null) {
      return;
    }

    this.animation = animate({
      element: this.element,
      callback: () => {
        this.element.removeAttribute(ATTRIBUTE_ITEM_ACTIVE);

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
      },
    });

    await this.animation?.promise;

    this.animation = null;
  };
}

class Tabs {
  static readonly SUPPORTED_ACTIONS: ExtractComponentActions<
    Tabs,
    ({ args, event }: { args: unknown; event?: Event }) => void
  >[] = ['show'];

  element: HTMLElement;

  _items: TabsItem[] = [];

  constructor({ element }: TabsPropsType) {
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

    if (
      !action ||
      !Tabs.SUPPORTED_ACTIONS.includes(action as ExtractComponentActions<Tabs>)
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

  show = async ({ args }: { args?: unknown; event?: Event }) => {
    if (!args) {
      return;
    }

    const tabsId = this.element.getAttribute(ATTRIBUTE_BASE_ID);

    if (!tabsId) {
      return;
    }

    const items = this.element.querySelectorAll(
      `[${ATTRIBUTE_BASE_ID}="${tabsId}"][${ATTRIBUTE_ITEM}]`
    );

    if (!items) {
      return;
    }

    const item = [...items].find((element) => {
      return element.getAttribute(ATTRIBUTE_ITEM) === args;
    });

    if (!item) {
      return;
    }

    for (const _item of this._items) {
      if (_item.animation) {
        clearTimeout(_item.animation.timer);
      }
    }

    this._items = [...items].map((element) => {
      return new TabsItem({
        element: element as HTMLElement,
        tabs: this,
      });
    });

    const promises = [];

    for (const _item of this._items) {
      if (_item.element === item) {
        promises.push(_item.show());
      } else {
        promises.push(_item.hide());
      }
    }

    await Promise.allSettled(promises);
  };
}

export { Tabs as tabs, TabsPropsType, TabsItem as tabsItem, TabsItemPropsType };
