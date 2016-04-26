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
    pick: true
};

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
        pick: pick
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
        return Promise.all(commands.map((command) => forum.Commands.add.apply(forum.Commands, command)));
    }
    return instance;
};
module.exports.defaultConfig = defaultConfig;
