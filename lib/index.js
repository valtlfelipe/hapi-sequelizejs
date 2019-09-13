const Joi = require('@hapi/joi');
const { assert } = require('@hapi/hoek');
const Schema = require('./schema');
const Models = require('./models');
const DB = require('./DB');
const Pkg = require('../package.json');
const instances = require('./instances');

module.exports = {
    pkg: Pkg,
    once: true,
    register,
    instances,
};

async function register(server, options) {
    assert(options, 'Missing hapi-sequelizejs plugin options');

    if (!Array.isArray(options)) {
        options = [options];
    }

    await Joi.assert(options, Schema.options);

    setupDecorators(server);

    server.events.on('stop', async function onStop() {
        const dbNames = options.map(option => option.name);
        const pluginContent = server.plugins[Pkg.name];

        await Promise.all(dbNames.map(dbName => pluginContent[dbName].sequelize.close()));
    });

    const configured = options.reduce(
        (acc, options) => [
            ...acc,
            configure(options).then(db => {
                server.expose(options.name, db);
                return db;
            }),
        ],
        [],
    );

    return Promise.all(configured);
}

async function configure(options) {
    try {
        await options.sequelize.authenticate();
    } catch (error) {
        throw new Error(
            `An error occurred while attempting to connect to DB[${options.name}],
            please check the configuration. Details: ${error.message}`,
        );
    }

    let db = null;
    if (options.models) {
        const files = await Models.getFiles(options.models, options.ignoredModels);
        let models = await Models.load(files, options.sequelize.import.bind(options.sequelize));
        models = await Models.applyRelations(models);

        if (options.sync) {
            await options.sequelize.sync({ force: options.forceSync });
        }

        db = new DB(options.sequelize, models);
    } else {
        db = new DB(options.sequelize, []);
    }

    instances.register(options.name, db);

    if (options.onConnect) {
        let onConnect = options.onConnect(db);

        if (onConnect && typeof onConnect.then === 'function') {
            await onConnect;
        }
    }

    return db;
}

function setupDecorators(server) {
    const options = { apply: true };
    server.decorate('request', 'getDb', () => instances.getDb, options);
    server.decorate('request', 'getModel', () => instances.getModel, options);
    server.decorate('request', 'getModels', () => instances.getModels, options);
}
