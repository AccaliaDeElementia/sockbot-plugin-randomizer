'use strict';
/**
 * Ransomizer plugin, does things with randomization.
 * @module sockbot-plugin-randomizer
 * @author Accalia
 * @license MIT
 */
const Random = require('random-js');

const defaultConfig = {
    crypto: true,
    shuffle: true,
    pick: true,
    magic8: true,
    wasteaguid: true,
    password: true
};

const magic8responses = [
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
    Object.keys(defaultConfig).forEach((key) => {
        if (!config.hasOwnProperty(key)) {
            config[key] = defaultConfig[key];
        }
    });

    const instance = {
        activate: activate,
        deactivate: () => {},
        shuffle: shuffle,
        pick: pick,
        magic8: magic8,
        magic8responses: magic8responses,
        wasteaguid: wasteaguid,
        password: password
    };

    /**
     * Permute the arguments of the command and reply with results
     *
     * @param {Command} command The command to premutate
     * @returns {Promise} Resolves when processing is complete
     */
    function shuffle(command) {
        return new Promise((resolve) => {
            const input = command.args.join(', ');
            const shuffled = instance.random.shuffle(command.args).join(', ');
            const txt = `shuffling: ${input}...\n\n${shuffled}`;
            command.reply(txt);
            resolve();
        });
    }

    /**
     * Pick a sample from the arguments of the command and reply with results
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    function pick(command) {
        return new Promise((resolve) => {
            let count = command.args.shift();
            if (!/^[0-9]+$/.test(count)) {
                command.args.unshift(count);
                count = '1';
            }
            count = parseInt(count, 10);
            const picked = instance.random.sample(command.args, count).join(', ');
            const txt = `picking ${count} items from: ${command.args.join(', ')}...\n\n${picked}`;
            command.reply(txt);
            resolve();
        });
    }

    /**
     * Waste a GUID
     *
     * Thanks for that >:-(
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    function wasteaguid(command) {
        return new Promise((resolve) => {
            const uuid = instance.random.uuid4();
            const txt = `Once they are gone, they're gone for good\n\n### ${uuid}\n\n` +
                'Thank You for making one less GUID available to the rest of us!';
            command.reply(txt);
            resolve();
        });
    }

    /**
     * Create a password
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    function password(command) {
        const pool = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz_';
        return new Promise((resolve) => {
            const passwd = instance.random.string(32, pool);
            let txt = null;
            if (command.parent.ids.post >= 0) {
                txt = `Your Precompromised Password is: ${passwd}}`;
            } else {
                txt = `Your Generated Password is: ${passwd}}`;
            }
            command.reply(txt);
            resolve();
        });
    }

    /**
     * Emulate a Magic 8 ball
     *
     * @param {Command} command the command to process
     *
     * @returns {Promise} Resolves when processing is complete
     */
    function magic8(command) {
        return new Promise((resolve) => {
            const response = instance.random.sample(magic8responses, 1)[0];
            const txt = `The spirits say.... ${response}`;
            command.reply(txt);
            resolve();
        });
    }

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
        if (config.shuffle) {
            commands.push(['shuffle', 'Shuffle arguments into a random order', shuffle]);
        }
        if (config.pick) {
            commands.push(['pick', 'pick elements from arguments', pick]);
        }
        if (config.magic8) {
            commands.push(['magic8', 'consult the spirits for guidance', magic8]);
        }
        if (config.wasteaguid) {
            commands.push(['wasteaguid', 'waste a GUID', wasteaguid]);
        }
        if (config.password) {
            commands.push(['password', 'generate a secure password', password]);
        }
        return Promise.all(commands.map((command) => forum.Commands.add.apply(forum.Commands, command)));
    }
    return instance;
};
module.exports.defaultConfig = defaultConfig;
