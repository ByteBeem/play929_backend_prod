require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/db");
const http = require('http');
const { initWebSocketServer } = require('./websockets/wsServer'); 

const PORT = process.env.PORT || 8080;


const server = http.createServer(app);


initWebSocketServer(server);


sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});
