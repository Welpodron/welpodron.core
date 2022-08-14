(function (window) {
  if (window.welpodron && window.welpodron.animation) {
    window.welpodron.modal = function (config = {}) {
      this.dom = config.dom || false;
      this.lastActiveElement = document.activeElement;
      this.force = this.dom.getAttribute('data-force') !== null;
      this.once = this.dom.getAttribute('data-once') !== null;

      // Well TODO: Rework! SO the issue here is that is not superb solution to not CURRENTLY active elements,
      // The idea here is simple: How to treat new elements OR elements that suddenly changed state to enabled?
      this.focusable = [
        ...this.dom.querySelectorAll(
          'button:not([disabled]):not(:scope [data-modal] *), [href]:not(:scope [data-modal] *), input:not([type="hidden"]):not([disabled]):not(:scope [data-modal] *), select:not([disabled]):not(:scope [data-modal] *), textarea:not([disabled]):not(:scope [data-modal] *), [tabindex]:not([tabindex="-1"]):not(:scope [data-modal] *)'
        )
      ];

      this.dom.setAttribute('role', 'dialog');
      this.dom.setAttribute('aria-modal', 'true');

      this.handleKeyDown = (evt) => {
        const lastModal = [...window.welpodron.modalsActiveList].pop();

        if (evt.key === 'Escape') {
          return lastModal.hide();
        }

        if (evt.key === 'Tab') {
          if (evt.shiftKey) {
            if (
              lastModal.focusable.length &&
              document.activeElement === lastModal.focusable[0]
            ) {
              evt.preventDefault();
              return lastModal.focusable[
                lastModal.focusable.length - 1
              ].focus();
            }

            return;
          }

          if (
            lastModal.focusable.length &&
            document.activeElement ===
              lastModal.focusable[lastModal.focusable.length - 1]
          ) {
            evt.preventDefault();
            return lastModal.focusable[0].focus();
          }
        }
      };

      this.handleClick = (evt) => {
        // evt.preventDefault();

        if (evt.target === this.dom) {
          return this.hide();
        }

        const currentTarget = evt.currentTarget;

        if (!currentTarget || currentTarget === document) {
          return;
        }

        if (this.outsideControls.includes(currentTarget)) {
          this.lastActiveElement = document.activeElement;
        }

        const action = currentTarget.getAttribute('data-action');

        if (action === null || !this[action]) {
          return;
        }

        const args = currentTarget.getAttribute('data-args');

        this[action](args);
      };

      // OUTSIDE MODAL CONTROLS
      this.outsideControls = [
        ...document.querySelectorAll(
          `[data-action][data-modal-id="${this.dom.id}"]:not(#${this.dom.id} *)`
        )
      ];

      // INSIDE MODAL CONTROLS
      this.insideControls = this.dom.querySelectorAll(
        `[data-action][data-modal-id="${this.dom.id}"]`
      );

      this.outsideControls.forEach((control) => {
        control.removeEventListener('click', this.handleClick);
        control.addEventListener('click', this.handleClick);
      });

      if (this.force) {
        // FIX ON FORCE FOCUS TRAP! If element what called it status changed to disabled
        this.show();
      }
    };

    window.welpodron.modal.prototype.show = function () {
      if (this.translating || this.active) {
        return;
      }

      this.translating = true;

      // TODO: Rework move active modal upfront so it always on top
      if (this.dom.parentNode) {
        let copy = this.dom.parentNode.removeChild(this.dom);
        document.body.appendChild(copy);
        this.dom = copy;
        copy = null;
      }

      // console.log(document.activeElement);

      // WARNING ABOUT MATH ROUND!!!

      new window.welpodron.animation({
        duration: 400,
        from: { opacity: 0.0 },
        to: { opacity: 1.0 },
        before: () => {
          // Из-за нескольких окон необходимо каждый раз проверять весь список
          // Также ESC
          document.body.style.overflow = 'hidden';
          this.dom.style.display = 'flex';
        },
        step: (state) => {
          this.dom.style.opacity = state.props.opacity;
        },
        after: () => {
          this.dom.setAttribute('data-active', '');
          this.active = true;
          this.dom.style.display = '';
          this.dom.style.opacity = '';

          if (this.focusable.length) {
            this.focusable[0].focus();
          }

          if (!window.welpodron.modalsActiveList.size) {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keydown', this.handleKeyDown);
          }

          window.welpodron.modalsActiveList.add(this);

          this.insideControls.forEach((control) => {
            control.removeEventListener('click', this.handleClick);
            control.addEventListener('click', this.handleClick);
          });

          document.removeEventListener('click', this.handleClick);
          document.addEventListener('click', this.handleClick);

          this.translating = false;
        }
      }).start();
    };

    window.welpodron.modal.prototype.hide = function () {
      if (this.translating || !this.active) {
        return;
      }

      this.translating = true;

      new window.welpodron.animation({
        duration: 400,
        from: { opacity: 1.0 },
        to: { opacity: 0.0 },
        step: (state) => {
          this.dom.style.opacity = state.props.opacity;
        },
        after: () => {
          this.dom.removeAttribute('data-active');
          this.active = false;
          this.dom.style.opacity = '';

          window.welpodron.modalsActiveList.delete(this);
          // ADD TRAP FOCUS

          document.removeEventListener('click', this.handleClick);

          this.insideControls.forEach((control) => {
            control.removeEventListener('click', this.handleClick);
          });

          if (!window.welpodron.modalsActiveList.size) {
            document.removeEventListener('keydown', this.handleKeyDown);
          }

          if (!window.welpodron.modalsActiveList.size) {
            document.body.style.overflow = '';
          }

          this.lastActiveElement.focus();

          if (this.once) {
            this.dom.remove();
          }

          this.translating = false;
        }
      }).start();
    };

    // TODO: change to set so no more inits if its was inited
    window.welpodron.modalsList = [];
    window.welpodron.modalsActiveList = new Set();

    document.querySelectorAll('[data-modal]').forEach((element) => {
      window.welpodron.modalsList.push(
        new window.welpodron.modal({
          dom: element
        })
      );
    });
  }
})(window);
