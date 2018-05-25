## OSC-API

Broadcast on port 8050, both in and out.

ex. in Max/MSP: `[udpsend 10.0.255.255 8050]` and `[udpreceive 8050]`

This works in association with the [client repo](https://github.com/jonasbarsten/puff-client)

|OUT|||
|---|---|---|
|/puff/{ip}/piezo/{0-7}|velocity 0.-1.|Float|
|/puff/{ip}/orientation|0 - 360 degrees|Int|
|/puff/{ip}/ping|date|Int|
|/puff/{ip}/error|message|String|

|IN||||||Default|
|---|---|---|---|---|---|---|
|/puff/{ip}/update|`see below`||
|/puff/{ip}/cableLight/|Float||
|/puff/{ip}/lights/|clearAll||
|/puff/{ip}/lights/|layer|Int|start|
|/puff/{ip}/lights/|layer|Int|stop|
|/puff/{ip}/lights/|layer|Int|speed|Int `ms to next tic`||500
|/puff/{ip}/lights/|layer|Int|color|String `"255 255 255 255"`||10 10 10 10
|/puff/{ip}/lights/|layer|Int|program|String `line-s/line-n/line-e/line-w/line-ne/line-nw/line-se/line-sw/random/allOn/allOff`||line-s
|/puff/{ip}/lights/|layer|Int|interaction|piezo|String `on/off`|off
|/puff/{ip}/lights/|layer|Int|interaction|magneticNorth|String `on/off`|off
|/puff/{ip}/lights/|layer|Int|preOffset|Int `tics`||0
|/puff/{ip}/lights/|layer|Int|postOffset|Int `tics`||0

* when running `update all` from the front it will send a OSC update command to all available puffs.
* the update command consists of `cd`, `git pull` and `sudo reboot` on both the `puff-node` and `puff-client` repos.

## Accordion spesific:

* Subnetmask: 255.255.0.0
* Router: 10.0.0.1
	* ubnt:ubnt
* Main switch: 10.0.0.2
	* ubnt:ubnt
* Main Mac: 10.0.0.10
	* accordion:jonaserkul
* UNMS: 10.0.0.11
	* admin:Jks78aUHBkjbas?hjewkjas2323
* LTE-modem: 192.168.1.1
	* admin:jonaserkul

## Front repo:

The same front lives on all puffs and they know about each outher due to OSC ping broadcast, so the same front with the same content can be seen on port 5000 on any puff. 

* [Github](https://github.com/jonasbarsten/puff-client)
* Puff GUI: http://puff.local:5000

Deploy:

* yarn build

## Pi setup

/etc/rc.local

```
export PATH=/sbin:/usr/sbin:$PATH

su pi -c 'serve -s /home/pi/puff-client/build' &
su pi -c 'nodemon /home/pi/puff-node/server.js'

exit 0
```