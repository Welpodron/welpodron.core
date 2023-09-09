(() => {
  type HiderConfigType = {};

  type HiderPropsType = {
    element: HTMLElement;
    config?: HiderConfigType;
  };

  class Hider {
    static #SUPPORTED_ACTIONS = ["toggle", "show", "close"];

    element: HTMLElement;
    outsideControls: HTMLElement[];
    insideControls: HTMLElement[];
    observer: MutationObserver;

    constructor({ element, config = {} }: HiderPropsType) {
      this.element = element;

      this.outsideControls = [
        ...document.querySelectorAll(
          `[data-hider-action][data-hider-id="${this.element.id}"]:not(#${this.element.id} *)`
        ),
      ] as HTMLElement[];

      this.insideControls = [
        ...this.element.querySelectorAll(
          `[data-hider-action][data-hider-id="${this.element.id}"]`
        ),
      ] as HTMLElement[];

      // track opening
      this.observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(async (mutation) => {
          if (mutation.attributeName === "data-hider-active") {
            const isOpen = this.element.hasAttribute("data-hider-active");

            if (!isOpen) {
              this.insideControls.forEach((control) => {
                control.removeEventListener("click", this.#handleControlClick);
              });
              return;
            }

            // set focus
            const focusTarget = this.element.querySelector(
              "[autofocus]"
            ) as HTMLElement;

            if (focusTarget) {
              focusTarget.focus();
            } else {
              const focusable = this.element.querySelectorAll(
                'button:not([disabled]):not(:scope [data-popover] *), [href]:not(:scope [data-popover] *), input:not([type="hidden"]):not([disabled]):not(:scope [data-popover] *), select:not([disabled]):not(:scope [data-popover] *), textarea:not([disabled]):not(:scope [data-popover] *), [tabindex]:not([tabindex="-1"]):not(:scope [data-popover] *)'
              ) as unknown as HTMLElement[];

              focusable[0]?.focus();
            }

            this.insideControls.forEach((control) => {
              control.removeEventListener("click", this.#handleControlClick);
              control.addEventListener("click", this.#handleControlClick);
            });
          }
        });
      });

      this.observer.observe(this.element, {
        attributes: true,
      });

      this.outsideControls.forEach((control) => {
        control.removeEventListener("click", this.#handleControlClick);
        control.addEventListener("click", this.#handleControlClick);
      });
    }

    toggle = () => {
      if (this.element.hasAttribute("data-hider-active")) {
        return this.close();
      }
      return this.show();
    };

    close = () => {
      this.element.removeAttribute("data-hider-active");
    };

    show = () => {
      this.element.setAttribute("data-hider-active", "");
    };

    #handleControlClick = (evt: MouseEvent) => {
      evt.preventDefault();

      const { currentTarget } = evt;
      const action = (currentTarget as Element).getAttribute(
        "data-hider-action"
      ) as keyof this;
      const actionArgs = (currentTarget as Element).getAttribute(
        "data-hider-action-args"
      );

      if (!Hider.#SUPPORTED_ACTIONS.includes(action as string)) return;

      const actionFunc = this[action] as any;

      if (actionFunc instanceof Function)
        return actionFunc({
          args: actionArgs,
          evt,
        });
    };
  }

  if ((window as any).welpodron == null) {
    (window as any).welpodron = {};
  }

  (window as any).welpodron.hider = Hider;

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document.querySelectorAll("[data-hider]").forEach((element) => {
        new Hider({ element: element as HTMLElement });
      });
    },
    {
      once: true,
    }
  );
})();
