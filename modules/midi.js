'use strict';

var easymidi = require('easymidi');

var inputs = easymidi.getInputs();
let teensy = '';
let input = null;

// Finding teensy with piezo (Fiskehest)
for (var i = 0; i < inputs.length; i++) {
  let value = inputs[i];
  if (value.substring(0, 9) === 'Fiskehest') {
    teensy = value;
  }
};

if (teensy) {
  input = new easymidi.Input(teensy);
};

exports.noteListen = (callback) => {
	if (input) {
		return input.on('noteon', (msg) => {
		  const velocityFloat = msg.velocity / 127;
		  const note = msg.note;
		  callback(note, velocityFloat);
		});
	} else {
		callback('No teensy found', null);
	}
};

exports.ccListen = (callback) => {
	if (input) {
		return input.on('cc', (msg) => {
		  const valueFloat = msg.value / 127;
		  const controller = msg.controller;
		  callback(controller, valueFloat);
		});
	} else {
		callback('No teensy found', null);
	}
};