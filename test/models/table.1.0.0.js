module.exports = function (sequelize, DataTypes) {

    var Table_1_0_0 = sequelize.define('Table_1_0_0', {

        id : {
            type : DataTypes.BIGINT,
            primaryKey : true,
            autoIncrement : true
        },

        name : DataTypes.STRING

    }, {
        timestamps : false,
        paranoid : false,
        tableName : 'table_1_0_0'
    });

    return Table_1_0_0;

};