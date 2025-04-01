const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SecurityLogs = sequelize.define('security_logs', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "Unique identifier for each log entry"
    },
    action: {
        type: DataTypes.STRING(64),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 64] 
        },
        comment: "Type of action performed (e.g., login, logout)"
    },
    email_address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true, 
        },
        unique: false,
    },
    browser: {
        type: DataTypes.STRING(64),
        allowNull: false,
        validate: {
            notEmpty: true
        },
        comment: "Browser name or user agent details"
    },
    ip_address: { 
        type: DataTypes.STRING(45), 
        allowNull: true,
        validate: {
            isIP: true 
        },
        comment: "IP address of the user performing the action"
    }
}, {
    timestamps: true, 
    paranoid: true,
    tableName: 'security_logs', 
    underscored: true, 
    comment: "Logs for security-related actions",
    tableName: "security_logs",
});

module.exports = SecurityLogs;
