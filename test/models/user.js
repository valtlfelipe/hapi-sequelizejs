// return User model as a function

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('User', {
        email: DataTypes.STRING,
        password: DataTypes.STRING,
    });
};
