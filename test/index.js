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
const lab = exports.lab = Lab.script();
const suite = lab.suite;
const test = lab.test;
const expect = Code.expect;

suite('hapi-sequelizejs', () => {

    test('should fail to load with no options', (done) => {

        let server = new Hapi.Server();

        server.register([{
            register: require('../lib/'),
            options: {

            }
        }], (err) => {
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    test('should load a good configuration', (done) => {

        let server = new Hapi.Server();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();
            expect(server.plugins['hapi-sequelizejs']).to
                .be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test)
                .to.be.instanceof(DB);
            done();
        });
    });

    test('should load a bad models configuration', (done) => {

        let server = new Hapi.Server();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: '***',
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    test('should load all models', (done) => {

        let server = new Hapi.Server();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: [Path.join(
                    __dirname,
                    '/models/**/*.js'
                )],
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();
            expect(server.plugins['hapi-sequelizejs']).to
                .be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test)
                .to.be.instanceof(DB);
            expect(server.plugins['hapi-sequelizejs'].test
                .getModels()).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('User')).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('Category')).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('Product')).to.be.an.object();

            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('DoesNotExists')).to.be.null();

            done();
        });
    });

    test('should sync all models', (done) => {

        let server = new Hapi.Server();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: Path.join(__dirname,
                    '/models/**/*.js'),
                sync: true,
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();
            expect(server.plugins['hapi-sequelizejs']).to
                .be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test)
                .to.be.instanceof(DB);
            expect(server.plugins['hapi-sequelizejs'].test
                .getModels()).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('User')).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('Category')).to.be.an.object();
            expect(server.plugins['hapi-sequelizejs'].test
                .getModel('Product')).to.be.an.object();
            done();
        });
    });

    test('should get DB instance on request', (done) => {

        let server = new Hapi.Server();
        server.connection();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: [Path.join(
                    __dirname,
                    '/models/**/*.js'
                )],
                sync: true,
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();

            let handler = function (request, reply) {
                let instance = request.getDb();
                expect(instance).to.be.instanceof(
                    DB);
                return reply();
            };

            server.route([{
                method: 'GET',
                path: '/',
                handler: handler
            }, ]);

            server.inject({
                method: 'GET',
                url: '/'
            }, function (response) {
                expect(response.statusCode).to.equal(
                    200);
                done();
            });
        });
    });

    test('should get named DB instance on request', (done) => {

        let server = new Hapi.Server();
        server.connection();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: [Path.join(
                    __dirname,
                    '/models/**/*.js'
                )],
                sync: true,
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();

            let handler = function (request, reply) {
                let instance = request.getDb('test');
                expect(instance).to.be.instanceof(
                    DB);
                return reply();
            };

            server.route([{
                method: 'GET',
                path: '/',
                handler: handler
            }, ]);

            server.inject({
                method: 'GET',
                url: '/'
            }, function (response) {
                expect(response.statusCode).to.equal(
                    200);
                done();
            });
        });
    });

    test('should call onConnect', (done) => {

        let server = new Hapi.Server();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    }),
                onConnect: (instance) => {
                    expect(instance).to
                        .be.instanceof(
                            DB);
                    done();
                }
            }]
        }], (err) => {
            expect(err).to.be.undefined();
        });
    });

    test('should throw error on getting invalid named DB instance', (
        done) => {

        let server = new Hapi.Server();
        server.connection();
        server.register([{
            register: require('../lib/'),
            options: [{
                name: 'test',
                models: [Path.join(
                    __dirname,
                    '/models/**/*.js'
                )],
                sync: true,
                sequelize: new Sequelize(
                    'test', null, null, {
                        dialect: 'sqlite',
                        storage: Path.join(
                            __dirname,
                            'db.sqlite'
                        )
                    })
            }]
        }], (err) => {
            expect(err).to.be.undefined();

            let handler = function (request, reply) {
                try {
                    request.getDb('inexistent');
                } catch (err) {
                    expect(err).to.be.instanceOf(
                        Error);
                    return reply(err);
                }
            };

            server.route([{
                method: 'GET',
                path: '/',
                handler: handler
            }, ]);

            server.inject({
                method: 'GET',
                url: '/'
            }, function (response) {
                expect(response.statusCode).to.equal(
                    500);
                done();
            });
        });
    });

});

