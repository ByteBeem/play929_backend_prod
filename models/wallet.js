const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User"); 

const Wallet = sequelize.define("Wallet", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users', 
      key: 'id'
    },
    onDelete: 'CASCADE',
  },
  wallet_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'R', 
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'closed'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',

  hooks: {
    async beforeSave(wallet) { 
      if (!wallet.currency) {
        const user = await User.findByPk(wallet.user_id);
        wallet.currency = user && user.country === 'South Africa' ? 'R' : '$';
      }
    },
  },
  indexes: [
    { fields: ["user_id"] },  
    { fields: ["wallet_address"], unique: true }, 
  ],
  tableName: "wallets",
});

module.exports = Wallet;
