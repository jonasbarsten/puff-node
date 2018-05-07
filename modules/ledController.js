'use strict';

const logUpdate = require('log-update');
var artnet = require('artnet')();

const numberOfPuffs = 4;
const updateRate = 500;
const outputRate = 80;
const ledsInRow = 4;
let rgbw = [100,100,100,100];

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

exports.rotatePuffHorizontally = (puffNumber, reverse, preDelayTics, postDelayTics) => {

	if (!reverse) {
		let reverse = false;
	}

	Object.keys(state[puffNumber]).map((key, index) => {
		this.rotateLineHorisontally(puffNumber, key, reverse, preDelayTics, postDelayTics);
	});
};

exports.rotatePuffVertically = (puffNumber, reverse) => {
	
	let puff = state[puffNumber];
	let tic = 1;

	if (reverse) {
		tic = 3;
	}

	setInterval(() => {

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
	}, updateRate)
};

exports.rotatePuffDiagonally = (puffNumber, mode, preDelayTics, postDelayTics) => {

	if (!mode) {
		let mode = 1;
	}

	if (!preDelayTics) {
		let preDelayTics = 0;
	}

	if (!postDelayTics) {
		let postDelayTics = 0;
	}

	if (mode == 1) {
		this.rotateLineHorisontally(puffNumber, '0', false, 0, 2);
		this.rotateLineHorisontally(puffNumber, '1', false, 1, 2);
		this.rotateLineHorisontally(puffNumber, '2', false, 2, 2);
	}

	if (mode == 2) {
		this.rotateLineHorisontally(puffNumber, '0', true, 0, 2);
		this.rotateLineHorisontally(puffNumber, '1', true, 1, 2);
		this.rotateLineHorisontally(puffNumber, '2', true, 2, 2);
	}

	if (mode == 3) {
		this.rotateLineHorisontally(puffNumber, '0', false, 2, 2);
		this.rotateLineHorisontally(puffNumber, '1', false, 1, 2);
		this.rotateLineHorisontally(puffNumber, '2', false, 0, 2);
	}

	if (mode == 4) {
		this.rotateLineHorisontally(puffNumber, '0', true, 2, 2);
		this.rotateLineHorisontally(puffNumber, '1', true, 1, 2);
		this.rotateLineHorisontally(puffNumber, '2', true, 0, 2);
	}

};

exports.rotateLineHorisontally = (puffNumber, lineNumber, reverse, preDelayTics, postDelayTics) => {

	let tics = 1;

	if (preDelayTics) {
		tics = tics - preDelayTics;
	};

	setInterval(() => {

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

	}, updateRate);
};

setInterval(() => {

	// Channel 1 = Led 1 Red 
	// Channel 2 = Led 1 Green
	// Channel 3 = Led 1 Blue
	// Channel 4 = Led 1 White

	// Channel 5 = Led 2 Red 
	// Channel 6 = Led 2 Green
	// Channel 7 = Led 2 Blue
	// Channel 8 = Led 2 White

	// etc ...

	var flatArray = [].concat.apply([], state['0']['0']);

	console.log(flatArray);

	// set channel 1 to 255.
	artnet.set(1, 1, flatArray);

	// Logging to terminal
  // const lineOne = state['0']['0'];
  // const lineTwo = state['0']['1'];
  // const lineThree = state['0']['2'];

  // logUpdate(
		// `
		//  ${lineOne}
		//  ${lineTwo}
		//  ${lineThree}
		// `
  // );
}, outputRate);