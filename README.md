# Sequelize Migration

[![Build Status](https://travis-ci.org/saphyre/sequelize-migration.svg?branch=master)](https://travis-ci.org/saphyre/sequelize-migration) [![Coverage Status](https://coveralls.io/repos/github/saphyre/sequelize-migration/badge.svg?branch=master)](https://coveralls.io/github/saphyre/sequelize-migration?branch=master) [![npm version](https://badge.fury.io/js/sequelize-migration.svg)](https://badge.fury.io/js/sequelize-migration)

Module to Handle Migration with SQL scripts

## Supported Dialects
Currently SaphyreData is supporting only MySQL and PostgreSQL. Other databases may work, but it wasn't tested.

## Install
`npm install sequelize-migration --save`

### To use the module

    // you must first create the sequelize instance
    // sequelize == my sequelize instance
    
    // import the sequelize migration and create a new instance with the sequelize instance
    var SequelizeMigration = require('sequelize-migration'),
        migration = new SequelizeMigration(sequelize);
        
    // then add the module
    var packagejson = require('../package.json'); // path to your package.json module file
    migration.addModule({
        module: 'my-module-name', // or package.name 
        version: packagejson.version,
        dir: 'path/to/my/scripts/directory',
        dialects: {
            mysql: [
                {
                    version: '1.0.0',
                    upgrade: [ 'upgrade_1_0_0.sql' ]
                },
                {
                    version: '1.0.1',
                    upgrade: [ 'upgrade_1_0_1.sql' ]
                }
            ],
            postgres: [
                {
                    version: '1.0.0',
                    upgrade: [ 'upgrade_1_0_0.sql' ]
                },
                {
                    version: '1.0.1',
                    upgrade: [ 'upgrade_1_0_1.sql' ]
                }
            ]
          }
    });
    // your script directory must have one folder for each configured dialect
    // scripts/
    //   └─ mysql/
    //   └─ postgres/
    
    // now all you have to do is
    migration.sync().then(() => { // returns a Promise (Sequelize.Promise)
        console.log('hell yeah!');
    }); 
    
## Notice
* The module name is very important because it may have conflict with other modules, ensure you have a unique module name identifier.
* One table will be created into your database called `sph_script_execution`
* Your script directory must have one folder for each configured dialect. E.g

```
scripts/
  └─ mysql/
  └─ postgres/
```

## Contibuting
All you have to do is execute only two commands, thank you!

```
$ npm install
$ npm test
```

## Upcoming Features
* Downgrade