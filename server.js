require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/db");
const fs = require("fs");
const http = require("http");
const { initWebSocketServer } = require("./websockets/wsServer");

const PORT =  5000;

// Create the server instance
let server = http.createServer(app);

// Initialize the WebSocket server
initWebSocketServer(server);

// Sync database and start the server
sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
