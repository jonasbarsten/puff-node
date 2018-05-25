## OSC-API

Broadcast on port 8050, both in and out.

ex. in Max/MSP: `[udpsend 10.0.255.255 8050]` and `[udpreceive 8050]`
[Github](https://github.com/jonasbarsten/puff-client)
|OUT|||
|---|---|---|
|/puff/{ip}/piezo/{0-7}|velocity 0.-1.|Float|
|/puff/{ip}/orientation|0 - 360 degrees|Int|
|/puff/{ip}/ping|date|Int|

|IN|||||Default|
|---|---|---|---|---|---|
|/puff/{ip}/cableLight/|Float|
|/puff/{ip}/lights/|allOn|
|/puff/{ip}/lights/|allOff|
|/puff/{ip}/lights/|layer|Int|start
|/puff/{ip}/lights/|layer|Int|stop
|/puff/{ip}/lights/|layer|Int|speed|Int `ms to next tic`|500
|/puff/{ip}/lights/|layer|Int|color|String `"255 255 255 255"`|10 10 10 10
|/puff/{ip}/lights/|layer|Int|direction|String `s/n/e/w/ne/nw/se/sw`|s
|/puff/{ip}/lights/|layer|Int|preOffset|Int `tics`|0
|/puff/{ip}/lights/|layer|Int|postOffset|Int `tics`|0


## Accordion spesific:

* Subnetmask: 255.255.0.0
* Router: 10.0.0.1
* Main switch: 10.0.0.2
* Main Mac: 10.0.0.10
* UNMS: 10.0.0.11

## Front repo:

* [Github](https://github.com/jonasbarsten/puff-client)
* Puff GUI: http://puff.local:5000

Deploy:

* yarn build