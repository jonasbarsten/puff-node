'use strict';

var easymidi = require('easymidi');

var inputs = easymidi.getInputs();
let teensy = '';

// Finding teensy with piezo (Fiskehest)
for (var i = 0; i < inputs.length; i++) {
  let value = inputs[i];
  if (value.substring(0, 9) === 'Fiskehest') {
    teensy = value;
  }
};

if (teensy) {
  var input = new easymidi.Input(teensy);
  // var client = new osc.Client('10.0.128.106', 8010);

  // MIDI 2 OSC
  input.on('noteon', function (msg) {
    // console.log(msg);

    const velocityFloat = msg.velocity / 127;
    const note = msg.note;
    // var msg = new osc.Message('/surfaces/Fixture 1/opacity', velocityFloat);

    // client.send(msg)
  });
}