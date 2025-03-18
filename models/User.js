const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    walletAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    profileImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isTwoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    referredBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: "Users", 
            key: "id",
        },
        onDelete: "SET NULL", 
    },
}, { 
    timestamps: true, 
});

module.exports = User;
