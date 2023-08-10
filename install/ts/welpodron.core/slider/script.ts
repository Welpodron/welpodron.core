(function (window) {
  type SliderConfigType = {
    dom: HTMLElement | null;
    elements?: number;
    margin?: number;
  };

  const SLIDER_DEFAULT_CONFIG: SliderConfigType = {
    dom: null,
    elements: 2,
    margin: 10,
  };

  if (window.welpodron) {
    class Slider {
      _config: SliderConfigType;

      dom: HTMLElement;

      elements: number;
      margin: number;

      outer: HTMLElement;
      inner: HTMLElement;
      items: HTMLElement[];

      constructor({
        config = SLIDER_DEFAULT_CONFIG,
      }: {
        config: SliderConfigType;
      }) {
        this._config = config;

        if (!this._config.dom) {
          throw new Error("Slider: Отсутствует dom (root) DOM элемент");
        }

        this.dom = this._config.dom;

        if (this.dom.dataset.sliderElements) {
          this.elements = parseInt(this.dom.dataset.sliderElements);
        } else {
          this.elements = this._config.elements as number;
        }

        if (this.dom.dataset.sliderMargin) {
          this.margin = parseInt(this.dom.dataset.sliderMargin);
        } else {
          this.margin = this._config.margin as number;
        }

        const outer = this.dom.querySelector("[data-slider-outer]");

        if (!outer) {
          throw new Error(
            "Slider: Отсутствует data-slider-outer DOM элемент внутри root"
          );
        }

        const inner = outer.querySelector("[data-slider-inner]");

        if (!inner) {
          throw new Error(
            "Slider: Отсутствует data-slider-inner DOM элемент внутри root"
          );
        }

        const items = [
          ...inner.querySelectorAll("[data-slider-item]"),
        ] as HTMLElement[];

        this.outer = outer as HTMLElement;
        this.inner = inner as HTMLElement;

        this.items = items;

        this.items.forEach((item) => {
          item.style.marginRight = `${this.margin}px`;
          item.style.width = `300px`;
        });

        const innerWidth = this.items.reduce((acc, item) => {
          return acc + item.offsetWidth;
        }, 0);

        this.inner.style.width = innerWidth + "px";
        this.inner.style.transform = `translate3d(${
          -innerWidth / 2
        }px, 0px, 0px)`;
        this.inner.style.transition = `transform 0.5s ease 0s`;
      }
    }

    window.welpodron.slider = Slider;

    window.welpodron.slidersList = [];

    document.querySelectorAll("[data-slider]").forEach((element) => {
      window.welpodron.slidersList.push(
        new window.welpodron.slider({
          config: {
            dom: element,
          },
        })
      );
    });
  }
})(
  window as Window &
    typeof globalThis & {
      welpodron: {
        slider: any;
        slidersList: any[];
      };
    }
);
