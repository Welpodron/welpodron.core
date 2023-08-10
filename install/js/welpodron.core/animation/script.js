(function (window) {
  // TODO: Prefers reduced motion

  if (window.welpodron || window.welpodron.core) {
    window.welpodron.animation = function (config) {
      this.config = config;
      this.timer = null;
      this.state = {
        completed: false,
        props: {}
      };
      this.finished = window.welpodron.core.deferred();
    };

    window.welpodron.animation.prototype.start = function () {
      this._frame = (progress) => {
        // WTF???? Math round was here ????
        Object.keys(this.from).forEach((key) => {
          this.state.props[key] =
            this.from[key] + (this.to[key] - this.from[key]) * progress;
        });

        if (this.config.step) {
          this.config.step(this.state);
        }
      };

      this._animate = () => {
        let start = null;
        let easing = this.config.easing || ((value) => value);

        let animation = (time) => {
          if (start === null) {
            start = time;
          }

          let progress = (time - start) / this.config.duration;

          if (progress > 1) {
            progress = 1;
          }

          this._frame(easing(progress));

          if (progress == 1) {
            this.stop();
          } else {
            this.timer = requestAnimationFrame(animation);
          }
        };

        this.timer = requestAnimationFrame(animation);
      };

      if (this.config && this.config.from && this.config.to) {
        if (
          this.config.constructor.name === 'Object' &&
          this.config.from.constructor.name === 'Object' &&
          this.config.to.constructor.name === 'Object'
        ) {
          this.from = {};
          this.to = {};

          Object.keys(this.config.from).forEach((key) => {
            if (this.config.to[key] != undefined) {
              this.from[key] = this.config.from[key];
              this.to[key] = this.config.to[key];
              this.state.props[key] = this.config.from[key];
            }
          });
        }
      }

      if (this.config.before) {
        this.config.before(this.state);
      }

      this._animate();
    };

    window.welpodron.animation.prototype.stop = function () {
      if (this.timer) {
        cancelAnimationFrame(this.timer);
        this.timer = null;
        this.state.completed = true;

        if (this.config.after) {
          this.config.after(this.state);
        }

        this.finished.resolve();
      }
    };
  }
})(window);
