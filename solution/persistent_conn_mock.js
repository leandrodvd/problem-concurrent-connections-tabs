// Super basic shim emulating the `PersistentConn` API

window.mock={}
window.mock.isconnected=false;

  var extend = function(a, b) {
    if (typeof a === 'undefined' || !a) { a = {}; }
    if (typeof b === 'object') {
      for (var key in b) {
        if (b.hasOwnProperty(key)) {
          a[key] = b[key];
        }
      }
    }
    return a;
  };
  

  
// Channel object - just a mock that will emit events simulating that something is received from servers
Channel = function Channel(name) {
	"use strict";
	this.channelName=name;
	this.events=[];
	this.eventEmmiter = new Evemit();
	// EventEmitter.call(this);
	// extend(Channel.prototype, EventEmitter.prototype);
	this.mockEmitAllEvents=function(){
		console.log("mock - emit all events");
		// emit all channel events
		if(window.mock.isconnected){
			for (var i=0;i<this.events.length;i++){
				console.log("Will emit a mock event "+this.channelName+" "+this.events[i]);
				var msg="This is a fake event emited for channel "+this.channelName+" and event:"+this.events[i];
				this.eventEmmiter.emit(this.events[i],{"data":msg});
			}	
			//set to emit all channel events each 5 sec
			var that=this;
			setTimeout(this.mockEmitAllEvents.bind(that),5000);
		}	
	};
	this.mockEmitAllEvents();
};
Channel.prototype.bind = function(eventName,callback) {
	console.log("Channel bind channel:"+this.channelName+" eventName:"+eventName);
	this.eventEmmiter.on(eventName,callback);
	if(this.events.indexOf(eventName)==-1){
		//event not yet registered - register it to be auto emmited 
		this.events.push(eventName);
	}
	
};
Channel.prototype.bind_all = function(callback) {;
	//bind callback to all existing events
	var ln=this.events.length
	for (var i=0;i<ln;i++){
		console.log(i+":Channel bind_all - will bind for event "+this.events[i]);
		this.bind(this.events[i],callback);
	}	
};
Channel.prototype.unbind = function(eventName,callback) {
	console.log("Channel - will unbind "+eventName);
	this.eventEmmiter.off(eventName,callback);
	
};
Channel.prototype.unbind_all = function(callback) {
	for (var i=0;i<this.events.length;i++){
		this.unbind(this.events[i],callback);
	}	
};

// PersistentConn object
PersistentConn = function PersistentConn(key) {
	console.log("Persistentconn constructor");
	window.mock.isconnected=true;
};
PersistentConn.prototype.unsubscribe = function(name) {};
PersistentConn.prototype.subscribe = function(name) { return new Channel(name); };
PersistentConn.prototype.disconnect = function() {
	window.mock.isconnected=false;
};
