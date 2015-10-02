// Copied from https://gist.github.com/neilj/4146038
//  based on article http://blog.fastmail.fm/2012/11/26/inter-tab-communication-using-local-storage/

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.BrowserIpc = factory();
  }
}(this, function() {
'use strict';

  // Utility functions
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

  var getCurrTimestamp = Date.now || function() {
    return new Date().getTime();
  };

  /**
   * @name Evemit
   * @description Minimal and fast JavaScript event emitter for Node.js and front-end.
   * @author Nicolas Tallefourtane <dev@nicolab.net>
   * @link https://github.com/Nicolab/evemit
   * @license MIT https://github.com/Nicolab/evemit/blob/master/LICENSE
   */
  var EventEmitter = (function() {
    'use strict';

    function Evemit() {
      this.events = {};
    }

    Evemit.prototype.on = function(event, fn, context) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      if(context) {
        fn._E_ctx = context;
      }

      this.events[event].push(fn);

      return this;
    };

    Evemit.prototype.once = function(event, fn, context) {
      fn._E_once = true;
      return this.on(event, fn, context);
    };

    Evemit.prototype.emit = function(event, arg1, arg2, arg3, arg4) {
      var fn, evs, args, aLn;

      if(!this.events[event]) {
        return false;
      }

      args = Array.prototype.slice.call(arguments, 1);
      aLn  = args.length;
      evs  = this.events[event];

      for(var i = 0, ln = evs.length; i < ln; i++) {
        fn = evs[i];

        if (fn._E_once) {
          this.off(event, fn);
        }

        // Function.apply() is a bit slower, so try to do without
        switch (aLn) {
          case 0:
            fn.call(fn._E_ctx);
            break;
          case 1:
            fn.call(fn._E_ctx, arg1);
            break;
          case 2:
            fn.call(fn._E_ctx, arg1, arg2);
            break;
          case 3:
            fn.call(fn._E_ctx, arg1, arg2, arg3);
            break;
          case 4:
            fn.call(fn._E_ctx, arg1, arg2, arg3, arg4);
            break;
          default:
            fn.apply(fn._E_ctx, args);
        }
      }

      return true;
    };

    Evemit.prototype.off = function(event, fn) {
      if (!this.events[event]) {
        return this;
      }

      for (var i = 0, ln = this.events[event].length; i < ln; i++) {
        if (this.events[event][i] === fn) {
          this.events[event][i] = null;
          delete this.events[event][i];
        }
      }

      // re-index
      this.events[event] = this.events[event].filter(function(ltns) {
        return typeof ltns !== 'undefined';
      });

      return this;
    };

    Evemit.prototype.listeners = function(event) {
      var evs, ltns;

      if(event) {
        return this.events[event] || [];
      }

      evs  = this.events;
      ltns = [];

      for(var ev in evs) {
        ltns = ltns.concat(evs[ev].valueOf());
      }

      return ltns;
    };

    return Evemit;
  })();


  // Browser IPC
  function BrowserIpc () {
      this.id = Math.random();
      this.isMaster = false;
      this.others = {};
      EventEmitter.call(this);

      window.addEventListener( 'storage', this, false );
      window.addEventListener( 'unload', this, false );

      this.broadcast( 'hello' );

      var that = this;
      var check = function check () {
          that.check();
          that._checkTimeout = setTimeout( check, 9000 );
      };
      var ping = function ping () {
          that.sendPing();
          that._pingTimeout = setTimeout( ping, 17000 );
      };
      this._checkTimeout = setTimeout( check, 500 );
      this._pingTimeout = setTimeout( ping, 17000 );
  };

  extend(BrowserIpc.prototype, EventEmitter.prototype);

  // Called on `window.unload` event
  BrowserIpc.prototype.destroy = function () {
      clearTimeout( this._pingTimeout );
      clearTimeout( this._checkTimeout );

      window.removeEventListener( 'storage', this, false );
      window.removeEventListener( 'unload', this, false );

      this.broadcast( 'bye' ); // set ping to 0 to
      // immediately notify slaves to hold an election
  };

  BrowserIpc.prototype.handleEvent = function ( event ) {
      if ( event.type === 'unload' ) {
          this.destroy();
      } else if ( event.key === 'broadcast' ) {
          try {
              var data = JSON.parse( event.newValue );
              if ( data.id !== this.id ) {
                this.emit(data.type, data);
                this[ data.type ]( data );
              }
          } catch ( error ) {}
      }
  };

  BrowserIpc.prototype.sendPing = function () {
      this.broadcast( 'ping' );
  };

  BrowserIpc.prototype.hello = function ( event ) {
      this.ping( event );
      if ( event.id < this.id ) {
          this.check();
      } else {
          this.sendPing();
      }
  };

  BrowserIpc.prototype.ping = function ( event ) {
      this.others[ event.id ] = +new Date();
  };

  BrowserIpc.prototype.bye = function ( event ) {
      delete this.others[ event.id ];
      this.check();
  };

  BrowserIpc.prototype.check = function ( event ) {
      var now = +new Date(),
          takeMaster = true,
          id;
      for ( id in this.others ) {
          if ( this.others[ id ] + 23000 < now ) {
              delete this.others[ id ];
          } else if ( id < this.id ) {
              takeMaster = false;
          }
      }
      if ( this.isMaster !== takeMaster ) {
          this.isMaster = takeMaster;
          this.emit("masterDidChange");
      }
  };

  BrowserIpc.prototype.broadcast = function ( type, data, andSelf ) {
      var event = {
          id: this.id,
          type: type,
          timestamp: getCurrTimestamp()
      };
      for ( var x in data ) {
          event[x] = data[x];
      }
      try {
          localStorage.setItem( 'broadcast', JSON.stringify( event ) );
      } catch ( error ) {}
      if ( andSelf ) { this.emit(type, event); }
  };

  return BrowserIpc;
}));
