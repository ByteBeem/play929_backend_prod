require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/db");
const fs = require("fs");
const http = require("http");
const https = require("https");
const { initWebSocketServer } = require("./websockets/wsServer");

const isProduction = process.env.NODE_ENV === "production";
const PORT = isProduction ? 443 : 5000;

let server;

if (isProduction) {
    const CERT_PATH = '/etc/letsencrypt/live/play929.com/fullchain.pem';
    const KEY_PATH = '/etc/letsencrypt/live/play929.com/privkey.pem';

    const options = {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
    };

    server = https.createServer(options, app);
} else {
    server = http.createServer(app);
}

initWebSocketServer(server);

sequelize.sync().then(() => {
    server.listen(PORT, () => {
        const protocol = isProduction ? "https" : "http";
        console.log(`🚀 Server running on ${protocol}://localhost:${PORT}`);
    });
});
