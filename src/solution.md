# Solution Summary

1. Build a bus so that tabs can communicate
2. PersistenConnProxy will return an object that mimics PersistentConn with an identical prototype "signature" so that the PersistentConnProxy can replace PersistentConn with on changes in code
3. The initialization of a persistent connection, unsubscribe and disconnect will be broadcasted to the bus instead of directly executed by PersistentConn.
4. Subscribe function in PersistenConnProxy will now listen the bus events after broadcasting the subscribe request instead of directly using PersistentConn.subscribe
5. All tabs will listen to "init", "subscribe", "unsubscribe" and "disconnect" events on the bus (including it's own events emmited)
6. Master tab will execute the real operations using a "singleton" PersistentConn object
7. Master tab will listen to all events on PersistentConn and broadcast it to the bus
8. Slave tabs will keep a "ConnectionState" object that is updated for each subscribe, unsubscribe, init and disconnect events 
9. When the master tab changes, the "ConnectionState" object is used to recreate the connection and all the current subscription.
10. I'm not sure what happens if too many tabs subscribe and close. We may have the master listening and broadcasting "channels" that are not necessary anymore as the original requester tab already closed without unsubscribing.