'use strict';

var io = require('socket.io')();
var os = require('os');
var moment = require('moment');
var shell = require('shelljs');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');
// var gitPullOrClone = require('git-pull-or-clone')

// const hostName = os.hostname();

// console.log(hostName);

const update = () => {
  shell.exec('cd /home/pi/puff-node && git fetch --all && npm install && cd /home/pi/puff-client && git fetch --all');
};

setTimeout(() => {
  midi.noteSend(0, 127, 1);
}, 8000);

io.on('connection', (client) => {
  client.on('runFunction', (functionName, args) => {
    ledController[functionName](...args);
  });
  client.on('restart', () => {
    shell.exec('sudo reboot');
  });
  client.on('update', () => {
    update();
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
  neighbours: [],
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

// Waiting since not waiting would cause crashes from time to time
setTimeout(() => {
  midi.noteListen((note, value) => {
    // Piezo
    if (note == 0 || note == 1 || note == 2 || note == 3) {
      osc.send(`/puff/${state.localIp}/piezo/${note}`, [
        {
          type: "f",
          value: value
        }
      ]);
    };
  });

  midi.ccListen((controller, value) => {
    // Compass
    if (controller == 1) {
      osc.send(`/puff/${state.localIp}/orientation`, [
        {
          type: "f",
          value: value * 360
        }
      ]);
    };
  });
}, 8000);

osc.listen((message, info) => {
  state.lastOsc = {message, info};

  const messageArray = message.address.split("/");

  const item = messageArray[1]
  const ip = messageArray[2];

  const department = messageArray[3] // lights, cableLight, ping, update, orientation or piezo
  const layer = messageArray[4]; // Layer number, allOff or allOn
  const direction = messageArray[5]; // n, s, e, w, ne, nw, se or sw
  const func = messageArray[6]; // start, stop, speed, color, preOffset or postOffset
  const value = (message && message.args[0] && message.args[0].value); // 200, [255, 255, 255, 255]

  const validIncommingDepartments = ['lights', 'ping', 'update', 'cableLight'];

  if (validIncommingDepartments.indexOf(department) == -1) {
    return;
  }

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
    return;
  };

  // Break if message isn't intended for current server
  if (state.localIp != ip || item != 'puff') {
    return;
  };

  if (department == 'cableLight') {
    let velocity = Math.round(127 * value);
    if (velocity < 0) {
      velocity = 0;
    } else if (velocity > 127) {
      velocity = 127;
    };
    midi.noteSend(0, velocity, 1);
    return;
  };

  if (department == 'update') {
    update();
    return;
  };

  if (layer == 'allOn') {
    // TODO: start does not work after this when going south or north
    Object.keys(state.activeLayers).map((key) => {
      clearTimeout(state.activeLayers[key].timer);
      state.activeLayers[key].running = false;
    });
    ledController.allOn("0");
    return;
  };

  if (layer == 'allOff') {
    // TODO: start does not work after this when going south or north
    Object.keys(state.activeLayers).map((key) => {
      clearTimeout(state.activeLayers[key].timer);
      state.activeLayers[key].running = false;
    });
    ledController.allOff("0");
    return;
  };

  if (layer == 'clearAll') {
    Object.keys(state.activeLayers).map((key) => {
      clearTimeout(state.activeLayers[key].timer);
      state.activeLayers[key].running = false;
    });
    state.activeLayers = {};
    ledController.allOff("0");
    return;
  };

  const validLayer = Number.isInteger(parseInt(layer));

  if (!validLayer) {
    console.log('Not a valid layer');
    return;
  };

  const layerIsActive = state.activeLayers[layer];

  if (!layerIsActive) {
    state.activeLayers[layer] = {
      speed: 500,
      running: false,
      color: [20,20,20,20],
      preOffset: 0,
      postOffset: 0,
      timer: null,
      func: null
    };

    if (directionMap[direction]) {
      const command = directionMap[direction].cmd;
      let args = directionMap[direction].args;

      if (command && args) {
        // Create new instance
        state.activeLayers[layer].func = ledController[command](...args);
      }  else {
        console.log('Unknown direction');
      }

    }
  };

  switch (func) {
    case 'start':
      if (state.activeLayers[layer].running) {
        console.log(`Layer ${layer} is already running`);
      } else {
        const runOnce = () => {
          state.activeLayers[layer].func.output();
          state.activeLayers[layer].timer = setTimeout(runOnce, state.activeLayers[layer].speed);
        }
        runOnce();
        state.activeLayers[layer].running = true;
      };
      break;
    case 'stop':
      if (!state.activeLayers[layer].running) {
        console.log(`Layer ${layer} is not running`);
      } else {
        clearTimeout(state.activeLayers[layer].timer);
        state.activeLayers[layer].running = false;
      }
      break;
    case 'speed':
      state.activeLayers[layer].speed = value;
      break;
    case 'color':
      let valueList = value;
      for(var i = 0; i < valueList.length; i++) {
       valueList = valueList.replace(" ", ",");
      };
      const color = JSON.parse("[" + valueList + "]");
      state.activeLayers[layer].color = color;
      state.activeLayers[layer].func.changeColor(color);
      break;
    case 'preOffset':
      break;
    case 'postOffset':
      break;
    default:
      console.log('Unknown command');
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

  // Remove dead neighbours
  state.neighbours.map((neighbour, i) => {
    const lastSeen = Number(neighbour.lastSeen);
    if (moment(lastSeen).isBefore(moment().subtract(2, 'seconds'))) {
      state.neighbours.splice(i, 1);
    };
  }); 

  // Send state to clients
  io.sockets.emit('FromAPI', state.neighbours);

}, 1000);
