const {  DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BuggyCodeCpp = sequelize.define("BuggyCodeCpp", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    buggy_code: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    output: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "buggy_codes_cpp",
    timestamps: false
});

module.exports = BuggyCodeCpp;
