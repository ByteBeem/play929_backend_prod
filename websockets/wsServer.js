const WebSocket = require('ws');

let clients = [];

const initWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('A new WebSocket connection established.');
    clients.push(ws);

    // Handle incoming messages from the WebSocket client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'StartGame':
            handleStartGame(ws, data);
            break;

          case 'ValidateUserCode':
            handleValidateUserCode(ws, data);
            break;

          case 'CountdownTimer':
            handleCountdownTimer(ws, data);
            break;

          case 'Error':
            console.error(`Received error message: ${data.message}`);
            break;

          default:
            console.log(`Unknown message type: ${data.type}`);
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Handle WebSocket connection closure
    ws.on('close', () => {
      console.log('WebSocket connection closed.');
      clients = clients.filter(client => client !== ws);
    });
  });
};


const handleStartGame = (ws, data) => {
  console.log('Starting game with data:', data);

  const countdownTime = 30; 

  let timeLeft = countdownTime;

  // Send the countdown timer every second to only the specific client (ws)
  const countdownInterval = setInterval(() => {
    // Send the countdown timer to this specific client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'CountdownTimer',
        time: timeLeft,
      }));
    }

    timeLeft -= 1;

    // If countdown reaches 0, stop the interval and send "CountdownFinished" to this client
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'CountdownFinished',
          message: 'Countdown finished!',
        }));
      }
    }
  }, 1000); // Update every second
};

// Handle the "ValidateUserCode" message
const handleValidateUserCode = (ws, data) => {
  console.log('Validating user code:', data.userCode);

  // Add your validation logic here
  const isValid = data.userCode === 'validCode'; // Replace with actual validation logic

  if (isValid) {
    ws.send(JSON.stringify({
      type: 'ValidationLog',
      message: 'User code validated successfully!',
      status: 'success',
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'ValidationLog',
      message: 'Invalid user code.',
      status: 'error',
    }));
  }
};

// Handle the "CountdownTimer" message
const handleCountdownTimer = (ws, data) => {
  console.log('Received countdown timer data:', data);
  // Handle any additional countdown logic if necessary
};


module.exports = { initWebSocketServer };
