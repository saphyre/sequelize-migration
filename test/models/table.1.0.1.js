module.exports = function (sequelize, DataTypes) {

    var Table_1_0_1 = sequelize.define('Table_1_0_1', {

        id : {
            type : DataTypes.BIGINT,
            primaryKey : true,
            autoIncrement : true
        },

        name : DataTypes.STRING

    }, {
        timestamps : false,
        paranoid : false,
        tableName : 'table_1_0_1'
    });

    return Table_1_0_1;

};