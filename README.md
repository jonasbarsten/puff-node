## OSC-API

Broadcast on port 8050, both in and out.

ex. in Max/MSP: `[udpsend 10.0.255.255 8050]` and `[udpreceive 8050]`

Out:

||||
|---|---|---|
|/puff/{ip}/piezo/{0-7}|velocity 0.-1.|Float|
|/puff/{ip}/orientation|0 - 360 degrees|Int|
|/puff/{ip}/ping|date|Int|


In:

||||||
|---|---|---|---|---|
|/puff/{ip}/lights/|allOn|
|/puff/{ip}/lights/|allOff|
|/puff/{ip}/lights/|layer|Int|start
|/puff/{ip}/lights/|layer|Int|stop
|/puff/{ip}/lights/|layer|Int|speed|Int `ms to next tic`
|/puff/{ip}/lights/|layer|Int|color|String `"255, 255, 255, 255"`
|/puff/{ip}/lights/|layer|Int|direction|String `s/n/e/w/ne/nw/se/sw`
|/puff/{ip}/lights/|layer|Int|preOffset|Int `tics`
|/puff/{ip}/lights/|layer|Int|postOffset|Int `tics`