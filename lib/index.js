/**
 * hapi-sequelizejs
 *
 * hapi.js plugin for the Sequelize ORM
 *
 * ## config
 *  [{
 *    name: 'dbname',
 *    models: ['path/one/*.js', 'path/two/*.js'],
 *    sequelize: new Sequelize(options),
 *    sync: true,
 *    forceSync: false,
 *    debug: true,
 *    onConnect: function (database) { ... }
 *  }]
 *
 * @exports register
 */

'use strict';

const Joi = require('joi');
const { assert } = require('hoek');
const Schema = require('./schema');
const Models = require('./models');
const DB = require('./DB');
const Pkg = require('../package.json');

// Module globals
const internals = {};

internals.configure = async function(opts) {
    try {
        await opts.sequelize.authenticate();
    } catch (err) {
        throw new Error(
            `An error occurred while attempting to connect to DB [${
                opts.name
            }], please check the configuration. Details: ` + err.message,
        );
    }

    let db = null;
    if (opts.models) {
        const files = await Models.getFiles(opts.models, opts.ignoredModels);
        let models = await Models.load(files, opts.sequelize.import.bind(opts.sequelize));
        models = await Models.applyRelations(models);

        if (opts.sync) {
            await opts.sequelize.sync({ force: opts.forceSync });
        }

        db = new DB(opts.sequelize, models);
    } else {
        db = new DB(opts.sequelize, []);
    }

    if (opts.onConnect) {
        let onConnect = opts.onConnect(db);
        // if is a promise, wait until it finishes
        if (onConnect && typeof onConnect.then === 'function') {
            await onConnect;
        }
    }

    return db;
};

module.exports = {
    pkg: Pkg,
    once: true,
    async register(server, options) {
        assert(options, 'Missing hapi-sequelizejs plugin options');

        if (!Array.isArray(options)) options = [options];

        await Joi.validate(options, Schema.options);

        const getDb = request => {
            return function getDb(name) {
                if (!name) {
                    const key = Object.keys(request.server.plugins[Pkg.name]).shift();
                    return request.server.plugins[Pkg.name][key];
                } else if (!request.server.plugins[Pkg.name].hasOwnProperty(name)) {
                    throw new Error(`hapi-sequelizejs cannot find the ${name} database instance`);
                }

                return request.server.plugins[Pkg.name][name];
            };
        };

        server.decorate('request', 'getDb', getDb, {
            apply: true,
        });

        const configured = options.reduce(
            (acc, opts) => [
                ...acc,
                internals.configure(opts).then(db => {
                    server.expose(opts.name, db);
                    return db;
                }),
            ],
            [],
        );

        return Promise.all(configured);
    },
};
