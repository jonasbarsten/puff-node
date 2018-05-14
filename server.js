'use strict';

var connect = require('connect');
var serveStatic = require('serve-static');
var os = require('os');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');

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
  localIp: getIp()
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
  console.log(note, value);
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

  const department = messageArray[3] // Lights
  const layer = messageArray[4]; // Layer number, alloff or allon
  const direction = messageArray[5]; // n, s, e, w, ne, nw, se or sw
  const func = messageArray[6]; // start, stop, speed, color, preOffset or postOffset
  const value = (message && message.args[0] && message.args[0].value); // 200, [255, 255, 255, 255]

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

// Send ping every second and check if IP has changed
setInterval(() => {
  state.localIp = getIp();
  const now = new Date();

  osc.send(`/puff/${state.localIp}/ping`, [
    {
      type: "s",
      value: now
    }
  ]);
}, 1000);

// bonjour.publish({ name: 'Puff 1', type: 'http', port: 9090 })

connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});
