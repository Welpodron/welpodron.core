(function (window) {
  // TODO: Move to document content loaded so it will stop
  if (window.welpodron && window.welpodron.animation) {
    window.welpodron.tabs = function (config = {}) {
      this.dom = config.dom;

      // TODO: FIX RECURSION SEE FORMS
      this.items = this.dom.querySelectorAll(`[data-tabs-item]`);

      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].getAttribute('data-active') !== null) {
          this.currentItem = this.items[i];
          break;
        }
      }

      if (!this.currentItem) {
        this.currentItem = this.items[0];
      }

      // TODO: Rework indicator get it to diffrent class
      this.items.forEach((item) => {
        const indicator = document.querySelector(`[data-item-id="${item.id}"]`);
        if (this.currentItem === item) {
          if (indicator) {
            indicator.setAttribute('data-active', '');
          }
          item.setAttribute('data-active', '');
        } else {
          if (indicator) {
            indicator.removeAttribute('data-active');
          }
          item.removeAttribute('data-active');
        }
        item.setAttribute('role', 'tabpanel');
      });

      this.controls = document.querySelectorAll(
        `[data-action][data-tabs-id="${this.dom.id}"]`
      );

      // NEEDS TO BE HERE OR CONTEXT WILL BE LOST!
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
        control.setAttribute('role', 'tab');
        control.removeEventListener('click', this.handleClick);
        control.addEventListener('click', this.handleClick);
      });
    };

    window.welpodron.tabs.prototype.show = function (position) {
      if (this.translating) {
        return;
      }

      let index = parseInt(position);

      if (isNaN(index)) {
        return;
      }

      let nextItem = this.items[index];

      if (!nextItem || nextItem === this.currentItem) {
        return;
      }

      this.translating = true;

      // TODO: REWORK INDICATORS!
      const indicatorCurrent = document.querySelector(
        `[data-item-id="${this.currentItem.id}"]`
      );
      const indicatorNext = document.querySelector(
        `[data-item-id="${nextItem.id}"]`
      );

      if (indicatorCurrent) {
        indicatorCurrent.removeAttribute('data-active');
      }

      if (indicatorNext) {
        indicatorNext.setAttribute('data-active', '');
      }

      new window.welpodron.animation({
        duration: 300,
        from: { opacity: 1.0 },
        to: { opacity: 0.0 },
        step: (state) => {
          this.currentItem.style.opacity = state.props.opacity;
        },
        after: () => {
          this.currentItem.removeAttribute('data-active');
          this.currentItem.style.opacity = '';

          new window.welpodron.animation({
            duration: 300,
            from: { opacity: 0.0 },
            to: { opacity: 1.0 },
            before: () => {
              nextItem.style.display = 'block';
            },
            step: (state) => {
              nextItem.style.opacity = state.props.opacity;
            },
            after: () => {
              nextItem.setAttribute('data-active', '');
              nextItem.dataset.active = true;
              nextItem.style.opacity = '';
              nextItem.style.display = '';
              this.currentItem = nextItem;
              this.translating = false;
            }
          }).start();
        }
      }).start();
    };

    window.welpodron.tabsList = [];

    document.querySelectorAll('[data-tabs]').forEach((element) => {
      window.welpodron.tabsList.push(
        new window.welpodron.tabs({
          dom: element
        })
      );
    });
  }
})(window);
