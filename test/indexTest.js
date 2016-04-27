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
        const commands = ['shuffle', 'pick', 'magic8'];
        commands.forEach((command) => {
            it(`should return an object with a command handler function for ${command}`, () => {
                randomizer({}, {})[command].should.be.a('function');
            });
        });
    });
    describe('config', () => {
        const defaultKeys = ['crypto', 'shuffle', 'pick', 'magic8'];
        defaultKeys.forEach((key) => {
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
        let instance = null;
        const randomized = ['j', 'h', 'b', 'c', 'd'];
        beforeEach(() => {
            instance = randomizer({}, {});
            instance.random = {
                sample: sinon.stub().returns(randomized)
            };
        });
        it('should return a promise', () => {
            return instance.pick({
                args: [1, 2],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should sample input', () => {
            const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            return instance.pick({
                args: input,
                reply: () => 0
            }).then(() => {
                instance.random.sample.calledWith(input).should.be.true;
            });
        });
        it('should sample input with sample size specified', () => {
            const input = ['42', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            const expectedInput = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
            return instance.pick({
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
            return instance.pick({
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
            return instance.pick({
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
            return instance.pick({
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
            return instance.pick({
                args: [1, 2],
                reply: () => 0
            }).should.be.rejectedWith(expected);
        });
    });
    describe('magic8', () => {
        let instance = null,
            randomized = null;
        beforeEach(() => {
            randomized = [`answer${Math.random()}`];
            instance = randomizer({}, {});
            instance.random = {
                sample: sinon.stub().returns(randomized)
            };
        });
        it('should return a promise', () => {
            return instance.magic8({
                args: [],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should reply with spiritual response', () => {
            const spy = sinon.spy();
            return instance.magic8({
                args: [],
                reply: spy
            }).then(() => {
                spy.calledWith(`The spirits say.... ${randomized}`).should.be.true;
            });
        });
        it('select response from standard responses', () => {
            const spy = sinon.spy();
            return instance.magic8({
                args: [],
                reply: spy
            }).then(() => {
                instance.random.sample.calledWith(instance.magic8responses, 1).should.be.true;
            });
        });
        it('should reject when sample throws', () => {
            const expected = new Error('bad');
            instance.random.sample.throws(expected);
            return instance.magic8({
                args: [],
                reply: () => 0
            }).should.be.rejectedWith(expected);
        });
    });
    describe('shuffle', () => {
        let instance = null;
        const randomized = [4, 0, 2, 9, 5, 1, 7, 6, 8, 3];
        beforeEach(() => {
            instance = randomizer({}, {});
            instance.random = {
                shuffle: sinon.stub().returns(randomized)
            };
        });
        it('should return a promise', () => {
            return instance.shuffle({
                args: [1, 2],
                reply: () => 0
            }).should.be.fulfilled;
        });
        it('should shuffle input', () => {
            const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            return instance.shuffle({
                args: input,
                reply: () => 0
            }).then(() => {
                instance.random.shuffle.calledWith(input).should.be.true;
            });
        });
        it('should reply with input as part of the response', () => {
            const spy = sinon.spy();
            return instance.shuffle({
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
            return instance.shuffle({
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
            return instance.shuffle({
                args: input,
                reply: spy
            }).then(() => {
                const text = spy.firstCall.args[0];
                text.should.endWith(expected);
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
        it('should add shuffle command when config enables shuffle', () => {
            config.shuffle = true;
            return instance.activate().then(() => {
                const text = 'Shuffle arguments into a random order';
                Commands.add.calledWith('shuffle', text, instance.shuffle).should.be.true;
                Commands.add.alwaysCalledOn(Commands).should.be.true;
            });
        });
        it('should not add shuffle command when config disables shuffle', () => {
            config.shuffle = false;
            return instance.activate().then(() => {
                Commands.add.calledWith('shuffle').should.be.false;
            });
        });
        it('should add pick command when config enables pick', () => {
            config.pick = true;
            return instance.activate().then(() => {
                const text = 'pick elements from arguments';
                Commands.add.calledWith('pick', text, instance.pick).should.be.true;
                Commands.add.alwaysCalledOn(Commands).should.be.true;
            });
        });
        it('should not add pick command when config disables pick', () => {
            config.pick = false;
            return instance.activate().then(() => {
                Commands.add.calledWith('pick').should.be.false;
            });
        });
        it('should add magic8 command when config enables magic8', () => {
            config.magic8 = true;
            return instance.activate().then(() => {
                const text = 'consult the spirits for guidance';
                Commands.add.calledWith('magic8', text, instance.magic8).should.be.true;
                Commands.add.alwaysCalledOn(Commands).should.be.true;
            });
        });
        it('should not add magic8 command when config disables magic8', () => {
            config.magic8 = false;
            return instance.activate().then(() => {
                Commands.add.calledWith('magic8').should.be.false;
            });
        });
    });
});
