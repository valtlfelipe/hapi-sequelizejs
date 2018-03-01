'use strict';

// Load modules
const Path = require('path');
const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Sequelize = require('sequelize');

const DB = require('../lib/DB');

// Module globals
const internals = {};

// Test shortcutse
const lab = (exports.lab = Lab.script());
const { suite, test } = lab;
const { expect } = Code;

suite('hapi-sequelizejs', () => {
    test('should fail to load with no options', async () => {
        const server = new Hapi.Server();

        try {
            await server.register([
                {
                    plugin: require('../lib/'),
                    options: {},
                },
            ]);
        } catch (error) {
            expect(error).to.be.instanceof(Error);
        }
    });

    test('should load a good configuration', async () => {
        const server = new Hapi.Server();
        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        expect(server.plugins['hapi-sequelizejs']).to.be.an.object();
        expect(server.plugins['hapi-sequelizejs'].test).to.be.instanceof(DB);
    });

    test('should load a bad models configuration', async () => {
        const server = new Hapi.Server();

        try {
            await server.register([
                {
                    plugin: require('../lib/'),
                    options: [
                        {
                            name: 'test',
                            models: '***',
                            sequelize: new Sequelize('test', null, null, {
                                logging: false,
                                dialect: 'sqlite',
                                storage: Path.join(__dirname, 'db.sqlite'),
                            }),
                        },
                    ],
                },
            ]);
        } catch (err) {
            expect(err).to.be.instanceof(Error);
        }
    });

    test('should load all models', async () => {
        const server = new Hapi.Server();
        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        models: [Path.join(__dirname, '/models/**/*.js')],
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        expect(server.plugins['hapi-sequelizejs']).to.be.an.object();
        expect(server.plugins['hapi-sequelizejs'].test).to.be.instanceof(DB);
        expect(server.plugins['hapi-sequelizejs'].test.getModels()).to.be.an.object();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('User')).to.be.a.function();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('Category')).to.be.a.function();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('Product')).to.be.a.function();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('DoesNotExists')).to.be.null();
    });

    test('should sync all models', async () => {
        const server = new Hapi.Server();
        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        models: Path.join(__dirname, '/models/**/*.js'),
                        sync: true,
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        expect(server.plugins['hapi-sequelizejs']).to.be.an.object();
        expect(server.plugins['hapi-sequelizejs'].test).to.be.instanceof(DB);
        expect(server.plugins['hapi-sequelizejs'].test.getModels()).to.be.an.object();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('User')).to.be.a.function();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('Category')).to.be.a.function();
        expect(server.plugins['hapi-sequelizejs'].test.getModel('Product')).to.be.a.function();
    });

    test('should get DB instance on request', async () => {
        const server = new Hapi.Server();

        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        models: [Path.join(__dirname, '/models/**/*.js')],
                        sync: true,
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        server.route([
            {
                method: 'GET',
                path: '/',
                handler(request, h) {
                    const instance = request.getDb();
                    expect(instance).to.be.instanceof(DB);
                    return h.response();
                },
            },
        ]);

        const response = await server.inject({ method: 'GET', url: '/' });
        expect(response.statusCode).to.equal(200);
    });

    test('should get named DB instance on request', async () => {
        const server = new Hapi.Server();
        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        models: [Path.join(__dirname, '/models/**/*.js')],
                        sync: true,
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        server.route([
            {
                method: 'GET',
                path: '/',
                handler(request, h) {
                    const instance = request.getDb('test');
                    expect(instance).to.be.instanceof(DB);
                    return h.response();
                },
            },
        ]);

        const response = await server.inject({ method: 'GET', url: '/' });
        expect(response.statusCode).to.equal(200);
    });

    test('should call onConnect', () => {
        const server = new Hapi.Server();

        return server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                        onConnect: instance => {
                            expect(instance).to.be.instanceof(DB);
                        },
                    },
                ],
            },
        ]);
    });

    test('should throw error on getting invalid named DB instance', async () => {
        const server = new Hapi.Server();

        await server.register([
            {
                plugin: require('../lib/'),
                options: [
                    {
                        name: 'test',
                        models: [Path.join(__dirname, '/models/**/*.js')],
                        sync: true,
                        sequelize: new Sequelize('test', null, null, {
                            logging: false,
                            dialect: 'sqlite',
                            storage: Path.join(__dirname, 'db.sqlite'),
                        }),
                    },
                ],
            },
        ]);

        server.route([
            {
                method: 'GET',
                path: '/',
                handler(request, reply) {
                    try {
                        request.getDb('inexistent');
                    } catch (err) {
                        expect(err).to.be.instanceOf(Error);
                        throw err;
                    }
                },
            },
        ]);

        const response = await server.inject({ method: 'GET', url: '/' });
        expect(response.statusCode).to.equal(500);
    });

    test('plugin fails to register when Sequelize fails to connect', async () => {
        const server = new Hapi.Server();

        try {
            await server.register([
                {
                    plugin: require('../lib/'),
                    options: [
                        {
                            name: 'test',
                            models: [Path.join(__dirname, '/models/**/*.js')],
                            sync: true,
                            sequelize: new Sequelize('shop', 'root', '', {
                                logging: false,
                                host: '127.0.0.1',
                                port: 3307,
                                dialect: 'mysql',
                            }),
                        },
                    ],
                },
            ]);
        } catch (err) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.include('ECONNREFUSED');
        }
    });
});
