'use strict';

const logUpdate = require('log-update');
var artnet = require('artnet')(
	// {host: '127.0.0.1'}
);

const numberOfPuffs = 4;
const ledsInRow = 4;
const outputRate = 30;
let updateRate = 500;
const rgbwDefault = [10,10,10,10];
let rgbwSum = [0,0,0,0];
let mainTimer = null;

let state = {
	'0': {
		'0': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'1': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'2': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
	},
	'1': {
		'0': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'1': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'2': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
	},
	'2': {
		'0': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'1': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'2': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
	},
	'3': {
		'0': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'1': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'2': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
	},
}

const compareLed = (newLed, puffNumber, lineNumber, ledNumber) => {
	const oldLed = state[puffNumber][lineNumber][ledNumber];
	let combinedLed = [];

	if (oldLed.toString() == "0,0,0,0") {
		// If old led is dead, bring it alive or keep it dead
		combinedLed = newLed;
	} else if (newLed.toString() == "0,0,0,0") {
		// If new led is dead, but old led is alive, keep old led
		combinedLed = oldLed;
	} else {
		// Both old and new leds are alive
		newLed.map((color, i) => {
			if (oldLed[i] == 0) {
				combinedLed[i] = color;
			} else if (color == 0) {
				combinedLed[i] = oldLed[i];
			} else {
				combinedLed[i] = (color + oldLed[i]) / 2;
			}
		});
	}

	return combinedLed;
};

exports.setColor = (newRgbw) => {
	rgbw = newRgbw;
};

exports.setUpdateRate = (newUpdateRate) => {
	console.log(newUpdateRate);
	updateRate = newUpdateRate;
};

exports.allOff = (puffNumber) => {
	state[puffNumber] = {
		'0': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'1': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
		'2': [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
	}
};

exports.allOn = (puffNumber) => {
	state[puffNumber] = {
		'0': [rgbwDefault, rgbwDefault, rgbwDefault, rgbwDefault],
		'1': [rgbwDefault, rgbwDefault, rgbwDefault, rgbwDefault],
		'2': [rgbwDefault, rgbwDefault, rgbwDefault, rgbwDefault]
	}
};

exports.rotatePuffHorizontally = (puffNumber, reverse, preDelayTics, postDelayTics) => {

	if (!reverse) {
		let reverse = false;
	}

	var self = {};

	let lines = [];

	Object.keys(state[puffNumber]).map((key, index) => {
		lines.push(this.rotateLineHorisontally(puffNumber, key, reverse, preDelayTics, postDelayTics));
	});

	const output = () => {
		lines.map((line) => {
			line.output();
		});
	}

	const changeColor = () => {
		lines.map((line) => {
			line.changeColor();
		});
	}

	self.output = output;
	self.changeColor = changeColor;

	return self;

};

exports.rotatePuffVertically = (puffNumber, reverse) => {

	let rgbw = rgbwDefault;

	var self = {};
	
	let puff = state[puffNumber];
	let tic = 1;

	if (reverse) {
		tic = 3;
	}

	const output = () => {

		puff['0'] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
		puff['1'] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
		puff['2'] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

		if (tic == 1) {puff['0'] = [rgbw,rgbw,rgbw,rgbw]};
		if (tic == 2) {puff['1'] = [rgbw,rgbw,rgbw,rgbw]};
		if (tic == 3) {puff['2'] = [rgbw,rgbw,rgbw,rgbw]};

		
		if (reverse) {
			tic = tic - 1;
		} else {
			tic = tic + 1;
		}
		
		if (reverse) {
			if (tic == 0) {tic = 3};
		} else {
			if (tic == ledsInRow) {tic = 1};
		}

	};

	const changeColor = (color) => {
		rgbw = color;
	};

	self.output = output;
	self.changeColor = changeColor;

	return self;

};

exports.rotatePuffDiagonally = (puffNumber, mode, preDelayTics, postDelayTics) => {

	var self = {};
	let lines = [];

	if (!mode) {
		let mode = 1;
	};

	if (!preDelayTics) {
		let preDelayTics = 0;
	};

	if (!postDelayTics) {
		let postDelayTics = 0;
	};

	if (mode == 1) {
		lines.push(this.rotateLineHorisontally(puffNumber, '0', false, 0, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '1', false, 1, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '2', false, 2, 2));
	};

	if (mode == 2) {
		lines.push(this.rotateLineHorisontally(puffNumber, '0', true, 0, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '1', true, 1, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '2', true, 2, 2));
	};

	if (mode == 3) {
		lines.push(this.rotateLineHorisontally(puffNumber, '0', false, 2, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '1', false, 1, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '2', false, 0, 2));
	};

	if (mode == 4) {
		lines.push(this.rotateLineHorisontally(puffNumber, '0', true, 2, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '1', true, 1, 2));
		lines.push(this.rotateLineHorisontally(puffNumber, '2', true, 0, 2));
	};

	const output = () => {
		lines.map((line) => {
			line.output();
		});
	};

	const changeColor = () => {
		lines.map((line) => {
			line.changeColor();
		});
	};

	self.output = output;
	self.changeColor = changeColor;

	return self;

};

exports.rotateLineHorisontally = (puffNumber, lineNumber, reverse, preDelayTics, postDelayTics) => {

	let rgbw = rgbwDefault;

	var self = {};

	let tics = 1;

	if (preDelayTics) {
		tics = tics - preDelayTics;
	};

	const output = () => {

		if (tics > 0 && tics < ledsInRow + 1) {

			if (reverse) {
				if (tics == 1) {
					state[puffNumber][lineNumber] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], rgbw];
				} else {
					state[puffNumber][lineNumber].push(state[puffNumber][lineNumber].shift());
				}
			} else {
				if (tics == 1) {
					state[puffNumber][lineNumber] = [rgbw, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
				} else {
					state[puffNumber][lineNumber].unshift(state[puffNumber][lineNumber].pop());
				}
			}

		} else {
			state[puffNumber][lineNumber] = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
		};

		tics = tics + 1;

		if (postDelayTics) {
			if (tics == ledsInRow + 1 + postDelayTics) {
				tics = 1;
			};
		} else {
			if (tics == ledsInRow + 1) {
				if (preDelayTics) {
					tics = tics - preDelayTics;
				} else {
					tics = 1;
				};
			}
		}

		// setTimeout(output, updateRate);
	};

	const changeColor = (color) => {
		rgbw = color;
	};

	self.output = output;
	self.changeColor = changeColor;

	return self;
};

exports.stop = () => {
	clearTimeout(mainTimer);
};

exports.outputOnce = () => {
	const combinedArray = [
		[].concat.apply([], state['0']['0']),
		[].concat.apply([], state['0']['1']),
		[].concat.apply([], state['0']['2'])
	]; 

	var flatArray = [].concat.apply([], combinedArray);

	artnet.set(1, 1, flatArray);

  // const lineOne = flatArray.slice(0, 16);
  // const lineTwo = flatArray.slice(16, 32);
  // const lineThree = flatArray.slice(32, 48);

  // console.log(lineOne);
  // console.log(lineTwo);
  // console.log(lineThree);

  // logUpdate(
		// `
		//  ${lineOne}
		//  ${lineTwo}
		//  ${lineThree}
		// `
  // );
}

exports.start = () => {
	this.outputOnce();
	mainTimer = setTimeout(this.start, outputRate);
};

this.start();