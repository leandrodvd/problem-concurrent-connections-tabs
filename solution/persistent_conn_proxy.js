// Super basic shim emulating the `PersistentConn` API
	
// Channel object
ChannelProxy = function ChannelProxy(name) {
	this.channelName=name;
	this.bind_all_fn={};
};
//5. bin, bind_all, unbind and unbind_all will also be broadcasted to the bus and the callback will be bind to the bus
ChannelProxy.prototype.bind = function(eventName, callback, context) {
	//broadcast
	window.bus.broadcast('bind', {"channelName":this.channelName,"eventName":eventName}, true);

	//bind to the bus event with the format 'channelname_eventName'
	bus.on(this.channelName+"_"+eventName, callback, context);
	
};
ChannelProxy.prototype.bind_all = function(callback) {
	//broadcast
	window.bus.broadcast('bind_all', {"channelName":this.channelName}, true);
	this.bind_all_fn=callback;
	//bind to the bus event 'channelname'
	bus.on(this.channelName, callback);
};
ChannelProxy.prototype.unbind = function(eventName, callback) {
	//broadcast
	window.bus.broadcast('unbind', {"channelName":this.channelName,"eventName":eventName}, true);

	//unbind from the bus
	bus.off(this.channelName+"_"+eventName, callback);
	

};
ChannelProxy.prototype.unbind_all = function(callback) {
	//broadcast
	window.bus.broadcast('unbind_all', {"channelName":this.channelName}, true);

	//unbind from channel event on bus
	bus.off(this.channelName, this.bind_all_fn);
};

