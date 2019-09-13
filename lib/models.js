const Path = require('path');
const Glob = require('glob');

module.exports = {
    getFiles,
    load,
    applyRelations,
};

async function getFiles(paths, ignored) {
    const options = {
        nodir: true,
        dot: false,
    };

    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    if (ignored) {
        options.ignore = ignored;
    }

    return paths.reduce((acc, pattern) => {
        const joinPaths = Array.prototype.concat.bind([], acc);
        const paths = Glob.sync(pattern, options);
        return joinPaths(paths);
    }, []);
}

async function load(files, fn) {
    if (!files) {
        return [];
    }

    if (!Array.isArray(files)) {
        files = [files];
    }

    return files.reduce((acc, file) => {
        const models = {};
        const filepath = Path.isAbsolute(file) ? file : Path.join(process.cwd(), file);
        const Model = fn(filepath);
        models[Model.name] = Model;
        return Object.assign({}, acc, models);
    }, {});
}

async function applyRelations(models) {
    if (typeof models !== 'object') {
        throw new Error(`Can't apply relationships on invalid models object`);
    }

    Object.keys(models).forEach(name => {
        if ('associate' in models[name]) {
            models[name].associate(models);
        }
    });

    return models;
}
