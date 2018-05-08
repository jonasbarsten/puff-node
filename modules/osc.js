'use strict';

var osc = require('osc');

let oscPortReady = false;
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

exports.send = () => {
	if (oscPortReady) {
	  udpPort.send({
		  address: "/s_new",
		  args: [
		    {
		      type: "s",
		      value: "default"
		    },
		    {
		      type: "i",
		      value: 100
		    }
		  ]
		}, "10.0.255.255", outPort);
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