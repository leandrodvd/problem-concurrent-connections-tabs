# Explanation
The PersistentConn service provides endpoints for web clients to open persistent connections that allow for the server to actively "push" events instead of only receive ("pull") responses to requests. A single connection has any number of "channels" as a way to namesapce events which may otherwise have the same name. So channels are only a logically concept provided by the library to make multiplexing a single connection more readable. Once a channel is "subscribe"-d to it will receive any events sent by the server on that channel (along with all other clients listening to that channel). After subscribing a channel can have callback functions registered by binding to a specific (or all) events. An event is just another namespacing mechanism.

# Example usage
A basic example of how the library could be used is below. Note that although both channels receive events with the same name, the registered callbacks are per channel.

````javascript
var serverConn = new PersistentConn(APP_KEY);
var channelA = serverConn.subscribe("important-posts");
var channelB = serverConn.subscribe("all-posts");

channelA.bind("new-post", function(payload) { alert("New post created with title: " + payload.title); });
channelB.bind("new-post", function(payload) { $("#posts-list").append("<li>" + payload.text + "</li>"); });

....

serverConn.unsubscribe("important-posts");

.....

serverConn.disconnect();
````

# API Documentation
## `PersistentConn` object
The constructor for `PersistentConn` takes a single `String` argument which is the app key you were given on creating your account.
Making a new instance will automatically establish a connection to `PersistentConn`'s servers. Example:
````javascript
// APP_KEY - String - key found given upon signing up for PersistentConn service
var conn = new PersistentConn(APP_KEY)
````


### Instance methods
- Subscribe to a channel
````javascript
// channelName - String - name of the channel to subscribe to
// Returns a Channel object
var channel = conn.subscribe(channelName)
````
- Unsubscribe to a channel (if this channel is later subscribed to again, all previous listeners will _not_ have been persisted)
````javascript
// channelName - String - name of the channel to subscribe to
conn.unsubscribe(channelName)
````
- Disconnect
````javascript
// terminate connection to 3rd-party server
conn.disconnect()
````

## `Channel` object
The only way to create a `Channel` object is through a call to `subscribe` (defined above). After subscribing channels are used
for consuming events sent to the browser.

### Instance methods
- Listen for a specific event
````javascript
// eventName - String - the name of the event to bind to.
// callback - Function - a function to be called whenever the event is triggered.
// context - Object - optional - object to set as `this` object in `callback`.
bind(eventName, callback, [context])
````
- Listen for all events
````javascript
// callback - Function - a function to be called whenever the event is triggered. It will be 
//     passed two arguments (String, Object) where the first is the name of the event and the 
//     second is the normal event payload as in `bind`.
bind_all(callback)
````

- Stop listening
````javascript
// eventName - String - the name of the event that the binding is to be removed from
// callback - Function - the function event handler used when binding to the event.
unbind(eventName, callback)
````
 - Unregister a global listener
````javascript
// callback - Function - a function event handler registered with a previous call to `bind_all`.
unbind_all(callback)
````
