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
            model: "users", 
            key: "id",
        },
        onDelete: "SET NULL", 
    },
}, { 
    timestamps: true,
    indexes: [
        { fields: ["email"], unique: true },  
        { fields: ["accountNumber"], unique: true }, 
        { fields: ["walletAddress"], unique: true },
        { fields: ["country"] }, 
        { fields: ["role"] }, 
    ],
    tableName: "users",
});



  User.associate = function(models) {
    User.hasOne(models.TwoFactorAuth, {
      foreignKey: 'user_id',
      as: 'authentication'
    });
  
    User.hasOne(models.Wallet, {
      foreignKey: 'user_id',
      as: 'wallet',
    });
  };
  

module.exports = User;
