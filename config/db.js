const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected using SSL");
    return sequelize.sync({ force: true }); 
  })
  .then(() => {
    console.log("💥 Database dropped and re-synced to match models");
  })
  .catch((err) => {
    console.error("❌ Database connection or sync error:", err);
  });

module.exports = sequelize;
