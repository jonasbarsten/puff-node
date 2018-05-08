'use strict';

var connect = require('connect');
var serveStatic = require('serve-static');
// var bonjour = require('bonjour')();
// var easymidi = require('easymidi');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');

ledController.setColor([50, 50, 50, 50]);
ledController.setUpdateRate(100);
ledController.rotatePuffHorizontally('0', 1);
// ledController.allOff('0');
// ledController.start();

midi.listen((note, value) => {
  console.log(note, value);
});

osc.listen((message, info) => {
  console.log(message, info);
});

setInterval(() => {
  osc.send("/hello/bitches", [
    {
      type: "s",
      value: "default"
    },
    {
      type: "i",
      value: 100
    }
  ]);
}, 2000);

// setTimeout(() => {
//   osc.listen((message, info) => {
//     console.log(message);
//     console.log(info);
//   });
// }, 5000);

// setInterval(() => {
//   ledController.stop();
// }, 5000);

// setInterval(() => {
//   ledController.start();
// }, 7000);

// setInterval(() => {
//   ledController.stop();
// }, 10000);



// var inputs = easymidi.getInputs();
// let teensy = '';

// // // // Finding teensy with piezo (Fiskehest)
// for (var i = 0; i < inputs.length; i++) {
//   let value = inputs[i];
//   if (value.substring(0, 9) === 'Fiskehest') {
//     teensy = value;
//   }
// }

// if (teensy) {
//   var input = new easymidi.Input(teensy);
//   var client = new osc.Client('10.0.128.106', 8010);

//   // MIDI 2 OSC
//   input.on('noteon', function (msg) {
//     // console.log(msg);

//     const velocityFloat = msg.velocity / 127;
//     const note = msg.note;
//     // var msg = new osc.Message('/surfaces/Fixture 1/opacity', velocityFloat);

//     // client.send(msg)
//   });
// }

// bonjour.publish({ name: 'Puff 1', type: 'http', port: 9090 })

connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});
