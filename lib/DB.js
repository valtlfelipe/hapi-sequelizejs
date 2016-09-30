'use strict';

class DB {
    constructor(sequelize, models) {
        this.sequelize = sequelize;
        this.models = models;
    }

    getModel(name) {
        return this.models.hasOwnProperty(name) ? this.models[name] : null;
    }

    getModels() {
        return this.models;
    }
}

module.exports = DB;
