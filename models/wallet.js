const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User"); // Assuming you have a User model

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
      model: 'Users', // Reference to the Users model
      key: 'id'
    },
    onDelete: 'CASCADE', // If user is deleted, wallet will be deleted as well
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
    defaultValue: 'USD', // Default currency
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
    // Hook to set currency based on user's country before creating the wallet
    async beforeCreate(wallet, options) {
      const user = await User.findByPk(wallet.user_id); // Fetch user by user_id
      if (user && user.country === 'South Africa') {
        wallet.currency = 'R'; // Set currency to 'R' (ZAR)
      } else {
        wallet.currency = '$'; // Default currency to USD if not South Africa
      }
    },

    // Hook to set currency when updating the wallet
    async beforeUpdate(wallet, options) {
      const user = await User.findByPk(wallet.user_id); // Fetch user by user_id
      if (user && user.country === 'South Africa') {
        wallet.currency = 'R'; // Set currency to 'R' (ZAR)
      } else {
        wallet.currency = '$'; // Default currency to USD if not South Africa
      }
    },
  },
});

module.exports = Wallet;
