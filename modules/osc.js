'use strict';

var osc = require('osc');

let oscPortReady = false;
let outAddress = "10.0.255.255";
let outPort = 8050;
let inPort = 8010;
let udpPort = null;

exports.open = () => {
	udpPort = new osc.UDPPort({
	  localAddress: "0.0.0.0",
	  localPort: inPort,
	  metadata: true,
	  broadcast: true
	});

	udpPort.open();

	udpPort.on("ready", () => {
	  oscPortReady = true;
	});
};

exports.listen = (callback) => {
	// Waiting for the port to become ready
	// TODO: fix this with promises etc ...
	setTimeout(() => {
		return udpPort.on("osc", (message, info) => {
			callback(message, info);
		});
	}, 3000);
};

exports.close = () => {
	oscPortReady = false;
	udpPort.close();
};

exports.send = (address, args) => {
	if (oscPortReady) {
	  udpPort.send({
		  address: address,
		  args: args
		  // args: [
		  //   {
		  //     type: "s",
		  //     value: "default"
		  //   },
		  //   {
		  //     type: "i",
		  //     value: 100
		  //   }
		  // ]
		}, outAddress, outPort);
	}
};

exports.changeOutPort = (port) => {
	this.close();
	outPort = port;
	this.open();
};

exports.changeInPort = (port) => {
	this.close();
	inPort = port;
	this.open();
};