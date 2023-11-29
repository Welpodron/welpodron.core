((window) => {
  if (!window.welpodron) {
    window.welpodron = {};
  }

  if (!window.welpodron.admin) {
    window.welpodron.admin = {};
  }

  if (window.welpodron.admin.json) {
    return;
  }

  const MODULE_BASE = "admin.json";

  type JsonDownloadConfigType = {};

  type JsonDownloadPropsType = {
    element: HTMLElement;
    textarea: JsonTextArea;
    config?: JsonDownloadConfigType;
  };

  class JsonDownload {
    element: HTMLElement;

    isDisabled = false;

    textarea: JsonTextArea;

    constructor({ element, textarea, config = {} }: JsonDownloadPropsType) {
      this.element = element;
      this.textarea = textarea;

      this.element.removeEventListener("click", this.handleElementClick);
      this.element.addEventListener("click", this.handleElementClick);
    }

    handleElementClick = async (event: Event) => {
      try {
        event.preventDefault();

        if (this.isDisabled) {
          return;
        }

        this.element.setAttribute("disabled", "");
        this.isDisabled = true;

        const beforeText = this.element.textContent;

        const json = this.textarea.element.value;

        if (!json || !json.trim().length) {
          return;
        }

        // save json to file
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // revoke URL to free memory
        URL.revokeObjectURL(url);

        this.element.textContent = "Загружено";

        setTimeout(() => {
          this.element.removeAttribute("disabled");
          this.element.textContent = beforeText;
          this.isDisabled = false;
        }, 1000);
      } catch (error) {
        this.element.removeAttribute("disabled");
        this.isDisabled = false;
        console.error(error);
      }
    };
  }

  type JsonCopyConfigType = {};

  type JsonCopyPropsType = {
    element: HTMLElement;
    textarea: JsonTextArea;
    config?: JsonCopyConfigType;
  };

  class JsonCopy {
    element: HTMLElement;

    isDisabled = false;

    textarea: JsonTextArea;

    constructor({ element, textarea, config = {} }: JsonCopyPropsType) {
      this.element = element;
      this.textarea = textarea;

      this.element.removeEventListener("click", this.handleElementClick);
      this.element.addEventListener("click", this.handleElementClick);
    }

    handleElementClick = async (event: Event) => {
      try {
        event.preventDefault();

        if (this.isDisabled) {
          return;
        }

        this.element.setAttribute("disabled", "");
        this.isDisabled = true;

        const beforeText = this.element.textContent;

        const json = this.textarea.element.value;

        if (!json || !json.trim().length) {
          return;
        }

        try {
          await navigator.clipboard.writeText(json);
        } catch (error) {
          this.textarea.element.select();
          document.execCommand("copy");
        }

        this.element.textContent = "Скопировано";

        setTimeout(() => {
          this.element.removeAttribute("disabled");
          this.element.textContent = beforeText;
          this.isDisabled = false;
        }, 1000);
      } catch (error) {
        this.element.removeAttribute("disabled");
        this.isDisabled = false;
        console.error(error);
      }
    };
  }

  type JsonTextAreaConfigType = {
    copyElement?: HTMLElement;
    downloadElement?: HTMLElement;
  };

  type JsonTextAreaPropsType = {
    element: HTMLTextAreaElement;
    config?: JsonTextAreaConfigType;
  };

  class JsonTextArea {
    element: HTMLTextAreaElement;

    copy?: JsonCopy;
    download?: JsonDownload;

    constructor({ element, config = {} }: JsonTextAreaPropsType) {
      this.element = element;

      if (config.copyElement) {
        this.copy = new JsonCopy({
          element: config.copyElement,
          textarea: this,
        });
      } else {
        const copyElement = document.querySelector(
          `[data-w-json-copy][data-w-json-id="${this.element.getAttribute(
            "data-w-json-id"
          )}"]`
        );

        if (copyElement) {
          this.copy = new JsonCopy({
            element: copyElement as HTMLElement,
            textarea: this,
          });
        }
      }

      if (config.downloadElement) {
        this.download = new JsonDownload({
          element: config.downloadElement,
          textarea: this,
        });
      } else {
        const downloadElement = document.querySelector(
          `[data-w-json-download][data-w-json-id="${this.element.getAttribute(
            "data-w-json-id"
          )}"]`
        );

        if (downloadElement) {
          this.download = new JsonDownload({
            element: downloadElement as HTMLElement,
            textarea: this,
          });
        }
      }

      this.element.removeEventListener("input", this.handleElementInput);
      this.element.addEventListener("input", this.handleElementInput);
    }

    handleElementInput = (event: Event) => {
      const value = this.element.value;

      if (!value || !value.trim().length) {
        this.element.setCustomValidity("");
        this.element.reportValidity();
        this.element.checkValidity();
        return;
      }

      try {
        JSON.parse(value);
        this.element.setCustomValidity("");
      } catch (error) {
        this.element.setCustomValidity("JSON не является валидным");
      }

      this.element.reportValidity();
    };
  }

  window.welpodron.admin.json = JsonTextArea;
})(window as any);
