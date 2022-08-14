(function (window) {
  if (window.welpodron || window.welpodron.core) {
    window.welpodron.mutant = function (element, config = {}) {
      this.element = element;
      this.replace = this.element.dataset.replace === 'true';

      this.onAdd = config.onAdd || (() => void 0);
      this.onRemove = config.onAdd || (() => void 0);

      this.observer = new MutationObserver((mutationRecords) => {
        console.log(mutationRecords); // console.log(изменения)
      });

      this.observer.observe(this.element, {
        childList: true, // наблюдать за непосредственными детьми
        subtree: true // и более глубокими потомками
      });
    };
  }
})(window);
