(function () {

class WelpodronCollapse {
  constructor(element) {
    this.DOM = element || null;

    if (this.DOM) {
      this.initiators = [
        ...document.querySelectorAll(
          `[data-collapse-initiator='true'][data-collapse-id='${this.DOM.id}']`
        )
      ];

      this.max = parseInt(this.DOM.dataset.collapseMax);

      this.initEventListeners();
    }
  }

  initEventListeners = () => {
    this.initiators.forEach((initiator) => {
      initiator.addEventListener('click', this.handleClick);
    });
  };

  runToggle = () => {
    if (this.max && window.innerWidth < this.max) {
      if (!this.DOM.classList.contains('w-collapsing')) {
        this.DOM.classList.contains('w-collapsed')
          ? this.runHide()
          : this.runShow();
      }
    }
  };

  runShow = () => {
    this.DOM.classList.remove('w-collapse');
    this.DOM.classList.add('w-collapsing');

    this.DOM.addEventListener('transitionend', this.handleTransitionShow);

    this.DOM.style.height = `${this.DOM.scrollHeight}px`;
  };

  runHide = () => {
    this.DOM.style.height = `${this.DOM.getBoundingClientRect().height}px`;

    this.DOM.classList.add('w-collapsing');
    this.DOM.classList.remove('w-collapse', 'w-collapsed');

    setTimeout(() => {
      this.DOM.addEventListener('transitionend', this.handleTransitionHide);
      this.DOM.style.height = '';
    });
  };

  handleClick = (e) => {
    e.preventDefault();

    this.runToggle();
  };

  handleTransitionShow = () => {
    this.DOM.classList.remove('w-collapsing');
    this.DOM.classList.add('w-collapse', 'w-collapsed');
    this.DOM.style.height = '';

    this.DOM.removeEventListener('transitionend', this.handleTransitionShow);
  };

  handleTransitionHide = () => {
    this.DOM.classList.remove('w-collapsing');
    this.DOM.classList.add('w-collapse');
    this.DOM.style.height = '';
    this.DOM.removeEventListener('transitionend', this.handleTransitionHide);
  };
}

const collapses = document.querySelectorAll('[data-collapse="true"]');

collapses.forEach((collapse) => {
    new WelpodronCollapse(collapse);
});
})();