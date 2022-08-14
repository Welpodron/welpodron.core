(function (window) {
  if (welpodron && welpodron.collapsesList && welpodron.collapse) {
    window.welpodron.accordion = function (config = {}) {
      this.dom = config.dom;
      this.currentCollapse = null;

      this.collapses = [];
      // TODO: FIX RECURSION SEE FORMS
      const items = [
        ...this.dom.querySelectorAll(`[data-accordion-item][data-collapse]`)
      ];

      items.forEach((item) => {
        const collapse = window.welpodron.collapsesList.find(
          (element) => element.dom === item
        );
        if (collapse) {
          this.collapses.push(collapse);
        }
      });

      for (let i = 0; i < this.collapses.length; i++) {
        if (this.collapses[i].dom.getAttribute('data-active') !== null) {
          this.currentCollapse = this.collapses[i];
          break;
        }
      }

      this.collapses.forEach((collapse) => {
        if (this.currentCollapse) {
          if (this.currentCollapse === collapse) {
            collapse.active = true;
            collapse.dom.setAttribute('data-active', '');
          } else {
            collapse.active = false;
            collapse.dom.removeAttribute('data-active');
          }
        }

        collapse.beforeShow = (instance) => {
          this.collapses
            .filter((collapse) => collapse !== instance)
            .forEach((collapse) => {
              collapse.hide();
            });
        };
      });
    };

    window.welpodron.accordionsList = [];

    document.querySelectorAll('[data-accordion]').forEach((element) => {
      window.welpodron.accordionsList.push(
        new window.welpodron.accordion({
          dom: element
        })
      );
    });
  }
})(window);
