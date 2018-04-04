'use strict';

const db = {
    register,
    getDb,
    getModel,
    getModels
};

let instances = [];

Object.defineProperty(db, 'dbs', {
    configurable: false,
    enumerable: true,
    get: () => instances.reduce((dbs, instance) => {
        dbs[instance.name] = instance.db;
        return dbs;
    }, {})
});

module.exports = db;

function register(name, db) {
    const instance = findDb(name);
    if (!instance) {
        instances.push({
            name,
            db
        });
    } else {
        instance.db = db;
    }
}

function getModel(dbName, modelName) {
    let instance;
    let model;
    
    if (dbName != null && modelName != null) {
        instance = getDb(dbName);
    } else if (dbName != null && modelName == null) {
        modelName = dbName;
        instance = getDb();
    }
    
    model = instance.models[modelName];
    
    if (!model) {
        throw new Error('Database model not found');
    }
    
    return model;
}

function getModels(dbName) {
    return getDb(dbName).models;
}

function findDb(dbName) {
    return instances.find(db => db.name === dbName);
}

function getDb(dbName) {
    let instance;
    if (dbName) {
        instance = findDb(dbName);
    } else {
        instance = instances[0];
    }
    
    if (!instance) {
        throw new Error('Database not found');
    }
    
    return instance.db;
}
