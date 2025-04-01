const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User"); 

const Authentication = sequelize.define("TwoFactorAuth", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: { 
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "users",
      key: "id",
    },
    onDelete: "CASCADE",
    unique: true, 
  },
  secret: {
    type: DataTypes.TEXT, 
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,
  paranoid: true, 
  tableName: "two_factor_auth",
  indexes: [
    { fields: ["user_id"], unique: true }, 
  ],
  tableName: "TwoFactorAuth",
});

module.exports = Authentication;
