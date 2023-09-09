(function (window) {
  const targets = document.querySelectorAll('[data-lz-bg][data-src]');

  const lazyload = (target) => {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bg = entry.target;
          const src = bg.getAttribute('data-src');
          bg.style.backgroundImage = `url(${src})`;
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
