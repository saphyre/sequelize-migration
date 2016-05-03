module.exports = function (sequelize, DataTypes) {

    var ScriptExecution = sequelize.define('ScriptExecution', {

        execution_id : {
            type : DataTypes.BIGINT,
            primaryKey : true,
            autoIncrement : true
        },

        module : DataTypes.STRING,
        execution_ts : DataTypes.DATE,
        script_name : DataTypes.STRING,
        major : DataTypes.INTEGER,
        minor : DataTypes.INTEGER,
        patch : DataTypes.INTEGER

    }, {
        timestamps : false,
        paranoid : false,
        tableName : 'sph_script_execution'
    });

    return ScriptExecution;

};