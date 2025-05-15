const db = {};

db.User = require('./User');
db.Wallet = require('./wallet');
db.TwoFactorAuth = require('./2FAuthentication');
db.Refund = require('./Refund');
db.GamePlayed = require('./gamesPlayed');
db.SecurityLogs = require('./securityLogs');
db.Transaction = require('./transactions');

// Setup associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
