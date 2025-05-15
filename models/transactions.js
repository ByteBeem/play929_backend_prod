const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  wallet_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'wallets', 
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  transaction_type: {
    type:DataTypes.STRING(255),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  transaction_ref: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'pending',
  },
  wallet_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  indexes: [
    { fields: ["wallet_id"] }, 
    { fields: ["transaction_ref"], unique: true }, 
  ],
  tableName: "transactions",
});

module.exports = Transaction;
