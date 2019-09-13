class DB {
    constructor(sequelize, models) {
        this.sequelize = sequelize;
        this.models = models;
    }

    getModel(name) {
        return name in this.models ? this.models[name] : null;
    }

    getModels() {
        return this.models;
    }
}

module.exports = DB;
