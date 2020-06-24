// return Product model as a function

module.exports = function (sequelize, DataTypes) {
    const Product = sequelize.define('Product', {
        name: DataTypes.STRING,
        inventory: DataTypes.INTEGER,
    });

    Product.associate = function (models) {
        models.Product.belongsTo(models.Category);
    };

    return Product;
};
