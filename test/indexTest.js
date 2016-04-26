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
        const commands = ['shuffle', 'pick'];
        commands.forEach((command) => {
            it(`should return an object with a command handler function for ${command}`, () => {
                randomizer({}, {})[command].should.be.a('function');
            });
        });
    });
    describe('config', () => {
        const defaultKeys = ['crypto', 'shuffle', 'pick'];
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
        let instance = null,
            sandbox = null;
        const randomized = ['j', 'h', 'b', 'c', 'd'];
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            instance = randomizer({}, {});
            instance.random = new Random();
            sandbox.stub(instance.random, 'sample').returns(randomized);
        });
        afterEach(() => sandbox.restore());
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
                args: [1,2,3],
                reply: spy
            }).then(() => {
                const response = spy.firstCall.args[0];
                response.should.endWith(expected);
            });
        });
    });
    describe('shuffle', () => {
        let instance = null,
            mt19937 = null,
            sandbox = null;
        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            instance = randomizer({}, {});
            mt19937 = Random.engines.mt19937();
            mt19937.seed(19860602);
            instance.random = new Random(mt19937);
            sandbox.spy(instance.random, 'shuffle');
        });
        afterEach(() => sandbox.restore());
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
        it('should return shuffled input', () => {
            const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const expected = [4, 0, 2, 9, 5, 1, 7, 6, 8, 3];
            return instance.shuffle({
                args: input,
                reply: () => 0
            }).then(() => {
                instance.random.shuffle.firstCall.returnValue.should.eql(expected);
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
            const expected = [4, 0, 2, 9, 5, 1, 7, 6, 8, 3].join(', ');
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
});
