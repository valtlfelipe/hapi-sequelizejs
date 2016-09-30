// return Category model as a function to sequelize.import()

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Category', {
        name: DataTypes.STRING,
        rootCategory: DataTypes.BOOLEAN
    }, {
        classMethods: {
            associate(models) {
                models.Category.hasMany(models.Product);
            }
        }
    });
};
