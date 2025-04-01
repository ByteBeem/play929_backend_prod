const WebSocket = require("ws");
const gamesPlayed = require("../models/gamesPlayed");
const sequelize = require("../config/db");
const Transactions = require("../models/transactions");

let clients = [];

const initWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection established.");
    clients.push(ws);

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "StartGame":
            await handleStartGame(ws, data);
            break;

          case "CountdownTimer":
            handleCountdownTimer(ws, data);
            break;

          case "Error":
            console.error(`Received error message: ${data.message}`);
            break;

          default:
            console.log(`Unknown message type: ${data.type}`);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON format" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed.");
      clients = clients.filter((client) => client !== ws);
    });
  });
};

const handleStartGame = async (ws, data) => {
  console.log("Starting game with data:", data);

  if (!data.gameSessionID) {
    ws.send(JSON.stringify({ type: "error", message: "GameSessionID is required." }));
    return ws.close();
  }

  // Begin transaction
  const t = await sequelize.transaction();
  let gameData;

  try {
    gameData = await gamesPlayed.findOne({ where: { gameId: data.gameSessionID }, transaction: t });

    if (!gameData) {
      ws.send(JSON.stringify({ type: "error", message: "Game session not found." }));
      await t.rollback();
      return ws.close();
    }

    let timeLeft = parseFloat(gameData.duration);
    let gameActive = true;

    // Start countdown timer
    const countdownInterval = setInterval(async () => {
      if (!gameActive || ws.readyState !== WebSocket.OPEN) {
        clearInterval(countdownInterval);
        return;
      }

      ws.send(JSON.stringify({ type: "CountdownTimer", time: timeLeft }));
      timeLeft -= 1;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        gameActive = false;

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CountdownFinished", message: "Countdown finished!" }));
        }

        try {
          gameData.outcome = "time up";
          gameData.endedAt = new Date();
          await gameData.save({ transaction: t });

          let transaction = await Transactions.findOne({
            where: { transaction_ref: gameData.transactionRef },
            transaction: t,
          });

          if (transaction) {
            transaction.status = "completed";
            await transaction.save({ transaction: t });
          }

          await t.commit();
        } catch (dbError) {
          console.error("Error updating game outcome:", dbError);
          await t.rollback();
        }
      }
    }, 1000);

    // Cleanup if WebSocket disconnects before countdown finishes
    ws.on("close", async () => {
      if (!gameActive) return;
      
      clearInterval(countdownInterval);
      gameActive = false;

      try {
        gameData.outcome = "disconnected";
        gameData.endedAt = new Date();
        await gameData.save({ transaction: t });

        let transaction = await Transactions.findOne({
          where: { transaction_ref: gameData.transactionRef },
          transaction: t,
        });

        if (transaction) {
          transaction.status = "failed";
          await transaction.save({ transaction: t });
        }

        await t.commit();
      } catch (dbError) {
        console.error("Error updating game outcome on disconnect:", dbError);
        await t.rollback();
      }
    });

  } catch (error) {
    console.error("Error starting game session:", error);
    await t.rollback();
    ws.send(JSON.stringify({ type: "error", message: "Server error while starting game." }));
  }
};

const handleCountdownTimer = (ws, data) => {
  console.log("Received countdown timer data:", data);
};

module.exports = { initWebSocketServer };
