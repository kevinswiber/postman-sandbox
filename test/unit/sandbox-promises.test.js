const { expect } = require('chai');

describe('promises inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should set the execution to return async', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) {
                return done(err);
            }

            var executionError = sinon.spy();

            ctx.on('execution.error', executionError);

            ctx.execute(`"use sandbox2";
                const message = new Promise((resolve) => {
                    resolve("test");
                });
                message.then((result) => { });
            `,
            function (err, res) {
                if (err) {
                    return done(err);
                }

                expect(res).to.nested.include({
                    'return.async': true
                });

                expect(executionError).to.not.have.been.called;

                done();
            });
        });
    });

    it('should call assertions once resolved', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) {
                return done(err);
            }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    const message = new Promise((resolve) => {
                        resolve("test");
                    });
                    message.then((result) => {
                        done();
                    });
                });
            `,
            function (err, res) {
                if (err) {
                    return done(err);
                }

                expect(res).to.nested.include({
                    'return.async': true
                });

                expect(executionError).to.not.have.been.called;


                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.include({
                        passed: true,
                        async: true
                    });


                done();
            });
        });
    });

    it('should terminate script ' +
        'if async done is not called in a Promise', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    Promise.resolve(42).then(function () {
                        // done not called
                    });
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.not.have.been.called;
                expect(err).to.be.null; // no error

                done();
            });
        });
    });

    it('should forward errors from a Promise', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    Promise.resolve('Catch me if you can').then((msg) => {
                        done(new Error(msg));
                    })
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        async: true,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'Catch me if you can'
                        }
                    });
                done();
            });
        });
    });

    it('should forward synchronous ' +
        'errors from asynchronous Promise tests', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    new Promise((resolve) => {
                        resolve('Catch me if you can');
                    }).then((msg) => {
                        done(new Error(msg));
                    })

                    throw new Error('there is no right way to do something wrong');
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        async: true,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'there is no right way to do something wrong'
                        }
                    });
                done();
            });
        });
    });

    it.skip('throw an error on a rejected, uncaught Promise', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    new Promise((resolve, reject) => {
                        console.log('rejecting')
                        reject('there is no right way to do something wrong');
                    }).then();
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        async: true,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'there is no right way to do something wrong'
                        }
                    });
                done();
            });
        });
    });

    it('runs multiple consecutive Promises', function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy();

            ctx.on('execution.error', executionError);

            ctx.execute(`"use sandbox2";
var promiseMethod = function(text) {
   var promise = new Promise(function(resolve, reject){
      console.log('Enter: ' + text);
      setTimeout(function() {
         console.log('Complete: ' + text);
         resolve({data: text + ' 123'});
      }, 2000);
   });
   return promise;
};

promiseMethod('first')
   .then((v) => {return promiseMethod('second');})
   .then((v) => {return promiseMethod('third');})
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                done();
            });
        });
    });
});
