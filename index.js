'use strict';

const Random = require('random-js');

const defaultConfig = {
    crypto: true,
    shuffle: true,
    pick: true
};

exports.plugin = function plugin(forum, config) {
    Object.keys(defaultConfig).forEach((key) => {
        if (!config.hasOwnProperty(key)) {
            config[key] = defaultConfig[key];
        }
    });

    const instance = {
        activate: activate,
        deactivate: () => {},
        shuffle: shuffle
    };

    function shuffle(command) {
        return new Promise((resolve) => {
            const input = command.args.join(', ');
            const shuffled = instance.random.shuffle(command.args).join(', ');
            const txt = `shuffling: ${input}...\n\n${shuffled}`;
            command.reply(txt);
            resolve();
        });
    }
    
    function pick(command) {
        return new Promise((resolve) => {
            let count = command.args.shift();
            if (!/^[0-9]+$/.test(count)){
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

    function activate() {
        if (config.crypto) {
            instance.random = new Random(Random.engines.browserCrypto);
        } else {
            const engine = Random.engines.mt19937();
            engine.autoSeed();
            instance.random = new Random(engine);
        }
        if (config.shuffle) {
            forum.Commands.add('shuffle', 'Shuffle arguments into a random order', shuffle);
        }
        if (config.pick) {
            forum.Commands.add('pick', 'pick elements from arguments', pick);
        }
    }
    return instance;
};
exports.plugin.defaultConfig = defaultConfig;
