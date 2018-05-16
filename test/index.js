'use strict';

// Load modules
const Path = require('path');
const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Sequelize = require('sequelize');

const DB = require('../lib/DB');

// Test shortcuts
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
                }
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

    test('should call onConnect with a promise', () => {
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
                            return Promise.resolve();
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
                handler(request) {
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

    test('should close sequelize connection on server stop', async () => {
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

        await server.stop();

        const sequelizeInstance = server.plugins['hapi-sequelizejs'].test.sequelize;
        expect(sequelizeInstance.authenticate()).to.reject();
    });

    test('should get db instances from instances singleton using dbs property', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.dbs).to.be.an.object();
        expect(instances.dbs.test).to.be.instanceof(DB);
    });

    test('should get db instance from instances singleton using getDb', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getDb('test')).to.be.an.object();
        expect(instances.getDb('test')).to.be.instanceof(DB);
    });

    test('should get first db instance when no dbName is given to getDb', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getDb()).to.be.instanceof(DB);
        expect(instances.getDb()).to.be.equal(instances.getDb('test'));
    });

    test('should load all models from db instance using getDb', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getDb('test').getModels()).to.be.an.object();
        expect(instances.getDb('test').getModel('User')).to.be.a.function();
        expect(instances.getDb('test').getModel('Category')).to.be.a.function();
        expect(instances.getDb('test').getModel('Product')).to.be.a.function();
        expect(instances.getDb('test').getModel('DoesNotExists')).to.be.null();
    });

    test('should load all models from db instance using getModels', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getModels('test')).to.be.an.object();
        expect(instances.getModels('test').User).to.be.a.function();
        expect(instances.getModels('test').Category).to.be.a.function();
        expect(instances.getModels('test').Product).to.be.a.function();
        expect(instances.getModels('test').DoesNotExists).to.be.undefined();
    });

    test('should load all models from first db instance when no dbName is given using getModels', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getModels()).to.be.an.object();
        expect(instances.getModels().User).to.be.a.function();
        expect(instances.getModels().Category).to.be.a.function();
        expect(instances.getModels().Product).to.be.a.function();
        expect(instances.getModels().DoesNotExists).to.be.undefined();
    });

    test('should load model from db instance using getModel', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getModel('test', 'User')).to.be.an.function();
        expect(instances.getModel('test', 'User')).to.be.equal(instances.getDb('test').getModel('User'));
    });

    test('should load model from first db instance when no dbName is given using getModel', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        expect(instances.getModel('User')).to.be.an.function();
        expect(instances.getModel('User')).to.be.equal(instances.getDb('test').getModel('User'));
    });

    test('should fail when there is no db instance to the given name using getDb', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        try {
            instances.getDb('other-testdb');
        } catch(error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.equal('Database not found');
        }
    });

    test('should fail when there is no model to the given name using getModels', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        try {
            instances.getModels('other-testdb');
        } catch(error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.equal('Database not found');
        }
    });

    test('should fail when there is no model to the given name using getModel', async () => {
        await instanceTestServer();

        const instances = require('../lib').instances;

        try {
            instances.getModel('test', 'DoesNotExist');
        } catch(error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.equal('Database model not found');
        }
    });

});

function instanceTestServer() {
    const server = new Hapi.Server();
    return server.register([
        {
            plugin: require('../lib/'),
            options: [
                {
                    name: 'test',
                    models: Path.join(__dirname, '/models/**/*.js'),
                    sequelize: new Sequelize('test', null, null, {
                        logging: false,
                        dialect: 'sqlite',
                        storage: Path.join(__dirname, 'db.sqlite'),
                    }),
                },
            ],
        },
    ]);
}
