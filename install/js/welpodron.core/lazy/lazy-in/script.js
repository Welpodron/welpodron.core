(function (window) {
  const targets = document.querySelectorAll('[data-lz-in]');

  const lazyload = (target) => {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');

          if (src) {
            img.src = src;
          }

          const srcset = img.getAttribute('data-srcset');

          if (srcset) {
            img.srcset = srcset;
          }

          observer.disconnect();
        }
      });
    });

    io.observe(target);
  };

  targets.forEach((target) => {
    lazyload(target);
  });
})(window);
