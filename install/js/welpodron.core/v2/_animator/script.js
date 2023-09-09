"use strict";
((window) => {
    if (!window.welpodron) {
        window.welpodron = {};
    }
    class Animator {
        timer = 0;
        state = {
            completed: false,
            props: {},
            elapsed: 0,
        };
        elapsed = 0;
        initialDuration = 0;
        duration = 0;
        direction = "forwards";
        initialFrom = {};
        initialTo = {};
        from = {};
        to = {};
        isStopped = false;
        isStarted = false;
        step = () => { };
        before = () => { };
        after = () => { };
        constructor({ config }) {
            this.duration = config.duration;
            this.initialDuration = config.duration;
            this.before = config.before;
            this.after = config.after;
            this.step = config.step;
            Object.keys(config.from).forEach((key) => {
                if (config.to[key] != undefined) {
                    this.from[key] = config.from[key];
                    this.to[key] = config.to[key];
                    this.initialFrom[key] = config.from[key];
                    this.initialTo[key] = config.to[key];
                    this.state.props[key] = config.from[key];
                }
            });
        }
        frame = (progress) => {
            Object.keys(this.from).forEach((key) => {
                this.state.props[key] =
                    this.from[key] + (this.to[key] - this.from[key]) * progress;
            });
            this.state.elapsed = this.elapsed;
            this.step(this.state);
        };
        start = () => {
            this.isStarted = true;
            let start = null;
            let easing = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
            let animation = (time) => {
                if (this.isStopped) {
                    return;
                }
                if (start === null) {
                    start = time;
                }
                let progress = (time - start) / this.duration;
                this.elapsed = time - start;
                if (progress >= 1 || this.elapsed >= this.duration) {
                    progress = 1;
                }
                this.frame(easing(progress));
                if (progress >= 1) {
                    this.stop();
                }
                else {
                    this.timer = requestAnimationFrame(animation);
                }
            };
            if (this.before) {
                this.before();
            }
            this.timer = requestAnimationFrame(animation);
        };
        finish = () => {
            this.isStopped = true;
            cancelAnimationFrame(this.timer);
            this.state.completed = true;
            this.frame(1);
        };
        stop = () => {
            this.isStopped = true;
            cancelAnimationFrame(this.timer);
            if (this.direction === "forwards") {
                this.elapsed = this.duration;
                this.state.elapsed = this.duration;
            }
            else if (this.direction === "backwards") {
                this.elapsed = 0;
                this.state.elapsed = 0;
            }
            this.state.completed = true;
            if (this.after) {
                this.after();
            }
            console.log({
                height: this.state.props.height,
                elapsedState: this.state.elapsed,
                elapsedInner: this.elapsed,
            });
        };
        toggle = () => {
            this.isStopped = true;
            cancelAnimationFrame(this.timer);
            console.log("toggle");
            if (!this.isStarted) {
                this.elapsed = 0;
                this.isStopped = false;
                return this.start();
            }
            //! TODO: Duration нужно считать как-то другим способом ибо elapsed пересчитывается
            //! Как проверить можно просто начать спамить тоглы и посмотреть как ведет себя анимация и будет видно что она резко перескачет
            //! Неправильно рассчитывается именно время назад
            //! Особенно заметно если (при движении вперед):
            //! Анимация почти дошла до 100; Нажали Toggle (поехали назад); Затем снова Toggle (поехали вперед); И затем снова Toggle (поехали назад) и анимация будет мегабыстрой
            if (this.direction === "forwards") {
                Object.keys(this.from).forEach((key) => {
                    if (this.to[key] != undefined) {
                        this.from[key] = this.state.props[key];
                        this.to[key] = this.initialFrom[key];
                    }
                });
                this.duration = this.state.elapsed;
                this.direction = "backwards";
            }
            else if (this.direction === "backwards") {
                Object.keys(this.to).forEach((key) => {
                    if (this.from[key] != undefined) {
                        this.from[key] = this.state.props[key];
                        this.to[key] = this.initialTo[key];
                    }
                });
                this.duration = this.initialDuration - this.state.elapsed;
                this.direction = "forwards";
            }
            this.isStopped = false;
            this.start();
        };
    }
    window.welpodron.animator = Animator;
})(window);
//# sourceMappingURL=script.js.map