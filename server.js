'use strict';

var io = require('socket.io')();
var os = require('os');
var moment = require('moment');
var shell = require('shelljs');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');

const update = () => {
  shell.exec('cd /home/pi/puff-node && git pull && npm install && cd /home/pi/puff-client && git pull && sudo reboot');
};

const oscError = (msg) => {
  osc.send(`/puff/${state.localIp}/error`, [
    {
      type: "s",
      value: msg
    }
  ]);
}

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
  client.on('updateAll', () => {

    osc.send('/puff/all/update');

    // state.neighbours.map((neighbour) => {
    //   osc.send(`/puff/${neighbour.ip}/update`);
    // });
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
  hostName: os.hostname(),
  neighbours: [],
};

const programMap = {
  'line-n': {
    cmd: 'rotatePuffVertically',
    args: ['0']
  },
  'line-s': {
    cmd: 'rotatePuffVertically',
    args: ['0', 1]
  },
  'line-e': {
    cmd: 'rotatePuffHorizontally',
    args: ['0', 1]
  },
  'line-w': {
    cmd: 'rotatePuffHorizontally',
    args: ['0']
  },
  'line-nw': {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 1]
  },
  'line-ne': {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 2]
  },
  'line-sw': {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 3]
  },
  'line-se': {
    cmd: 'rotatePuffDiagonally',
    args: ['0', 4]
  },
  'random': {
    cmd: 'random',
    args: ['0', 1]
  },
  'randomTwo': {
    cmd: 'random',
    args: ['0', 2]
  },
  'randomThree': {
    cmd: 'random',
    args: ['0', 3]
  },
  'allOn': {
    cmd: 'allOn',
    args: ['0']
  },
  'allOff': {
    cmd: 'allOff',
    args: ['0']
  }
};





