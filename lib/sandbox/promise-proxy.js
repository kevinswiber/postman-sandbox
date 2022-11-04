function createPromiseInterceptor (timers) {
    return new Proxy(Promise, {
        construct (target, args) {
            const obj = Reflect.construct(target, args),
                protoProxy = new Proxy(obj, {
                    get (target, prop, receiver) {
                        if (prop === 'then') {
                            const then = target.then.bind(target);

                            return function () {
                                const eventId = timers.setPromise(),
                                    ret = then(...arguments);

                                // call on the next tick to avoid issues with synchronous executors
                                setImmediate(() => {
                                    timers.clearPromise(eventId);
                                });


                                return ret;
                            };
                        }

                        return Reflect.get(target, prop, receiver);
                    }
                });

            return protoProxy;
        }
    });
}

exports.createPromiseInterceptor = createPromiseInterceptor;
