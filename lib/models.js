'use strict';

const Path = require('path');
const Glob = require('glob');

function getFiles(paths, ignored) {
    return new Promise((resolve) => {
        const opts = {
            nodir: true,
            dot: false
        };

        if (!Array.isArray(paths)) paths = [paths];
        if (ignored) opts.ignore = ignored;

        return resolve(paths.reduce((acc, pattern) => {
            const joinPaths = Array.prototype.concat.bind([], acc);
            const paths = Glob.sync(pattern, opts);
            return joinPaths(paths);
        }, []));
    });
}

function load(files, fn) {
    return new Promise((resolve) => {
        if (!files) return resolve([]);
        if (!Array.isArray(files)) files = [files];

        return resolve(files.reduce((acc, file) => {
            const models = {};
            const filepath = Path.isAbsolute(file) ? file : Path.join(process.cwd(), file);
            const Model = fn(filepath);
            models[Model.name] = Model;
            return Object.assign({}, acc, models);
        }, {}));
    });
}

function applyRelations(models) {
    return new Promise((resolve) => {
        if (!models || typeof models !== 'object')
        throw new Error('Can\'t apply relationships on invalid models object');

        Object.keys(models).forEach((name) => {
            if (models[name].hasOwnProperty('associate')) {
                models[name].associate(models);
            }
        });

        return resolve(models);
    });
}

module.exports = {
    getFiles: getFiles,
    load: load,
    applyRelations: applyRelations
};
