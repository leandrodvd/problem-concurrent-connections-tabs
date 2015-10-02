### BrowserIpc

BrowserIpc implements a simple interface to coordiante/communicate between different tabs running on the same domain within the same browser window. It supports the following:

#### Requirements

The communication is done through the `localStorage` feature. Browsers (or modes) which do not support this will not work. Additionally only tabs will only communicate with other tabs with the same [origin](http://www.w3.org/TR/2010/WD-html5-20100624/origin-0.html) (a note on testing, many browsers treat all `file:///` locations as different origins).

#### API

##### Inter-tab communication:
  After creating an instance `var bus = new BrowserIpc()` it is possible to send and react to received messages. To send events to other windows the `broadcast` function can be used. The signature is:
  
````javascript
// name - String - is an identifier for this type of message/event.
// payload - Object - data that will be sent (note object will be serialized using JSON.stringify for transport).
// and_self - Boolean - optional - default false - whether a copy of the message should be sent to the tab making the call.
broadcast(name, payload, [and_self])
````

To consume events use `on` or `once` which have the same signature:
````javascript
// name - String - is an identifier for this type of message/event 
// listener - Function - callback function which will be passed the event payload as its first (and only) argument.
// context - Object - optional - object to use as the `this` object when calling `listener`.
on(name, listener, [context])
````

#####  Inter-tab coordination:
The library uses it's event system to hold elections of a master tab. You can see the result by accessing the `isMaster` property and react to promotions or demotions of the current tab's status be attaching a handler to the special `masterDidChange` event.

Among tabs which can communicate with each other, only one tab will ever have `isMaster` being `true`. But on opening or closing of new tabs a new election is held and _any_ tab is eligible.