setTimeout(() => {
  // Starting local reserved layers
  // osc.send(`/puff/${state.localIp}/lights/layer/100/master`);
  // osc.send(`/puff/${state.localIp}/lights/layer/101/master`);
  // osc.send(`/puff/${state.localIp}/lights/layer/102/master`);
  // osc.send(`/puff/${state.localIp}/lights/layer/103/master`);

  // Waiting since not waiting would cause crashes from time to time
  midi.noteListen((note, value) => {
    // Piezo
    if (note == 0 || note == 1 || note == 2 || note == 3) {
      osc.send(`/puff/${state.localIp}/piezo/${note}`, [
        {
          type: "f",
          value: value
        }
      ]);

      // Invoking local lights on piezo hit
      // osc.send(`/puff/${state.localIp}/lights/layer/${note + 100}/master`, [
      //   {
      //     type: "f",
      //     value: value
      //   }
      // ]);

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

  const item = messageArray[1] // puff
  const ip = messageArray[2]; // 10.0.128.142 ...
  const department = messageArray[3] // lights, cableLight, ping, update, orientation or piezo
  const lightsGroup = messageArray[4]; // layer or global
  const layerNumber = messageArray[5]; // 1, 2, 3, 4 ...
  const layerFunc = messageArray[6]; // start, stop, speed, color, program, piezo, magneticNorth, preOffset or postOffset
  let value = null;

  if (message && message.args[0]) {
    if (message.args.length > 1) {
      const valueArray = [];
      message.args.map((arg) => {
        valueArray.push(arg.value);
      });
      value = valueArray;
    } else {
      value = message.args[0].value;
    }
  };

  // const value = (message && message.args[0] && message.args[0].value); // 200, [255, 255, 255, 255]

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
    if (ip != 'all') {
      return;
    }
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

  if (lightsGroup == 'global') {
    if (value == 'clearAll') {
      Object.keys(state.activeLayers).map((key) => {
        clearTimeout(state.activeLayers[key].timer);
        state.activeLayers[key].running = false;
      });
      state.activeLayers = {};
      ledController.clearAll("0");
      return;
    };
  };

  if (lightsGroup == 'layer') {
    const validLayer = Number.isInteger(parseInt(layerNumber));
    if (!validLayer) {
      console.log('Not a valid layer');
      oscError('Not a valid layer number (ex. 2)');
      return;
    };

    const layerIsActive = state.activeLayers[layerNumber];

    // New layer
    if (!layerIsActive) {
      let newLayer = {
        speed: 500,
        running: false,
        color: [20, 20, 20, 20],
        preOffset: 0,
        postOffset: 0,
        piezo: false,
        magneticNorth: false,
        timer: null,
        func: null,
        program: 'line-s',
        master: 1
      };

      // TODO: validation on every case
      switch (layerFunc) {
        case 'start':
          newLayer.running = true;
          break;
        case 'stop':
          newLayer.running = false;
          break;
        case 'speed':
          newLayer.speed = value;
          break;
        case 'color':
          newLayer.color = value;
          break;
        case 'program':
          if (programMap[value]) {
            newLayer.program = value;
          };
          break;
        case 'piezo':
          // Converting string to bool
          const isPiezoTrue = (value == 'true');
          newLayer.piezo = isPiezoTrue;
          break;
        case 'magneticNorth':
          // Converting string to bool
          const isMagneticNorthTrue = (value == 'true');
          newLayer.magneticNorth = isMagneticNorthTrue;
          break;
        case 'preOffset':
          newLayer.preOffset = value;
          break;
        case 'postOffset':
          newLayer.postOffset = value;
          break;
        case 'master':
          newLayer.master = value;
          break;
        default:
          console.log('Unknown layer function');
          oscError('Unknown layer function')
          break;
      }

      // let command = programMap[newLayer.program].cmd;
      // let args = programMap[newLayer.program].args;

      state.activeLayers[layerNumber] = newLayer;
      createLayer(layerNumber);
      // // Create new instance
      // state.activeLayers[layerNumber].func = ledController[command](...args);

      // Starting layer with default values if initial command is "start"
      if (state.activeLayers[layerNumber].running) {
        startLayer(layerNumber, true);
        // const runOnce = () => {
        //   state.activeLayers[layerNumber].func.output();
        //   state.activeLayers[layerNumber].timer = setTimeout(runOnce, state.activeLayers[layerNumber].speed);
        // };
        // runOnce();
      };


    } else {
      // Update layer
      switch (layerFunc) {
        case 'start':
          startLayer(layerNumber);
          break;
        case 'stop':
          if (!state.activeLayers[layerNumber].running) {
            console.log(`Layer ${layerNumber} is not running`);
          } else {
            clearTimeout(state.activeLayers[layerNumber].timer);
            state.activeLayers[layerNumber].running = false;
          }
          break;
        case 'speed':
          state.activeLayers[layerNumber].speed = value;
          break;
        case 'color':
          state.activeLayers[layerNumber].color = value;
          state.activeLayers[layerNumber].func.changeColor(value);
          break;
        case 'program':
          if (programMap[value]) {
            let command = programMap[value].cmd;
            let args = programMap[value].args;
            state.activeLayers[layerNumber].program = value;

            if (command && args) {
              // Deleting relevant layers from state in ledController
              state.activeLayers[layerNumber].func.kill();
              // The timer runs the chained output function of the function in the layer
              // So we can just change the function
              state.activeLayers[layerNumber].func = ledController[command](...args);
              // Setting color on new layer from state
              state.activeLayers[layerNumber].func.changeColor(state.activeLayers[layerNumber].color);
            }
          }
          break;
        case 'master':
          state.activeLayers[layerNumber].master = value;
          state.activeLayers[layerNumber].func.changeMaster(value);
          break;
        case 'preOffset':
          break;
        case 'postOffset':
          break;
        default:
          console.log('Unknown layer function');
          oscError('Unknown layer function')
      }
    };

  };
});

const createLayer = (layerNumber) => {
  let command = programMap[state.activeLayers[layerNumber].program].cmd;
  let args = programMap[state.activeLayers[layerNumber].program].args;
  // Create new instance
  state.activeLayers[layerNumber].func = ledController[command](...args);
};

const startLayer = (layerNumber, force) => {

  if (state.activeLayers[layerNumber].running && !force) {
    console.log(`Layer ${layerNumber} already running`);
    oscError(`Layer ${layerNumber} already running`);
    return;
  }

  const runOnce = () => {
    state.activeLayers[layerNumber].func.output();
    state.activeLayers[layerNumber].timer = setTimeout(runOnce, state.activeLayers[layerNumber].speed);
  };
  runOnce();
  state.activeLayers[layerNumber].running = true;
};
  



  



//   switch (func) {
//     case 'start':
//       if (state.activeLayers[layer].running) {
//         console.log(`Layer ${layer} is already running`);
//       } else {
//         const runOnce = () => {
//           state.activeLayers[layer].func.output();
//           state.activeLayers[layer].timer = setTimeout(runOnce, state.activeLayers[layer].speed);
//         }
//         runOnce();
//         state.activeLayers[layer].running = true;
//       };
//       break;
//     case 'stop':
//       if (!state.activeLayers[layer].running) {
//         console.log(`Layer ${layer} is not running`);
//       } else {
//         clearTimeout(state.activeLayers[layer].timer);
//         state.activeLayers[layer].running = false;
//       }
//       break;
//     case 'speed':
//       state.activeLayers[layer].speed = value;
//       break;
//     case 'color':
//       let valueList = value;
//       for(var i = 0; i < valueList.length; i++) {
//        valueList = valueList.replace(" ", ",");
//       };
//       const color = JSON.parse("[" + valueList + "]");
//       state.activeLayers[layer].color = color;
//       state.activeLayers[layer].func.changeColor(color);
//       break;
//     case 'preOffset':
//       break;
//     case 'postOffset':
//       break;
//     default:
//       console.log('Unknown command');
//   }
// });


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

  // Removing active layers from what is emitted to client since the timers live there and that would cause "RangeError: Maximum call stack size exceeded" in socket.io
  let reducedState = Object.assign({}, state);
  delete reducedState.activeLayers;

  // Send state to clients
  io.sockets.emit('FromAPI', reducedState);

}, 1000);
