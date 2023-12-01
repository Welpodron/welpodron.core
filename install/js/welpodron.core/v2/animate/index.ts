import { deferred } from '../utils';

export const animate = ({
  element,
  callback,
}: {
  element: HTMLElement;
  callback: () => void;
}) => {
  const promise = deferred();

  callback();

  const timer = setTimeout(() => {
    element.addEventListener(
      'transitionend',
      () => {
        promise.resolve();
      },
      { once: true }
    );
    element.dispatchEvent(new TransitionEvent('transitionend'));
  }, parseFloat(getComputedStyle(element).transitionDuration) * 1000);

  return {
    promise,
    timer,
  };
};
