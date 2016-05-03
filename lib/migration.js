var path = require('path'),
    _ = require('lodash'),
    fs = require('fs');

module.exports = function SequelizeMigration(sequelize) {
    var ScriptExecution = sequelize.import(path.join(__dirname, 'models', 'script.execution')),
        dialectName = sequelize.dialect.name,
        Promise = sequelize.Promise,
        modules = [];

    this.ScriptExecution = ScriptExecution;

    this.addModule = addModule;
    this.sync = sync;
    this.extractVersionParameters = extractVersionParameters;
    this.getVersion = getVersion;

    /**
     *
     * Creates a new Migration module
     *
     * @param {Object} options
     * @param {String} options.module                          The module name
     * @param {String} options.dir                             The deployment directory
     * @param {String} options.version                         The module version
     *
     * @param {Object} options.dialects                        Dialects supported by this module
     * @param {Array}  options.dialects.mysql                  MySQL Dialect
     * @param {Array}  options.dialects.posgres                Postgrees Dialect
     */
    function addModule(options) {
        var prev;

        modules.push(options);

        if (options.dialects) {
            prev = null;

            _.forEach(options.dialects, dialect => {
                prev = null;

                _.forEach(dialect, version => {
                    version.versionParameters = extractVersionParameters(version.version);
                    if (prev) {
                        version.previous = prev;
                        prev.next = version;
                    }
                    prev = version;
                });
                dialect.sort(compareVersions);
            });
        }
    };

    /**
     * Syncs the database
     */
     function sync() {
        return ScriptExecution.sync({ force : false }).then(() => {
            var promise = Promise.resolve();
            _.forEach(modules, dbModule => {
                promise = promise.then(() => syncModule(dbModule));
            });
            return promise;
        });
    };

    function getVersion(moduleDescriptor, version) {
        var dialect = moduleDescriptor.dialects[dialectName],
            result = null,
            regexp = new RegExp('([\\d]+?(.[\\d]+)(.[\\d]+))'),
            exec = regexp.exec(version);

        version = exec.length > 0 ? exec[0] : version;

        if (dialect == null) {
            throw new Error(`Dialect '${dialectName}' not found on '${moduleDescriptor.module}`);
        }

        _.forEach(dialect, dialectVersion => {
            result = dialectVersion;
            if (dialectVersion.version == version) {
                result = dialectVersion;
                return false;
            }
        });

        return result;
    };

    function getFirstVersion(moduleDescriptor) {
        var dialect = moduleDescriptor.dialects[dialectName];
        if (dialect == null || dialect.length == 0) {
            throw new Error(`Dialect '${dialectName}' not found on '${moduleDescriptor.module}'`);
        }
        return dialect[0];
    };

    function getNextVersion(moduleDescriptor, version) {
        return getVersion(moduleDescriptor, version).next;
    };

    function extractVersionParameters(version) {
        var versions,
            versionParameters = {},
            regexp = new RegExp('(\\d*)');

        versions = version.split('.');

        versionParameters.major = versions.length > 0 ? regexp.exec(versions[0])[0] : '0';
        versionParameters.minor = versions.length > 1 ? regexp.exec(versions[1])[0] : '0';
        versionParameters.patch = versions.length > 2 ? regexp.exec(versions[2])[0] : '0';

        return versionParameters;
    };

    function syncModule(moduleDescriptor) {
        var versionParameters = extractVersionParameters(moduleDescriptor.version),
            promise,
            currentVersion,
            versionOptions;

        return ScriptExecution.findAll({
            where : { module : moduleDescriptor.module },
            order : [
                ['major', 'DESC'],
                ['minor', 'DESC'],
                ['patch', 'DESC']
            ],
            limit : 1
        }).then(execution => {
            execution = execution.length > 0 ? execution[0] : null;

            if (execution) {
                // Já houve execução de script para este módulo, precisamos trazer a próxima versão
                versionOptions = getNextVersion(moduleDescriptor, `${execution.major}.${execution.minor}.${execution.patch}`);
            } else {
                // Não teve nenhuma execução de script para este módulo, então, devemos trazer a primeira versão
                versionOptions = getFirstVersion(moduleDescriptor);
            }

            currentVersion = { versionParameters : versionParameters };
            promise = Promise.resolve();

            while (versionOptions && compareVersions(currentVersion, versionOptions) >= 0) {
                _.forEach(versionOptions.upgrade, upgrade => {
                    var innerVersionParameters = versionOptions.versionParameters;
                    promise = promise.then(() => {
                        var content = fs.readFileSync(path.join(moduleDescriptor.dir, dialectName, upgrade), 'utf8');
                        return sequelize.query(content);
                    }).then(() => {
                        return ScriptExecution.create({
                            module : moduleDescriptor.module,
                            execution_ts : new Date(),
                            script_name : upgrade,
                            major : innerVersionParameters.major,
                            minor : innerVersionParameters.minor,
                            patch : innerVersionParameters.patch
                        });
                    });
                });

                versionOptions = versionOptions.next;
            }

            return promise;
        });
    };

    function compareVersions(v1, v2) {
        var result = v1.versionParameters.major - v2.versionParameters.major;
        if (result == 0) {
            result = v1.versionParameters.minor - v2.versionParameters.minor;
            if (result == 0) {
                result = v1.versionParameters.patch - v2.versionParameters.patch;
            }
        }
        return result;
    };
};