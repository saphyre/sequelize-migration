var path = require('path'),
    chai = require('chai'),
    SequelizeMigration = require('../lib/migration'),
    sequelize = require('./db.mock'),
    migration = new SequelizeMigration(sequelize),
    expect = chai.expect,
    Table_1_0_0,
    Table_1_0_1,
    Table_1_1_0,
    ScriptExecution,
    Promise = sequelize.Promise;

describe('Sequelize Migration', function () {

    before(function () {
        Table_1_0_0 = sequelize.import(path.join(__dirname, 'models', 'table.1.0.0'));
        Table_1_0_1 = sequelize.import(path.join(__dirname, 'models', 'table.1.0.1'));
        Table_1_1_0 = sequelize.import(path.join(__dirname, 'models', 'table.1.1.0'));
        ScriptExecution = migration.ScriptExecution;
    });

    beforeEach(function () {
        return Promise.all([
            sequelize.query('drop table if exists table_1_0_0'),
            sequelize.query('drop table if exists table_1_0_1'),
            sequelize.query('drop table if exists table_1_1_0'),
            sequelize.query('drop table if exists sph_script_execution')
        ]);
    });

    it('should create schema', function () {
        var moduleDescriptor = require('./module/descriptor.json');
        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');

        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Table_1_0_0.findAll());
    });

    it('should create schema and script_execution', function () {
        var moduleDescriptor = require('./module/descriptor.json');
        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');

        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Table_1_0_0.findAll())
            .then(() => ScriptExecution.findAll())
            .then(result => {
                expect(result).with.length(1);
                expect(result[0]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[0]).to.have.property('execution_ts');
                expect(result[0]).to.have.property('script_name').equal('upgrade_1_0_0.sql');
                expect(result[0]).to.have.property('major').equal(1);
                expect(result[0]).to.have.property('minor').equal(0);
                expect(result[0]).to.have.property('patch').equal(0);
        });
    });

    it('should create schema with multiple scripts', function () {
        var moduleDescriptor = require('./module/descriptor.json');
        moduleDescriptor.version = '1.0.1';
        moduleDescriptor.dir = path.join(__dirname, 'module');

        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Table_1_0_0.findAll())
            .then(() => Table_1_0_1.findAll());
    });

    it('shouldn`t create schema more than once', function () {
        var moduleDescriptor = require('./module/descriptor.json');
        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');

        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => migration.sync());
    });

    it('should extract version parameters', function () {
        var version;

        version = migration.extractVersionParameters('1.0.0');

        expect(version).to.have.property('major').equal('1');
        expect(version).to.have.property('minor').equal('0');
        expect(version).to.have.property('patch').equal('0');

        version = migration.extractVersionParameters('1.2.3-RC1');

        expect(version).to.have.property('major').equal('1');
        expect(version).to.have.property('minor').equal('2');
        expect(version).to.have.property('patch').equal('3');

        version = migration.extractVersionParameters('4.2');

        expect(version).to.have.property('major').equal('4');
        expect(version).to.have.property('minor').equal('2');
        expect(version).to.have.property('patch').equal('0');

        version = migration.extractVersionParameters('10.1-RC2');

        expect(version).to.have.property('major').equal('10');
        expect(version).to.have.property('minor').equal('1');
        expect(version).to.have.property('patch').equal('0');
    });

    it('should update schema', function () {
        var moduleDescriptor = require('./module/descriptor.json');

        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');
        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Table_1_0_0.findAll())
            .then(() => {
                // table 1.0.1 must not exist yet
                return Table_1_0_1.findAll().then(() => {
                    throw new Error('table_1_0_1 should`t exist')
                }).catch(err => {
                    if (err.message == 'table_1_0_1 should`t exist') throw err;
                    moduleDescriptor.version = '1.0.1';
                    return migration.sync();
                });
            }).then(() => Table_1_0_1.findAll())
            .then(function () {
                // table 1.1.0 must not exist yet
                return Table_1_1_0.findAll().then(() => {
                    throw Error('table_1_1_0 should`t exist')
                }).catch(err => {
                    if (err.message == 'table_1_1_0 should`t exist') throw err;
                    moduleDescriptor.version = '1.1.0';
                    return migration.sync();
                });
            }).then(() => Table_1_1_0.findAll());
    });

    it('should update schema with two versions diff', function () {
        var moduleDescriptor = require('./module/descriptor.json');
        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');

        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Table_1_0_0.findAll())
            .then(() => {
                return Table_1_0_1.findAll().then(() => {
                    throw new Error('table_1_0_1 should`t exist');
                }).catch(err => {
                    if (err.message == 'table_1_0_1 should`t exist') throw err;
                    moduleDescriptor.version = '1.1.0';
                    return migration.sync();
                })
            }).then(() => Promise.all([
                Table_1_0_1.findAll(),
                Table_1_1_0.findAll()
            ])).then(() => ScriptExecution.findAll())
            .then(result => {
                expect(result).with.length(3);
                expect(result[0]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[0]).to.have.property('execution_ts');
                expect(result[0]).to.have.property('script_name').equal('upgrade_1_0_0.sql');
                expect(result[0]).to.have.property('major').equal(1);
                expect(result[0]).to.have.property('minor').equal(0);
                expect(result[0]).to.have.property('patch').equal(0);

                expect(result[1]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[1]).to.have.property('execution_ts');
                expect(result[1]).to.have.property('script_name').equal('upgrade_1_0_1.sql');
                expect(result[1]).to.have.property('major').equal(1);
                expect(result[1]).to.have.property('minor').equal(0);
                expect(result[1]).to.have.property('patch').equal(1);

                expect(result[2]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[2]).to.have.property('execution_ts');
                expect(result[2]).to.have.property('script_name').equal('upgrade_1_1_0.sql');
                expect(result[2]).to.have.property('major').equal(1);
                expect(result[2]).to.have.property('minor').equal(1);
                expect(result[2]).to.have.property('patch').equal(0);
            });
    });

    it('should get version ignoring RC characters', function () {
        var moduleDescriptor = require('./module/descriptor.json'),
            version;

        moduleDescriptor.version = '1.0.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');
        version = migration.getVersion(moduleDescriptor, '1.0.0-RC5');

        expect(version).to.have.property('version').equal('1.0.0');
    });

    it('should create schema with multiple commands in a single script', function () {
        var moduleDescriptor = require('./module/descriptor.json');

        moduleDescriptor.version = '1.1.0';
        moduleDescriptor.dir = path.join(__dirname, 'module');
        migration.addModule(moduleDescriptor);

        return migration.sync()
            .then(() => Promise.all([
                Table_1_0_0.findAll(),
                Table_1_0_1.findAll(),
                Table_1_1_0.findAll()
            ])).then(() => ScriptExecution.findAll())
            .then(result => {
                expect(result).with.length(3);
                expect(result[0]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[0]).to.have.property('execution_ts');
                expect(result[0]).to.have.property('script_name').equal('upgrade_1_0_0.sql');
                expect(result[0]).to.have.property('major').equal(1);
                expect(result[0]).to.have.property('minor').equal(0);
                expect(result[0]).to.have.property('patch').equal(0);

                expect(result[1]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[1]).to.have.property('execution_ts');
                expect(result[1]).to.have.property('script_name').equal('upgrade_1_0_1.sql');
                expect(result[1]).to.have.property('major').equal(1);
                expect(result[1]).to.have.property('minor').equal(0);
                expect(result[1]).to.have.property('patch').equal(1);

                expect(result[2]).to.have.property('module').equal('sequelize.migration.test');
                expect(result[2]).to.have.property('execution_ts');
                expect(result[2]).to.have.property('script_name').equal('upgrade_1_1_0.sql');
                expect(result[2]).to.have.property('major').equal(1);
                expect(result[2]).to.have.property('minor').equal(1);
                expect(result[2]).to.have.property('patch').equal(0);
            });
    });

});