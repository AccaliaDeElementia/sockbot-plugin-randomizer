'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
chai.should();

const sinon = require('sinon');
require('sinon-as-promised');

const Random = require('random-js');
const randomizer = require('../index');

describe('sockbot-plugin-randomizer', () => {
    describe('module', () => {
        it('should export plugin function directly', () => {
            randomizer.should.be.a('function');
        });
        it('should return an object', () => {
            randomizer({}, {}).should.be.an('object');
        });
        it('should return an object with an activate function', () => {
            randomizer({}, {}).activate.should.be.a('function');
        });
        it('should return an object with a deactivate function', () => {
            randomizer({}, {}).deactivate.should.be.a('function');
        });
    });
    describe('config', () => {
        it('should store config in instance', () => {
            const cfg = {};
            const instance = randomizer({}, cfg);
            instance.config.should.equal(cfg);
        });
        it('should accept a non object config', () => {
            const instance = randomizer({}, true);
            instance.config.should.be.an('object');
        });
        it('should generate default config for non object config', () => {
            const instance = randomizer({}, true);
            Object.keys(instance.config).should.have.length.greaterThan(0);
            Object.keys(instance.config).forEach((key) => {
                instance.config[key].should.be.true;
            });
        });
        it('should ensure key crypto exists in config', () => {
            const cfg = {};
            randomizer({}, cfg);
            cfg.should.have.any.key('crypto');
        });
        it('should not override config value for crypto', () => {
            const cfg = {};
            const expected = Math.random();
            cfg.crypto = expected;
            randomizer({}, cfg);
            cfg.crypto.should.equal(expected);
        });
        Object.keys(randomizer.randomFns).forEach((key) => {
            it(`should ensure key ${key} exists in config`, () => {
                const cfg = {};
                randomizer({}, cfg);
                cfg.should.have.any.key(key);
            });
            it(`should not override config value for ${key}`, () => {
                const cfg = {};
                const expected = Math.random();
                cfg[key] = expected;
                randomizer({}, cfg);
                cfg[key].should.equal(expected);
            });
        });
    });
    describe('pick', () => {
        let instance = null,
            pick = null;
        const randomized = ['j', 'h', 'b', 'c', 'd'];
        beforeEach(() => {
            instance = {
                random: {
                    sample: sinon.stub().returns(randomized)
                }
            };
            pick = randomizer.randomFns.pick.bind(instance);
        });
        it('should return a promise', () => {
            return pick({
                args: [1, 2],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should sample input', () => {
            const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            return pick({
                args: input,
                reply: () => 0
            }).then(() => {
                instance.random.sample.calledWith(input).should.be.true;
            });
        });
        it('should sample input with sample size specified', () => {
            const input = ['42', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            const expectedInput = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            return pick({
                args: input,
                reply: () => 0
            }).then(() => {
                const actualInput = instance.random.sample.firstCall.args[0];
                actualInput.should.eql(expectedInput);
                const size = instance.random.sample.firstCall.args[1];
                size.should.equal(42);
                instance.random.sample.calledWith(input).should.be.true;
            });
        });
        it('should sample input with default sample size when size not specified', () => {
            const input = ['1a', '2b', '3c', '4d', '5e', '6f'];
            const expectedInput = ['1a', '2b', '3c', '4d', '5e', '6f'];
            return pick({
                args: input,
                reply: () => 0
            }).then(() => {
                const actualInput = instance.random.sample.firstCall.args[0];
                actualInput.should.eql(expectedInput);
                const size = instance.random.sample.firstCall.args[1];
                size.should.equal(1);
                instance.random.sample.calledWith(input).should.be.true;
            });
        });
        it('should include input in response', () => {
            const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            const expected = input.join(', ');
            input.unshift('5'); // the sample size
            const spy = sinon.spy();
            return pick({
                args: input,
                reply: spy
            }).then(() => {
                const response = spy.firstCall.args[0];
                response.should.contain(expected);
            });
        });
        it('should include sampled input at end of response', () => {
            const expected = randomized.join(', ');
            const spy = sinon.spy();
            return pick({
                args: [1, 2, 3],
                reply: spy
            }).then(() => {
                const response = spy.firstCall.args[0];
                response.should.endWith(expected);
            });
        });
        it('should reject when sample throws', () => {
            const expected = new Error('bad');
            instance.random.sample.throws(expected);
            return pick({
                args: [1, 2],
                reply: () => 0
            }).should.be.rejectedWith(expected);
        });
    });
    describe('shuffle', () => {
        let instance = null,
            shuffle = null;
        const randomized = [4, 0, 2, 9, 5, 1, 7, 6, 8, 3];
        beforeEach(() => {
            instance = {
                random: {
                    shuffle: sinon.stub().returns(randomized)
                }
            };
            shuffle = randomizer.randomFns.shuffle.bind(instance);
        });
        it('should return a promise', () => {
            return shuffle({
                args: [1, 2],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should shuffle input', () => {
            const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            return shuffle({
                args: input,
                reply: () => 0
            }).then(() => {
                instance.random.shuffle.calledWith(input).should.be.true;
            });
        });
        it('should reply with input as part of the response', () => {
            const spy = sinon.spy();
            return shuffle({
                args: [1, 2],
                reply: spy
            }).then(() => {
                spy.called.should.be.true;
            });
        });
        it('should reply with input as part of the response', () => {
            const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const expected = input.join(', ');
            const spy = sinon.spy();
            return shuffle({
                args: input,
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.contain(expected);
            });
        });
        it('should reply with shuffled input as part of the response', () => {
            const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const expected = randomized.join(', ');
            const spy = sinon.spy();
            return shuffle({
                args: input,
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.endWith(expected);
            });
        });
    });
    describe('wasteaguid', () => {
        let instance = null,
            randomized = null,
            wasteaguid = null;
        beforeEach(() => {
            randomized = `GUID${Math.random()}`;
            instance = {
                random: {
                    uuid4: sinon.stub().returns(randomized)
                }
            };
            wasteaguid = randomizer.randomFns.wasteaguid.bind(instance);
        });
        it('should return a promise', () => {
            return wasteaguid({
                args: [],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should reply with spiritual response', () => {
            const spy = sinon.spy();
            return wasteaguid({
                args: [],
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.contain(` ${randomized}\n`);
            });
        });
        it('select guid from random source', () => {
            const spy = sinon.spy();
            return wasteaguid({
                args: [],
                reply: spy
            }).then(() => {
                instance.random.uuid4.called.should.be.true;
            });
        });
        it('should reject when sample throws', () => {
            const expected = new Error('bad');
            instance.random.uuid4.throws(expected);
            return wasteaguid({
                args: [],
                reply: () => 0
            }).should.be.rejectedWith(expected);
        });
    });
    describe('magic8', () => {
        let instance = null,
            randomized = null,
            magic8 = null;
        beforeEach(() => {
            randomized = [`answer${Math.random()}`];
            instance = {
                random: {
                    sample: sinon.stub().returns(randomized)
                }
            };
            magic8 = randomizer.randomFns.magic8.bind(instance);
        });
        it('should return a promise', () => {
            return magic8({
                args: [],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should reply with spiritual response', () => {
            const spy = sinon.spy();
            return magic8({
                args: [],
                reply: spy
            }).then(() => {
                spy.calledWith(`The spirits say.... ${randomized}`).should.be.true;
            });
        });
        it('select response from standard responses', () => {
            const spy = sinon.spy();
            return magic8({
                args: [],
                reply: spy
            }).then(() => {
                instance.random.sample.calledWith(randomizer.randomFns.magic8.responses, 1).should.be.true;
            });
        });
        it('should reject when sample throws', () => {
            const expected = new Error('bad');
            instance.random.sample.throws(expected);
            return magic8({
                args: [],
                reply: () => 0
            }).should.be.rejectedWith(expected);
        });
    });
    describe('password', () => {
        let instance = null,
            randomized = null,
            password = null;
        beforeEach(() => {
            randomized = `answer${Math.random()}`;
            instance = {
                random: {
                    string: sinon.stub().returns(randomized)
                }
            };
            password = randomizer.randomFns.password.bind(instance);
        });
        it('should return a promise', () => {
            return password({
                args: [],
                parent: {
                    ids: {}
                },
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should generate password from unambiguous charset', () => {
            return password({
                args: [],
                parent: {
                    ids: {}
                },
                reply: () => 0
            }).then(() => {
                const unambiguous = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz_';
                instance.random.string.calledWith(32, unambiguous).should.be.true;
            });
        });
        it('should reply with generated password', () => {
            const spy = sinon.spy();
            return password({
                args: [],
                parent: {
                    ids: {}
                },
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.endWith(randomized);
            });
        });
        it('should snark if password is generated in public', () => {
            const spy = sinon.spy();
            return password({
                args: [],
                parent: {
                    ids: {
                        post: 8472
                    }
                },
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.contain('Precompromised Password');
                text.should.not.contain('Generated Password');
            });
        });
        it('should not snark if password is generated in private', () => {
            const spy = sinon.spy();
            return password({
                args: [],
                parent: {
                    ids: {
                        post: -1
                    }
                },
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.not.contain('Precompromised Password');
                text.should.contain('Generated Password');
            });
        });
    });
    describe('activate()', () => {
        let instance = null,
            config = null,
            Commands = null,
            sandbox = null;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            Commands = {
                add: sinon.stub().resolves()
            };
            config = {};
            instance = randomizer({
                Commands: Commands
            }, config);
        });
        afterEach(() => sandbox.restore());
        it('should create random generator', () => {
            chai.expect(instance.random).to.be.undefined;
            return instance.activate().then(() => {
                instance.random.should.be.an.instanceOf(Random);
            });
        });
        it('should use browserCrypto when config enables crypto', () => {
            config.crypto = true;
            return instance.activate().then(() => {
                instance.random.engine.should.equal(Random.engines.browserCrypto);
            });
        });
        it('should use mersenne twister when config disables crypto', () => {
            sandbox.spy(Random.engines, 'mt19937');
            config.crypto = false;
            return instance.activate().then(() => {
                Random.engines.mt19937.called.should.be.true;
            });
        });
        it('should configure mersenne twister when config disables crypto', () => {
            const engine = () => 0;
            engine.autoSeed = sinon.spy();
            sandbox.stub(Random.engines, 'mt19937').returns(engine);
            config.crypto = false;
            return instance.activate().then(() => {
                instance.random.engine.should.equal(engine);
                engine.autoSeed.called.should.be.true;
            });
        });
        Object.keys(randomizer.randomFns).forEach((command) => {
            describe(`command registration: ${command}`, () => {
                let original = null;
                beforeEach(() => {
                    original = randomizer.randomFns[command];
                    randomizer.randomFns[command] = sinon.stub().resolves();
                    randomizer.randomFns[command].help = original.help;
                    Object.keys(config).forEach((key) => {
                        config[key] = false;
                    });
                });
                afterEach(() => {
                    randomizer.randomFns[command] = original;
                });
                it('should not add command when config disables', () => {
                    config[command] = false;
                    return instance.activate().then(() => {
                        Commands.add.calledWith(command).should.be.false;
                    });
                });
                it('should add command when config enables', () => {
                    config[command] = true;
                    return instance.activate().then(() => {
                        const text = randomizer.randomFns[command].help;
                        Commands.add.calledWith(command, text).should.be.true;
                        Commands.add.alwaysCalledOn(Commands).should.be.true;
                    });
                });
                it('should passthrough command handler to configured', () => {
                    config[command] = true;
                    return instance.activate()
                        .then(() => Commands.add.firstCall.args[2]())
                        .then(() => {
                            randomizer.randomFns[command].called.should.be.true;
                        });
                });
                it('should passthrough command handler to configured with bound this value', () => {
                    config[command] = true;
                    return instance.activate()
                        .then(() => Commands.add.firstCall.args[2]())
                        .then(() => {
                            randomizer.randomFns[command].calledOn(instance).should.be.true;
                        });
                });
            });
        });
    });
    describe('decide', () => {
        let instance = null,
            decide = null;
        beforeEach(() => {
            instance = {
                random: {
                    bool: sinon.stub().returns(true)
                }
            };
            decide = randomizer.randomFns.decide.bind(instance);
        });
        it('should return a promise', () => {
            return decide({
                reply: () => 0
            }).should.be.resolved;
        });
        it('should reply in the affirmative', () => {
            instance.random.bool.returns(true);
            const spy = sinon.spy();
            return decide({
                reply: spy
            }).then(() => {
                spy.calledWith('Of course!').should.be.true;
            });
        });
        it('should reply in the negative', () => {
            instance.random.bool.returns(false);
            const spy = sinon.spy();
            return decide({
                reply: spy
            }).then(() => {
                spy.calledWith('Absolutely not!').should.be.true;
            });
        });
    });
    describe('flip', () => {
        let instance = null,
            flip = null;
        beforeEach(() => {
            instance = {
                random: {
                    bool: sinon.stub().returns(true)
                }
            };
            flip = randomizer.randomFns.flip.bind(instance);
        });
        it('should return a promise', () => {
            return flip({
                reply: () => 0
            }).should.be.resolved;
        });
        it('should reply in the affirmative', () => {
            instance.random.bool.returns(true);
            const spy = sinon.spy();
            return flip({
                reply: spy
            }).then(() => {
                spy.calledWith('Heads.').should.be.true;
            });
        });
        it('should reply in the negative', () => {
            instance.random.bool.returns(false);
            const spy = sinon.spy();
            return flip({
                reply: spy
            }).then(() => {
                spy.calledWith('Tails.').should.be.true;
            });
        });
    });
    describe('try', () => {
        let instance = null,
            tryFn = null;
        beforeEach(() => {
            instance = {
                random: {
                    real: sinon.stub().returns(0.5)
                }
            };
            tryFn = randomizer.randomFns.try.bind(instance);
        });
        it('should return a promise', () => {
            return tryFn({
                args: [],
                reply: () => 0
            }).should.be.resolved;
        });
        it('should reply in the positive', () => {
            let replyText = null;
            instance.random.real.returns(0.4);
            return tryFn({
                args: [0.5],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.endWith('Success');
            });
        });
        it('should reply in the positive', () => {
            let replyText = null;
            instance.random.real.returns(0.6);
            return tryFn({
                args: [0.5],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.endWith('Failure');
            });
        });
        it('should reply with chance percentage', () => {
            let replyText = null;
            instance.random.real.returns(0.6);
            const chance = Math.random();
            const chanceText = `p(${Math.round(chance * 100) / 100})`;
            return tryFn({
                args: [chance],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.contain(chanceText);
            });
        });
        it('should use default percentage with NaN chance', () => {
            let replyText = null;
            return tryFn({
                args: ['abc'],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.contain('p(0.5)');
            });
        });
        it('should use default percentage with subzero chance', () => {
            let replyText = null;
            return tryFn({
                args: ['-0.5'],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.contain('p(0.5)');
            });
        });
        it('should use default percentage with superunity chance', () => {
            let replyText = null;
            return tryFn({
                args: ['1.5'],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.contain('p(0.5)');
            });
        });
        it('should reply with notes text', () => {
            let replyText = null;
            const expected = 'i am the captain';
            return tryFn({
                args: [0.9, 'i', 'am', 'the', 'captain'],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.startWith(expected);
            });
        });
        it('should reply with notes text when using default percentage', () => {
            let replyText = null;
            const expected = '-0.9 i am the captain';
            return tryFn({
                args: [-0.9, 'i', 'am', 'the', 'captain'],
                reply: (text) => {
                    replyText = text;
                }
            }).then(() => {
                replyText.should.startWith(expected);
            });
        });

    });
});
