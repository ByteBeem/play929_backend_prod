const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require('path');
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");

const app = express();

app.use(
  cors({
    origin: ["https://my.play929.com", "https://dashboard.play929.com"  , "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   
    credentials: true,
  })
);

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/profile", userRoutes);
app.use("/api/wallet", walletRoutes);

app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  setHeaders: (res) => {
    res.set("Access-Control-Allow-Origin", "*"); 
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));


app.use((req, res) => res.status(404).json({ error: "Not Found" }));

module.exports = app;
