'use strict';
/**
 * Ransomizer plugin, does things with randomization.
 * @module sockbot-plugin-randomizer
 * @author Accalia
 * @license MIT
 */
const Random = require('random-js');

const defaultConfig = {
    crypto: true
};

/**
 * Reply with one ot the other texts randomly
 *
 * @param {Command} command the command to process
 * @param {Random} random source of randomness
 * @param {string} eitherValue one value
 * @param {string} orValue other value
 *
 * @returns {Promise} Resolves when processing is complete
 */
function eitherOr(command, random, eitherValue, orValue) {
    return new Promise((resolve) => {
        const value = random.bool();
        command.reply(value ? eitherValue : orValue);
        resolve();
    });
}

const randomFns = {
    /**
     * Pick items from the arguments of the command and reply with results
     *
     * @param {Command} command The command to premutate
     * @returns {Promise} Resolves when processing is complete
     */
    pick: function pick(command) {
        return new Promise((resolve) => {
            let count = command.args.shift();
            if (!/^[0-9]+$/.test(count)) {
                command.args.unshift(count);
                count = '1';
            }
            count = parseInt(count, 10);
            const picked = this.random.sample(command.args, count).join(', ');
            const txt = `picking ${count} items from: ${command.args.join(', ')}...\n\n${picked}`;
            command.reply(txt);
            resolve();
        });
    },
    /**
     * Permute the arguments of the command and reply with results
     *
     * @param {Command} command The command to premutate
     * @returns {Promise} Resolves when processing is complete
     */
    shuffle: function shuffle(command) {
        return new Promise((resolve) => {
            const input = command.args.join(', ');
            const shuffled = this.random.shuffle(command.args).join(', ');
            const txt = `shuffling: ${input}...\n\n${shuffled}`;
            command.reply(txt);
            resolve();
        });
    },
    /**
     * Waste a GUID
     *
     * Thanks for that >:-(
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    wasteaguid: function wasteaguid(command) {
        return new Promise((resolve) => {
            const uuid = this.random.uuid4();
            const txt = `Once they are gone, they're gone for good\n\n### ${uuid}\n\n` +
                'Thank You for making one less GUID available to the rest of us!';
            command.reply(txt);
            resolve();
        });
    },
    /**
     * Emulate a Magic 8 ball
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    magic8: function magic8(command) {
        return new Promise((resolve) => {
            const response = this.random.sample(randomFns.magic8.responses, 1)[0];
            const txt = `The spirits say.... ${response}`;
            command.reply(txt);
            resolve();
        });
    },
    /**
     * Create a password
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    password: function password(command) {
        const pool = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz_';
        return new Promise((resolve) => {
            const passwd = this.random.string(32, pool);
            const description = command.parent.ids.post >= 0 ? 'Precompromised' : 'Generated';
            const txt = `Your ${description} Password is: ${passwd}`;
            command.reply(txt);
            resolve();
        });
    },
    /**
     * Decide a yes no question
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    decide: function decide(command) {
        return eitherOr(command, this.random, 'Of course!', 'Absolutely not!');
    },
    /**
     * Flip a coin
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    flip: function flip(command) {
        return eitherOr(command, this.random, 'Heads.', 'Tails.');
    },
    /**
     * Attempt a thing with a certain chance of failure.
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    'try': function tryit(command) {
        return new Promise((resolve) => {
            const percentText = command.args.shift();
            let percent = parseFloat(percentText);
            if (isNaN(percent) || percent < 0 || percent > 1) {
                percent = 0.5;
                command.args.unshift(percentText);
            }
            const value = this.random.real(0, 1);
            const result = value <= percent ? 'Success' : 'Failure';
            const text = `${command.args.join(' ')} p(${Math.round(percent * 100) / 100}): ${result}`;
            command.reply(text);
            resolve();
        });
    }
};
randomFns.pick.help = 'pick elements from arguments';
randomFns.shuffle.help = 'shuffle arguments into a random order';
randomFns.wasteaguid.help = 'waste a guid for all of us';
randomFns.magic8.help = 'consult the spirits for guidance';
randomFns.password.help = 'generate a "secure" password';
randomFns.decide.help = 'decide a yes/no questiion';
randomFns.flip.help = 'flip a coin';

randomFns.magic8.responses = [
    'It is certain',
    'It is decidedly so',
    'Without a doubt',
    'Yes, definitely',
    'You may rely on it',
    'As I see it, yes',
    'Most likely',
    'Outlook good',
    'Yes',
    'Signs point to yes',
    'Reply hazy try again',
    'Ask again later',
    'Better not tell you now',
    'Cannot predict now',
    'Concentrate and ask again',
    'Don\'t count on it',
    'My reply is no',
    'My sources say no',
    'Outlook not so good',
    'Very doubtful'
];

// Activate all the functions by default.
Object.keys(randomFns).forEach((key) => {
    defaultConfig[key] = true;
});


/**
 * Plugin generation function.
 *
 * Returns a plugin object bound to the provided forum provider
 *
 * @param {Provider} forum Active forum Provider
 * @param {object} config Plugin Configuration
 * @returns {Plugin} An instance of the randomizer plugin
 */
module.exports = function randomizer(forum, config) {
    if (typeof config !== 'object') {
        config = {};
    }
    Object.keys(defaultConfig).forEach((key) => {
        if (!config.hasOwnProperty(key)) {
            config[key] = defaultConfig[key];
        }
    });

    const instance = {
        activate: activate,
        deactivate: () => {},
        config: config
    };

    /**
     * Activate the plugin.
     *
     * Register the configured commands and choose the randomness engine
     *
     * @returns {Promise} Resolves when plugin is fully activated
     */
    function activate() {
        if (config.crypto) {
            instance.random = new Random(Random.engines.browserCrypto);
        } else {
            const engine = Random.engines.mt19937();
            engine.autoSeed();
            instance.random = new Random(engine);
        }
        const commands = [];
        Object.keys(randomFns).forEach((command) => {
            if (config[command]) {
                const cmd = randomFns[command].bind(instance);
                commands.push([command, randomFns[command].help, cmd]);
            }
        });
        return Promise.all(commands.map((command) => forum.Commands.add.apply(forum.Commands, command)));
    }
    return instance;
};
module.exports.defaultConfig = defaultConfig;
module.exports.randomFns = randomFns;
