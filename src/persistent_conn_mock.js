// Super basic shim emulating the `PersistentConn` API

// Channel object
Channel = function Channel() {};
Channel.prototype.bind = function() {};
Channel.prototype.bind_all = function() {};
Channel.prototype.unbind = function() {};
Channel.prototype.unbind_all = function() {};

// PersistentConn object
PersistentConn = function PersistentConn(key) {};
PersistentConn.prototype.unsubscribe = function(name) {};
PersistentConn.prototype.subscribe = function(name) { return new Channel(); };
PersistentConn.prototype.disconnect = function() {};