// PersistentConnProxy object
PersistentConnProxy = function PersistentConnProxy(key) {
	console.log("PersistentConnProxy constructor");
	//window.bus = new BrowserIpc();
	if (!window.bus){
		console.log("init bus");
		window.bus = new BrowserIpc();
	}

	var self={};
	self.conn={};
	self.conn.key=key;//app key
	self.conn.persistentConn={};//singleton PersistentConnection object-Created by master during init event or masterDidChange - destroyied by slaves on mansterDidChange and disconnect
	self.conn.channels=[];//an array of Channel objects with the channel name as the key - {'channelName':'name','channel':channel,'events':[{'eventName':'event1','eventFn':fn1},{'eventName':'event2','eventFn':fn2},...],'bind_all':false}
	self.conn.getChannelIndex=function(channelName){
		console.log("getChannelIndex "+channelName);
		for (var i=0;i<self.conn.channels.length;i++){
			if(self.conn.channels[i].channelName==channelName){
				//found the channel in the list - return the index
				return i;
			}
		}
	};

	//deal with all events received - bind callbacks to each event received in the bus
	//unsubscribe
	window.bus.on("unsubscribe",function(payload){
		console.log("us on unsubscribe bus.isMaster:"+bus.isMaster);
		if(bus.isMaster){
			//unsubscribe from the real PersistentConn
			self.conn.persistentConn.unsubscribe(payload.channelName);
		}
		//remove from channels list
		var chIndex= self.conn.getChannelIndex(payload["channel"]);
		self.conn.channels.splice(chIndex,1);	
		
	});
	//subscribe
	window.bus.on("subscribe",function(payload){
		console.log("isMaster:"+ bus.isMaster+" on subscribe "+JSON.stringify(payload));
		var channel={};//dummy empty object in case this is not the master tab
		if(bus.isMaster){
			//create a real channel object if this is the master tab
			channel=self.conn.persistentConn.subscribe(payload.channelName);
			
		}
		//store the channel in the list - in case this is not a Master tab, this may be used to convert this into a Master tab during masterDidChange
		self.conn.channels.push({"channelName":payload.channelName,"channel":channel,"events":[],"bind_all":false});
		
	});
	
	//disconnect - assuming that when one tab requests "disconnect", it's ok to disconnect all tabs
	window.bus.on("disconnect",function(){
		console.log("bus on disconnect bus.isMaster:"+bus.isMaster);
		if(bus.isMaster){
			self.conn.persistentConn.disconnect();
		}
		
	});
	
	//channel bind
	
	window.bus.on("bind",function(payload){
		console.log("bus on bind:"+JSON.stringify(payload)+ " bus.isMaster:"+bus.isMaster);
		var chIndex= self.conn.getChannelIndex(payload["channelName"]);
		var bindFunction=function(data){
				//when masterTab receives the event it will be broadcasted to the bus with the format  "channelname_eventName"
				var broadcastEventName=payload.channelName+"_"+payload.eventName;
				console.log("on channel event callback - will broadcast back to bus broadcastEventName:"+broadcastEventName+ " "+JSON.stringify(data));
				window.bus.broadcast(broadcastEventName, data, true);
			}
		if(bus.isMaster){ 	
			//bind event to the real channel - 
			self.conn.channels[chIndex].channel.bind(payload.eventName,bindFunction);
		}
		//add the event to the events list - to be used in case this is not the master and becomes the master in future
		//{'eventName':'event1','eventFn':fn1}
		self.conn.channels[chIndex].events.push({'eventName':payload.eventName,'eventFn':bindFunction});
	});	
	//channel bind_all
	window.bus.on("bind_all",function(payload){
		console.log("bus.isMaster:"+bus.isMaster);
		//search the channel on channels array
		var chIndex= self.conn.getChannelIndex(payload["channelName"]);
		if(bus.isMaster){
			//bind event to the real channels - 
			self.conn.channels[chIndex].channel.bind_all(function(data){
				//when  an event is received by the channel in masterTab it will be broadcasted to the bus with the format  "channelname"
				 window.bus.broadcast(payload.channelName, data, true);
			});
		}
		//set bind_all to the channel in channels list - to be used in case this is not the master and becomes the master in future
		self.conn.channels[chIndex].bind_all=true;
	});
	//channel unbind
	window.bus.on("unbind",function(payload){
		console.log("bus.isMaster:"+bus.isMaster);
		//search the channel on channels array
		var chIndex= self.conn.getChannelIndex(payload["channelName"]);
		
		//remove the event from the events list - to be used in case this is not the master and becomes the master in future
		//find the event in the events list
		for(var j=0;j<self.conn.channels[chIndex].events.length;j++){
			if(self.conn.channels[chIndex].events[j].eventName==payload.eventName){
				if(bus.isMaster){
					//bind event to the real channel - 
					self.conn.channels[chIndex].channel.unbind(payload.eventName,self.conn.channels[chIndex].events[j].eventFn);
				}
				//remove the event from the list
				self.conn.channels[chIndex].events.splice(j,1);
			}
		}
	});
	//channel unbind_all
	window.bus.on("unbind_all",function(payload){
		console.log("bus.isMaster:"+bus.isMaster);
		//search the channel on channels array
		var chIndex= self.conn.getChannelIndex(payload["channelName"]);
		if(bus.isMaster){
			//bind event to the real channel - 
			self.conn.channels[chIndex].channel.unbind_all(function(data){
				//broadcast the unbind_success event -'unbind_all_success_channelname'
				window.bus.broadcast('unbind_all_success_'+payload.channelName, data, true);
			});
		}
		//remove the bind_all from the events list - to be used in case this is not the master and becomes the master in future
		self.conn.channels[chIndex].bind_all=false;
		
	});
	//masterDidChange
	window.bus.on("masterDidChange",function(payload){
		console.log("masterDidChange - bus.isMaster:"+bus.isMaster );
		if(bus.isMaster){
				//use all the info at self.conn object to build a new PersistentConn with all channels subscriptions
			console.log("master init on masterDidChange");
			//init PersistentConn
			self.conn.persistentConn=new PersistentConn(self.conn.key);
			//recreate all channels
			for(var i=0;i<self.conn.channels.length;i++){
				console.log("masterDidChange-restoring channel "+self.conn.channels[i].channelName);
				//recreate the channel object
				self.conn.channels[i].channel=self.conn.persistentConn.subscribe(self.conn.channels[i].channelName);
				
				//recreate all the channel bindings
				for(var j=0;j<self.conn.channels[i].events.length;j++){			
					//need to use self executable function here					
					var bindFunction;
					
					(function(){
						  var broadcastEventName=self.conn.channels[i].channelName+"_"+self.conn.channels[i].events[j].eventName;	
						  
						  function theBindFunction(data){
							  //when masterTab receives the event it will be broadcasted to the bus with the format  "channelname_eventName"
							console.log("[restored]on channel event callback - will broadcast back to bus broadcastEventName:"+broadcastEventName+ " "+JSON.stringify(data));
							window.bus.broadcast(broadcastEventName, data, true);
						  }

						  bindFunction = theBindFunction; //Assign 'theBindFunction' higher context bindFunction
						})();
					console.log("new bindFunction:"+bindFunction);
					//
 	
					//bind event to the real Channel - 
					 self.conn.channels[i].channel.bind(self.conn.channels[i].events[j].eventName,bindFunction);

					//update the bindFunction to the events list to allow unbind
					//{'eventName':'event1','eventFn':fn1}
					self.conn.channels[i].events[j].eventFn=bindFunction;
	
				}
				
			}
		}
		else{
			//oh man... I'm not the masterTab...
			//Maybe this was master before - so cleanup any master-only stuff (like the PersistentConn object as "there can be only one" of that)
			if(self.conn.persistentConn){
				self.conn.persistentConn.disconnect();
			}

		}
	});
	window.bus.on("hello",function(payload){
		//a tab tab has joined the pool - let's welcome the new tab by sending our self so it becomes able to be a Master
		if(bus.isMaster){
			console.log("received a hello will broadcast welcome self :"+JSON.stringify(self));
			window.bus.broadcast('welcome', self);			
		}
	});
	window.bus.on("welcome",function(payload){
		console.log("I received a welcome - What a lovely neighborhood "+JSON.stringify(payload));
		self.conn.key=payload.conn.key;
		console.log("update channels:"+JSON.stringify(payload.conn.channels));
		self.conn.channels=payload.conn.channels;
		window.bus.broadcast('masterDidChange', {});
	});
	
	
};
PersistentConnProxy.prototype.unsubscribe = function(name) {
	console.log("broadcast unsubscribe to "+name);
	window.bus.broadcast('unsubscribe', {channelName:name}, true);
};
PersistentConnProxy.prototype.subscribe = function(name) { 
	console.log("broadcast subscribe to "+name);
	window.bus.broadcast('subscribe', {channelName:name}, true);

	return new ChannelProxy(name);  
};
PersistentConnProxy.prototype.disconnect = function() {
	console.log("broadcast disconnect");
	window.bus.broadcast('disconnect', {},true);
};
