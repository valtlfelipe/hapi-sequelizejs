// return Category model as a function

module.exports = function (sequelize, DataTypes) {
    const Category = sequelize.define('Category', {
        name: DataTypes.STRING,
        rootCategory: DataTypes.BOOLEAN,
    });

    Category.associate = function (models) {
        models.Category.hasMany(models.Product);
    };

    return Category;
};
