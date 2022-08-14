(function (window) {
  if (window.welpodron || window.welpodron.core) {
    window.welpodron.templater = {};

    window.welpodron.templater.renderString = (
      string,
      container,
      config = {}
    ) => {
      const templateElement = document.createElement('template');
      const template = config.trim === true ? string.trim() : string;
      templateElement.innerHTML = template;
      const fragment = templateElement.content;
      const replace = config.replace === true;

      fragment.querySelectorAll('script').forEach((sc) => {
        sc.parentNode.removeChild(sc);
        const script = document.createElement('script');
        script.text = sc.text;
        fragment.append(script);
      });

      const before = config.before || (() => void 0);

      before(fragment);

      if (window.welpodron.mutant) {
        if (container.dataset.mutant === 'true') {
          if (container.dataset.replace === 'true') {
            return container.replaceChildren(fragment);
          }
        }
      }

      if (replace) {
        return container.replaceChildren(fragment);
      }

      return container.appendChild(fragment);
    };
  }
})(window);
