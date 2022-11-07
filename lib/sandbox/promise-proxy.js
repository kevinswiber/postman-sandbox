function createPromiseInterceptor (timers) {
    return new Proxy(Promise, {
        // Trap Promise constructor calls to also trap the resulting instance.
        construct (target, args) {
            const promise = Reflect.construct(target, args),
                protoProxy = new Proxy(promise, {
                    get (target, prop, receiver) {
                        if (prop !== 'then') {
                            return Reflect.call(target, prop, receiver);
                        }

                        const then = target.then.bind(target);

                        return function () {
                            const eventId = timers.setPromise(),
                                ret = then(...arguments);

                            // Internally, JavaScript engines will enqueue the execution of
                            // Promise.prototype.then. This presents a challenge to
                            // cross-runtime async lifetime tracking.
                            //
                            // We clear tracking on the next tick of the event loop to
                            // ensure we allow the `then` microtask time to execute.
                            setImmediate(() => {
                                timers.clearPromise(eventId);
                            });

                            return ret;
                        };
                    }
                });

            return protoProxy;
        }
    });
}

exports.createPromiseInterceptor = createPromiseInterceptor;
