require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/db");
const https = require('https');
const fs = require('fs');
const { initWebSocketServer } = require('./websockets/wsServer');

// Define the paths to the SSL certificate files
const CERT_PATH = '/etc/letsencrypt/live/play929.com/fullchain.pem';
const KEY_PATH = '/etc/letsencrypt/live/play929.com/privkey.pem';

// Set the port to 443 for HTTPS
const PORT = 443;

const options = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
};

const server = https.createServer(options, app);

initWebSocketServer(server);

sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on https://play929.com:${PORT}`);
    });
});
