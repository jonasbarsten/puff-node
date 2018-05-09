'use strict';

var connect = require('connect');
var serveStatic = require('serve-static');

var ledController = require('./modules/ledController.js');
var osc = require('./modules/osc.js');
var midi = require('./modules/midi.js');

ledController.setColor([50, 50, 50, 50]);
ledController.setUpdateRate(500);
ledController.rotatePuffHorizontally('0', 1);

midi.listen((note, value) => {
  console.log(note, value);
});

osc.listen((message, info) => {


  console.log(message);

  if (message.address === '/speed') {
    const speed = message.args[0].value;
    ledController.setUpdateRate(speed);
  };


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

// bonjour.publish({ name: 'Puff 1', type: 'http', port: 9090 })

connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});
