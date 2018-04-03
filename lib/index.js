'use strict';

const Joi = require('joi');
const { assert } = require('hoek');
const Schema = require('./schema');
const Models = require('./models');
const DB = require('./DB');
const Pkg = require('../package.json');

module.exports = {
    pkg: Pkg.name,
    once: true,
    register
};

async function register(server, options) {
    assert(options, 'Missing hapi-sequelizejs plugin options');

    if (!Array.isArray(options)) {
        options = [options];
    }

    await Joi.validate(options, Schema.options);

    server.decorate('request', 'getDb', getDb, {
        apply: true
    });

    server.events.on('stop', async function onStop() {
        const dbNames = this.options.map(option => option.name);
        const pluginContent = this.server.plugins[Pkg.name];

        await Promise.all(dbNames.map(dbName => pluginContent[dbName].sequelize.close()));
    });

    const configured = options.reduce(
        (acc, options) => [
            ...acc,
            configure(options).then(db => {
                server.expose(options.name, db);
                return db;
            })
        ], []
    );

    return Promise.all(configured);
}

async function configure(options) {
    try {
        await options.sequelize.authenticate();
    } catch(error) {
        throw new Error(
            `An error occurred while attempting to connect to DB[${options.name}
            ], please check the configuration. Details: ${error.message}`
        );
    }

    let db = null;
    if (options.models) {
        const files = await Models.getFiles(options.models);
        let models = await Models.load(files, options.sequelize.import.bind(options.sequelize));
        models = await Models.applyRelations(models);

        if (options.sync) {
            await options.sequelize.sync({ force: options.forceSync });
        }

        db = new DB(options.sequelize, models);
    } else {
        db = new DB(options.sequelize, []);
    }

    if (options.onConnect) {
        let onConnect = options.onConnect(db);

        if (onConnect && typeof onConnect.then === 'function') {
            await onConnect;
        }
    }

    return db;
}

function getDb(request) {
    return function getDb(name) {
        if (!name) {
            const key = Object.keys(request.server.plugins[Pkg.name]).shift();
            return request.server.plugins[Pkg.name][key];
        } else if (!request.server.plugins[Pkg.name].hasOwnProperty(name)) {
            throw new Error(`hapi-sequelize cannot find the ${name} database instance`);
        }

        return request.server.plugins[Pkg.name][name];
    }
}
