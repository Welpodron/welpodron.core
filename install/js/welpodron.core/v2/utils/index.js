const deferred = () => {
    let resolver, promise;
    promise = new Promise((resolve, reject) => {
        resolver = resolve;
    });
    promise.resolve = resolver;
    return promise;
};
const sleep = ({ ms }) => {
    const promise = deferred();
    setTimeout(() => {
        promise.resolve();
    }, ms);
    return promise;
};
const utils = {
    deferred,
    sleep,
};

export { utils };
