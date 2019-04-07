# hapi-sequelizejs

[![npm version](https://img.shields.io/npm/v/hapi-sequelizejs.svg)](https://www.npmjs.com/package/hapi-sequelizejs)
[![Build Status](https://travis-ci.org/valtlfelipe/hapi-sequelizejs.svg?branch=master)](https://travis-ci.org/valtlfelipe/hapi-sequelizejs)
[![Coverage Status](https://coveralls.io/repos/github/valtlfelipe/hapi-sequelizejs/badge.svg?branch=master)](https://coveralls.io/github/valtlfelipe/hapi-sequelizejs?branch=master)

hapi.js plugin for the Sequelize ORM

### What's the difference between hapi-sequelize and hapi-sequelizejs?

The reason of creating this fork is the inactivity of the original [hapi-sequelize](https://github.com/danecando/hapi-sequelize) plugin.
See the [Migration guide](https://github.com/valtlfelipe/hapi-sequelizejs/wiki/Migration-guide).

### Compatibility

Compatible with hapi.js version `18.x` and sequelize `5.x`.

### Installation

`npm install --save hapi-sequelizejs`

### Configuration

Simply pass in your sequelize instance and a few basic options and voila. Options accepts a single object
or an array for multiple dbs.

```javascript
server.register([
    {
        plugin: require('hapi-sequelizejs'),
        options: [
            {
                name: 'dbname', // identifier
                models: [__dirname + '/server/models/**/*.js'], // paths/globs to model files
                ignoredModels: [__dirname + '/server/models/**/*.js'], // OPTIONAL: paths/globs to ignore files
                sequelize: new Sequelize(config, opts), // sequelize instance
                sync: true, // sync models - default false
                forceSync: false, // force sync (drops tables) - default false
            },
        ],
    },
]);
```

### Model Definitions

A model should export a function that returns a Sequelize model definition ([http://docs.sequelizejs.com/en/latest/docs/models-definition/](http://docs.sequelizejs.com/en/latest/docs/models-definition/)).

```javascript
module.exports = function(sequelize, DataTypes) {
    const Category = sequelize.define('Category', {
        name: DataTypes.STRING,
        rootCategory: DataTypes.BOOLEAN,
    });

    return Category;
};
```

#### Setting Model associations

Using the sequelize model instance, define a method called `associate`, that is a function, and receives as parameter all models defined.

```javascript
module.exports = function(sequelize, DataTypes) {
    const Category = sequelize.define('Category', {
        name: DataTypes.STRING,
        rootCategory: DataTypes.BOOLEAN,
    });

    Category.associate = function(models) {
        models.Category.hasMany(models.Product);
    };

    return Category;
};
```

### Database Instances

Each registration adds a DB instance to the `server.plugins['hapi-sequelizejs']` object with the
name option as the key.

```javascript
function DB(sequelize, models) {
    this.sequelize = sequelize;
    this.models = models;
}

// smth like this
server.plugins['hapi-sequelizejs'][opts.name] = new DB(opts.sequelize, models);
```

## API

### Using `request` object

#### `getDb(name)`

The request object gets decorated with the method `getDb`. This allows you to easily grab a
DB instance in a route handler. If you have multiple registrations pass the name of the one
you would like returned or else the single or first registration will be returned.

```javascript
handler(request, reply) {
    const db1 = request.getDb('db1');
    console.log(db1.sequelize);
    console.log(db1.models);
}
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.

##### `db.getModel('User')`

Returns single model that matches the passed argument or null if the model doesn't exist.

##### `db.getModels()`

Returns all models on the db instance

#### `getModels(dbName?)`

Returns all models registered in the given db's name or the models from the first registered db instance if no name is given to the function.

```javascript
handler(request, reply) {
    const models = request.getModels('db1');
    ...
}
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.

#### `getModel(dbName, modelName?)`

Return the model to the db's name instance. You may give only the model name to the function, if it's the case, it returns the model from the first registered db instance.

```javascript
handler(request, reply) {
    const myModel = request.getModel('db1', 'myModel');
    ...
}
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.
> If there isn't a model for the given name, an Error is thrown: `hapi-sequelizejs cannot find the ${modelName} model`.

---

### Without `request` object

To access the dbs intances without using the `request` object you may do this:

```javascript
const instances = require('hapi-sequelizejs').instances;
```

#### `instance.dbs`

Returns an Object with all instances registered.

```javascript
{
  [db.name]: db.instance
}
```

```javascript
const instances = require('hapi-sequelizejs').instances;
const dbs = instances.dbs;

dbs.myDb.getModel('User');
```

#### `getDb(name?)`

Returns the db instance for the given name or the first registered db instance if no name is given to the function.

```javascript
const instances = require('hapi-sequelizejs').instances;

const myDb = instances.getDb('myDb');

const firstRegisteredDb = instances.getDb();
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.

#### `getModels(dbName?)`

Returns all models registered in the given db's name or the models from the first registered db instance if no name is given to the function.

```javascript
const instances = require('hapi-sequelizejs').instances;

const myDbModels = instances.getModels('myDb');

const firstRegisteredDbModels = instances.getModels();
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.

#### `getModel(dbName, modelName?)`

Return the model to the db's name instance. You may give only the model name to the function, if it's the case, it returns the model from the first registered db instance.

```javascript
const instances = require('hapi-sequelizejs').instances;

const myDbMyModel = instances.getModel('myDb', 'myModel');

const firstRegisteredDbMyModel = instances.getModel('myModel');
```

> If there isn't a db instance for the given name or no registered db instance, an Error is thrown: `hapi-sequelizejs cannot find the ${dbName} database instance`.
> If there isn't a model for the given name, an Error is thrown: `hapi-sequelizejs cannot find the ${modelName} model`.

### TODO/Contributing

-   finalize api
-   write tests
-   improve readme
