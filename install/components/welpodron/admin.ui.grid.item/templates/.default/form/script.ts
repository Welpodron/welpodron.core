((window) => {
  if (!window.welpodron) {
    window.welpodron = {};
  }

  if (!window.welpodron.admin) {
    window.welpodron.admin = {};
  }

  if (window.welpodron.admin.form) {
    return;
  }

  const isStringHTML = (string: string) => {
    const doc = new DOMParser().parseFromString(string, "text/html");
    return [...doc.body.childNodes].some((node) => node.nodeType === 1);
  };

  const renderHTML = ({
    string,
    container,
    config,
  }: {
    string: string;
    container: HTMLElement;
    config: {
      replace?: boolean;
    };
  }) => {
    if (!isStringHTML(string)) {
      return;
    }

    const replace = config.replace;
    const templateElement = document.createElement("template");
    templateElement.innerHTML = string;
    const fragment = templateElement.content;
    fragment.querySelectorAll("script").forEach((scriptTag) => {
      const scriptParentNode = scriptTag.parentNode;
      scriptParentNode?.removeChild(scriptTag);
      const script = document.createElement("script");
      script.text = scriptTag.text;
      // Новое поведение для скриптов
      if (scriptTag.id) {
        script.id = scriptTag.id;
      }
      scriptParentNode?.append(script);
    });
    if (replace) {
      // омг, фикс для старых браузеров сафари, кринге
      if (!container.replaceChildren) {
        container.innerHTML = "";
        container.appendChild(fragment);
        return;
      }
      return container.replaceChildren(fragment);
    }

    return container.appendChild(fragment);
  };

  const MODULE_BASE = "admin.form";

  const EVENT_SUBMIT_BEFORE = `welpodron.${MODULE_BASE}:submit:before`;
  const EVENT_SUBMIT_AFTER = `welpodron.${MODULE_BASE}:submit:after`;

  const GENERAL_ERROR_CODE = "FORM_GENERAL_ERROR";
  const FIELD_VALIDATION_ERROR_CODE = "FIELD_VALIDATION_ERROR";

  type FormConfigType = {};

  type FormPropsType = {
    element: HTMLFormElement;
    config?: FormConfigType;
  };

  type _BitrixResponse = {
    data: any;
    status: "success" | "error";
    errors: {
      code: string;
      message: string;
      customData: string;
    }[];
  };

  class Form {
    element: HTMLFormElement;

    action: string = "";

    isDisabled: boolean = false;

    responseContainer: HTMLElement;

    constructor({ element, config = {} }: FormPropsType) {
      this.element = element;

      this.element.removeEventListener("input", this.handleFormInput);
      this.element.addEventListener("input", this.handleFormInput);

      this.element.removeEventListener("submit", this.handleFormSubmit);
      this.element.addEventListener("submit", this.handleFormSubmit);

      this.responseContainer = document.createElement("div");
      this.element.prepend(this.responseContainer);

      this.action = this.element.getAttribute("action") || "";

      // v4
      this.disable();

      if (this.element.checkValidity()) {
        this.enable();
      }
    }

    handleFormSubmit = async (event: Event) => {
      event.preventDefault();

      if (!this.action.trim().length) {
        return;
      }

      if (this.isDisabled) {
        return;
      }

      this.disable();

      const data = new FormData(this.element);

      //! composite and deep cache fix
      if (window.BX && window.BX.bitrix_sessid) {
        data.set("sessid", window.BX.bitrix_sessid());
      }

      let dispatchedEvent = new CustomEvent(EVENT_SUBMIT_BEFORE, {
        bubbles: true,
        cancelable: true,
        detail: {
          data,
          form: this.element,
        },
      });

      if (!this.element.dispatchEvent(dispatchedEvent)) {
        dispatchedEvent = new CustomEvent(EVENT_SUBMIT_AFTER, {
          bubbles: true,
          cancelable: false,
        });

        this.element.dispatchEvent(dispatchedEvent);

        if (this.element.checkValidity()) {
          this.enable();
        } else {
          this.disable();
        }

        return;
      }

      try {
        const response = await fetch(this.action, {
          method: "POST",
          body: data,
        });

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        if (response.redirected) {
          window.location.href = response.url;
          return;
        }

        const result: _BitrixResponse = await response.json();

        if (result.status === "error") {
          const error = result.errors[0];

          if (error.code === FIELD_VALIDATION_ERROR_CODE) {
            const field = this.element.elements[error.customData as any] as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement;

            if (field) {
              field.setCustomValidity(error.message);
              field.reportValidity();
              field.addEventListener(
                "input",
                () => {
                  field.setCustomValidity("");
                  field.reportValidity();
                  field.checkValidity();
                },
                {
                  once: true,
                }
              );
            }
          }

          if (error.code === GENERAL_ERROR_CODE) {
            renderHTML({
              string: isStringHTML(error.message)
                ? error.message
                : `<p>${error.message}</p>`,
              container: this.responseContainer,
              config: {
                replace: true,
              },
            });
          }

          throw new Error(error.message);
        }

        if (result.status === "success") {
          renderHTML({
            string: isStringHTML(result.data)
              ? result.data
              : `<p>${result.data}</p>`,
            container: this.responseContainer,
            config: {
              replace: true,
            },
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        dispatchedEvent = new CustomEvent(EVENT_SUBMIT_AFTER, {
          bubbles: true,
          cancelable: false,
        });

        this.element.dispatchEvent(dispatchedEvent);

        if (this.element.checkValidity()) {
          this.enable();
        } else {
          this.disable();
        }
      }
    };

    // v4
    handleFormInput = (event: Event) => {
      if (this.element.checkValidity()) {
        return this.enable();
      }

      this.disable();
    };

    // v4
    disable = () => {
      this.isDisabled = true;

      [...this.element.elements]
        .filter((element) => {
          return (
            (element instanceof HTMLButtonElement ||
              element instanceof HTMLInputElement) &&
            element.type === "submit"
          );
        })
        .forEach((element) => {
          element.setAttribute("disabled", "");
        });
    };

    // v4
    enable = () => {
      this.isDisabled = false;

      [...this.element.elements]
        .filter((element) => {
          return (
            (element instanceof HTMLButtonElement ||
              element instanceof HTMLInputElement) &&
            element.type === "submit"
          );
        })
        .forEach((element) => {
          element.removeAttribute("disabled");
        });
    };
  }

  window.welpodron.admin.form = Form;
})(window as any);
