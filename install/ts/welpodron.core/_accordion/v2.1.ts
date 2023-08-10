(() => {
  if (window.welpodron && window.welpodron.animate) {
    //! TODO: v3 Добавить поддержку событий

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

    // data-accordion-id
    // data-accordion-item-id
    // data-accordion-item-active
    class AccordionItem {
      supportedActions = ["hide", "show"];

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

      show = async ({ args, event }: { args?: unknown; event?: Event }) => {
        if (this.animation) {
          window.clearTimeout(this.animation.timer);
        }

        if (this.element.getAttribute("data-w-accordion-item-active") != null) {
          return;
        }

        this.element.style.height = `0px`;
        this.element.setAttribute("data-w-accordion-item-active", "");
        // Магичесий хак
        this.element.scrollHeight;

        this.animation = window.welpodron.animate({
          element: this.element,
          callback: () => {
            this.element.style.height = this.element.scrollHeight + "px";
          },
        });

        await this.animation?.promise;

        this.element.style.removeProperty("height");

        this.animation = null;
      };

      hide = async ({ args, event }: { args?: unknown; event?: Event }) => {
        if (this.animation) {
          window.clearTimeout(this.animation.timer);
        }

        if (this.element.getAttribute("data-w-accordion-item-active") == null) {
          return;
        }

        this.element.style.height = this.element.scrollHeight + "px";
        this.element.style.display = "block";

        this.animation = window.welpodron.animate({
          element: this.element,
          callback: () => {
            this.element.style.height = this.element.scrollHeight + "px";
            this.element.removeAttribute("data-w-accordion-item-active");
            this.element.style.height = `0px`;
          },
        });

        await this.animation?.promise;

        this.element.style.removeProperty("display");
        this.element.style.removeProperty("height");

        this.animation = null;
      };
    }

    class Accordion {
      supportedActions = ["show"];

      element: HTMLElement;

      constructor({ element, config = {} }: AccordionPropsType) {
        this.element = element;

        document.removeEventListener("click", this.handleDocumentClick);
        document.addEventListener("click", this.handleDocumentClick);
      }

      handleDocumentClick = (event: MouseEvent) => {
        let { target } = event;

        if (!target) {
          return;
        }

        target = (target as Element).closest(
          `[data-w-accordion-id][data-w-accordion-action]`
        );

        if (!target) {
          return;
        }

        const accordionId = (target as Element).getAttribute(
          "data-w-accordion-id"
        );

        if (accordionId !== this.element.getAttribute("data-w-accordion-id")) {
          return;
        }

        const action = (target as Element).getAttribute(
          "data-w-accordion-action"
        ) as keyof this;

        const actionArgs = (target as Element).getAttribute(
          "data-w-accordion-action-args"
        );

        const actionFlush = (target as Element).getAttribute(
          "data-w-accordion-action-flush"
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

        const accordionId = this.element.getAttribute("data-w-accordion-id");

        if (!accordionId) {
          return;
        }

        const items = document.querySelectorAll(
          `[data-w-accordion-id="${accordionId}"][data-w-accordion-item-id]`
        );

        if (!items) {
          return;
        }

        const item = [...items].find((element) => {
          return element.getAttribute("data-w-accordion-item-id") === args;
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

    window.welpodron.accordion = Accordion;
  }
})();
