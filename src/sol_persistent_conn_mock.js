// Super basic shim emulating the `PersistentConn` API

// Channel object
Channel = function Channel() {};
Channel.prototype.bind = function() {};
Channel.prototype.bind_all = function() {};
Channel.prototype.unbind = function() {};
Channel.prototype.unbind_all = function() {};

// PersistentConnProxy object
PersistentConnProxy = function PersistentConnProxy(key) {
// init bus
//1. Build a bus so that tabs can communicate
window.bus = new BrowserIpc();

// delegate to main - broadcast the init request
bus.broadcast('persistentConnInit', {key:key}, yes);



//if this is the main subscribe to conn events



};
PersistentConn.prototype.unsubscribe = function(name) {};
PersistentConn.prototype.subscribe = function(name) { return new Channel(); };
PersistentConn.prototype.disconnect = function() {};
