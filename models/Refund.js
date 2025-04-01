const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Transaction = require("./transactions"); 

const Refund = sequelize.define("Refund", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "transactions", 
      key: "id",
    },
    onDelete: "CASCADE",
    unique: true,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2), 
    allowNull: false,
  },
  email_address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
}, {
  timestamps: true,
  updatedAt: "updated_at",
  createdAt: "created_at",
  indexes: [
    { fields: ["payment_id"], unique: true }, 
    { fields: ["email_address"] }, 
  ],
});

module.exports = Refund;
