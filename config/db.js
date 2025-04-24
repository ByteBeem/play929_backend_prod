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

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected using SSL");

    // 🚨 Nuke everything
    await sequelize.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    console.log("💣 Dropped and recreated public schema");

    await sequelize.sync({ force: true });
    console.log("🔁 Database synced with models (force: true)");
  } catch (err) {
    console.error("❌ Error syncing database:", err);
  }
})();

module.exports = sequelize;
