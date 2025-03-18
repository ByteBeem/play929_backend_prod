const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Authentication = sequelize.define('two_factor_auth', {
    auth_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    secret: {
        type: DataTypes.STRING(64), 
        allowNull: false,
        unique: true,
    },
    email_address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true, 
        },
        unique: true,
    },
}, {
    timestamps: true, 
    paranoid: true,
    tableName: 'two_factor_auth', 
});

module.exports = Authentication;