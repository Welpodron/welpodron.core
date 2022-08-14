(function (window) {
  if (window.welpodron && window.welpodron.animation) {
    window.welpodron.collapse = function (config = {}) {
      this.dom = config.dom;
      this.active = this.dom.getAttribute('data-active') !== null;

      this.beforeHide = config.beforeHide || (() => void 0);
      this.beforeShow = config.beforeHide || (() => void 0);

      this.controls = document.querySelectorAll(
        `[data-action][data-collapse-id="${this.dom.id}"]`
      );

      this.handleClick = (evt) => {
        evt.preventDefault();

        const currentTarget = evt.currentTarget;
        const action = currentTarget.getAttribute('data-action');

        if (action === null || !this[action]) {
          return;
        }

        const args = currentTarget.getAttribute('data-args');

        this[action](args);
      };

      this.controls.forEach((control) => {
        control.setAttribute('aria-expanded', this.active);
        control.setAttribute('aria-controls', this.dom.id);
        control.removeEventListener('click', this.handleClick);
        control.addEventListener('click', this.handleClick);
      });
    };

    window.welpodron.collapse.prototype.show = function () {
      if (this.translating || this.active) {
        return;
      }

      this.beforeShow(this);

      this.translating = true;

      // WARNING ABOUT MATH ROUND!!!
      this.dom.style.display = 'block';
      let destination = this.dom.getBoundingClientRect().height;
      this.dom.style.display = 'none';

      new window.welpodron.animation({
        duration: 700,
        from: { height: 0.0 },
        to: { height: destination },
        before: () => {
          this.dom.style.height = 0;
          this.dom.style.display = 'block';
        },
        step: (state) => {
          this.dom.style.height = `${state.props.height}px`;
        },
        easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
        after: () => {
          this.dom.setAttribute('data-active', '');
          this.dom.style.height = '';
          this.active = true;
          this.dom.style.display = '';

          this.controls.forEach((control) => {
            control.setAttribute('aria-expanded', this.active);
          });

          this.translating = false;
        }
      }).start();
    };

    window.welpodron.collapse.prototype.hide = function () {
      if (this.translating || !this.active) {
        return;
      }

      this.beforeHide(this);

      this.translating = true;

      let start = this.dom.getBoundingClientRect().height;

      new window.welpodron.animation({
        duration: 700,
        from: { height: start },
        to: { height: 0.0 },
        before: () => {
          this.dom.style.height = start;
        },
        step: (state) => {
          this.dom.style.height = `${state.props.height}px`;
        },
        easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
        after: () => {
          this.dom.removeAttribute('data-active');
          this.dom.style.height = '';
          this.active = false;

          this.controls.forEach((control) => {
            control.setAttribute('aria-expanded', this.active);
          });

          this.translating = false;
        }
      }).start();
    };

    window.welpodron.collapse.prototype.toggle = function () {
      this.active ? this.hide() : this.show();
    };

    window.welpodron.collapsesList = [];

    document.querySelectorAll('[data-collapse]').forEach((element) => {
      window.welpodron.collapsesList.push(
        new window.welpodron.collapse({
          dom: element
        })
      );
    });

    // ВСЕГДА У CLICK ИСПОЛЬЗОВАТЬ evt.currentTarget так как он ПОКАЗЫВАЕТ ЭЛЕМЕНТ НА КОТОРОМ ВЕСИТ
    // EVTLISTENER
    // element.addEventListener() -> element = evt.currentTarget
    // Те для закрытия формы модального окна т.к event весит на документе то нужно использовать evt.target
  }
})(window);
