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

    // Drop all tables and their related constraints (cascade)
    await sequelize.drop();
    console.log("🧹 All tables dropped");

    // Recreate based on the current models
    await sequelize.sync({ force: true });
    console.log("🔁 Database synced with models (force: true)");
  } catch (err) {
    console.error("❌ Error syncing database:", err);
  }
})();

module.exports = sequelize;
