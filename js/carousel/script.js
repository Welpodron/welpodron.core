(function (window) {
  if (window.welpodron && window.welpodron.animation) {
    window.welpodron.carousel = function (config = {}) {
      this.dom = config.dom;
      this.swipeThreshold = 45;

      // TODO: FIX RECURSION SEE FORMS
      this.items = [...this.dom.querySelectorAll(`[data-carousel-item]`)];

      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].getAttribute('data-active') !== null) {
          this.currentItem = this.items[i];
          break;
        }
      }

      if (!this.currentItem) {
        this.currentItem = this.items[0];
      }

      // TODO: Rework indicator
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
      });

      this.handleTouchEnd = (evt) => {
        this.dom.removeEventListener('touchmove', this.handleTouchMove);
        this.dom.removeEventListener('touchend', this.handleTouchEnd);

        const absDeltaX = Math.abs(this.touchDeltaX);

        if (absDeltaX > this.swipeThreshold) {
          // if absDeltaX / this.touchDeltaX < 0 slide to left
          // if absDeltaX / this.touchDeltaY > 0 slide to right

          if (this.slide) {
            this.slide(absDeltaX / this.touchDeltaX < 0 ? 'next' : 'prev');
          }

          this.touchDeltaX = 0;
        }
      };

      this.handleTouchMove = (evt) => {
        this.touchDeltaX =
          evt.touches && evt.touches.length > 1
            ? 0
            : evt.touches[0].clientX - this.touchStartX;
      };

      this.handleTouchStart = (evt) => {
        this.touchStartX = evt.touches[0].clientX;
        this.dom.removeEventListener('touchend', this.handleTouchEnd);
        this.dom.addEventListener('touchend', this.handleTouchEnd);
        this.dom.removeEventListener('touchmove', this.handleTouchMove);
        this.dom.addEventListener('touchmove', this.handleTouchMove);
      };

      this.dom.removeEventListener('touchstart', this.handleTouchStart);
      this.dom.addEventListener('touchstart', this.handleTouchStart, {
        passive: true
      });

      this.controls = document.querySelectorAll(
        `[data-action][data-carousel-id="${this.dom.id}"]`
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
        control.removeEventListener('click', this.handleClick);
        control.addEventListener('click', this.handleClick);
      });
    };

    window.welpodron.carousel.prototype.getNextItem = function (position) {
      // next to left
      // prev to right
      // get next and prev are cycled
      // before and after is not
      const currentItemIndex = this.items.indexOf(this.currentItem);

      if (position === 'next') {
        return this.items[(currentItemIndex + 1) % this.items.length];
      }

      if (position === 'prev') {
        return this.items[
          (currentItemIndex + this.items.length - 1) % this.items.length
        ];
      }

      const index = parseInt(position);

      if (isNaN(index)) {
        return;
      }

      return this.items[index];
    };

    window.welpodron.carousel.prototype.getNextDirection = function (nextItem) {
      const currentItemIndex = this.items.indexOf(this.currentItem);
      const nextItemIndex = this.items.indexOf(nextItem);

      const firstIndex = 0;
      const lastIndex = this.items.length - 1;

      if (nextItemIndex === lastIndex && currentItemIndex === firstIndex) {
        return 'right';
      }

      if (nextItemIndex === firstIndex && currentItemIndex === lastIndex) {
        return 'left';
      }

      return nextItemIndex > currentItemIndex ? 'left' : 'right';
    };

    window.welpodron.carousel.prototype.slide = function (position) {
      if (this.translating) {
        return;
      }

      const nextItem = this.getNextItem(position);

      if (!nextItem || nextItem === this.currentItem) {
        return;
      }

      const direction = this.getNextDirection(nextItem);

      // console.log(direction);

      this.translating = true;
      // TODO: REWORK INDICATORS!
      const indicatorCurrent = document.querySelector(
        `[data-item-id="${this.currentItem.id}"]`
      );
      const indicatorNext = document.querySelector(
        `[data-item-id="${nextItem.id}"]`
      );

      const animationCurrent = new window.welpodron.animation({
        duration: 700,
        from: { x: 0 },
        to: { x: 100 },
        step: (state) => {
          this.currentItem.style.transform = `translateX(${
            direction === 'left' ? '-' : ''
          }${state.props.x}%)`;
        },
        easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
        after: () => {
          this.currentItem.removeAttribute('data-active');
          if (indicatorCurrent) {
            indicatorCurrent.removeAttribute('data-active');
          }
          this.currentItem.style.transform = '';
        }
      });

      const animationNext = new window.welpodron.animation({
        duration: 700,
        from: { x: 100 },
        to: { x: 0 },
        before: () => {
          nextItem.style.transform = `translateX(${
            direction === 'left' ? '-' : ''
          }100%)`;
          nextItem.style.display = 'block';
        },
        step: (state) => {
          nextItem.style.transform = `translateX(${
            direction === 'left' ? '' : '-'
          }${state.props.x}%)`;
        },
        easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
        after: () => {
          nextItem.setAttribute('data-active', '');
          if (indicatorNext) {
            indicatorNext.setAttribute('data-active', '');
          }
          nextItem.style.display = '';
          nextItem.style.transform = '';
        }
      });

      Promise.all([animationCurrent.finished, animationNext.finished]).then(
        () => {
          this.currentItem = nextItem;
          this.translating = false;
        }
      );

      animationCurrent.start();
      animationNext.start();
    };

    window.welpodron.carouselList = [];

    document.querySelectorAll('[data-carousel]').forEach((element) => {
      window.welpodron.carouselList.push(
        new window.welpodron.carousel({
          dom: element
        })
      );
    });
  }
})(window);
