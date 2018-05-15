'use strict';

var io = require('socket.io')();
var os = require('os');
var moment = require('moment');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');

io.on('connection', (client) => {
  client.on('runFunction', (functionName, args) => {
    ledController[functionName](...args);
  });
  client.on('restart', () => {
    
  });
  client.on('oscSend', (address, value) => {
    osc.send(address, [
      {
        type: "s",
        value: value
      }
    ]);
  });
});

const port = 4001;
io.listen(port);

const getIp = () => {
  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  };

  return addresses[0];
};

let state = {
  activeLayers: {},
  lastMidi: {},
  lastOsc: {},
  localIp: getIp(),
  neighbours: []
};

const directionMap = {
  n: {
    cmd: 'rotatePuffVertically',
    args: ['0']
  },
  s: {
    cmd: 'rotatePuffVertically',
    args: ['0', 1]
  },
  e: {
    cmd: 'rotatePuffHorizontally',
    args: ['0', 1]
  },
  w: {
    cmd: 'rotatePuffHorizontally',
    args: ['0']
  },
  nw: {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 1]
  },
  ne: {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 2]
  },
  sw: {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 3]
  },
  se: {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 4]
  }
};

midi.listen((note, value) => {
  state.lastMidi = {note, value};
});

osc.listen((message, info) => {
  state.lastOsc = {message, info};

  const messageArray = message.address.split("/");

  const item = messageArray[1]
  const ip = messageArray[2];

  if (state.localIp != ip || item != 'puff') {
    return;
  }

  const department = messageArray[3] // Lights or ping
  const layer = messageArray[4]; // Layer number, alloff or allon
  const direction = messageArray[5]; // n, s, e, w, ne, nw, se or sw
  const func = messageArray[6]; // start, stop, speed, color, preOffset or postOffset
  const value = (message && message.args[0] && message.args[0].value); // 200, [255, 255, 255, 255]

  if (department == 'ping') {

    const position = state.neighbours.map((neighbour) => { 
      return neighbour.ip; 
    }).indexOf(ip);
    
    if (position == -1) {
      state.neighbours.push({
        ip: ip,
        lastSeen: value
      });
    } else {
      state.neighbours[position].lastSeen = moment().valueOf();
    };
  };

  const layerIsActive = state.activeLayers[layer];

  if (!layerIsActive) {
    state.activeLayers[layer] = {
      speed: 500,
      running: false,
      color: [20,20,20,20],
      preOffset: 0,
      postOffset: 0,
      timer: null
    };
  };

  if (directionMap[direction]) {
    const command = directionMap[direction].cmd;
    const args = directionMap[direction].args;

    if (command && args) {

      // Create new instance
      const animationFunc = ledController[command](...args);

      const runOnce = () => {
        animationFunc();
        state.activeLayers[layer].timer = setTimeout(runOnce, state.activeLayers[layer].speed);
      }

      runOnce();

    };
  }
});


setInterval(() => {
  state.localIp = getIp();
  const now = moment().valueOf();

  // Send alive ping to network
  osc.send(`/puff/${state.localIp}/ping`, [
    {
      type: "s",
      value: now
    }
  ]);

  // Send state to clients
  io.sockets.emit('FromAPI', state);

  // Remove dead neighbours
  state.neighbours.map((neighbour, i) => {
    const lastSeen = Number(neighbour.lastSeen);
    if (moment(lastSeen).isBefore(moment().subtract(2, 'seconds'))) {
      state.neighbours.splice(i, 1);
    };
  });

}, 1000);
