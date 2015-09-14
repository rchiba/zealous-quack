describe("Cache", function() {
  var cache, current_time;

  chrome = {
    storage: {
      local:{
        clear: function(){},
        get: function(){},
        set: function(){}
      }
    }
  };

  beforeEach(function() {
    cache = LDR.Cache;

    // mock new Date().getTime()
    current_time = 123;
    Date.prototype.getTime = jasmine.createSpy('getTime').and.returnValue(123);
  });

  describe('.clear', function(){
    beforeEach(function(){
      spyOn(chrome.storage.local, 'clear');
    });

    function subject(){
      cache.clear();
    }

    it('should clear the cache', function() {
      subject();
      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });

  describe('.get', function(){
    var key, cacheMinutes, getter, getterDeferred;
    beforeEach(function(){
      key = 'key';
      cacheMinutes = 10;
      getterDeferred = $.Deferred();
      getter = jasmine.createSpy('getter').and.returnValue(getterDeferred);
    });

    function subject(){
      cache.get(key, cacheMinutes, getter);
    }

    function executeCallback(params){
      var callback = chrome.storage.local.get.calls.first().args[1];
      callback(params); // call the callback as if the local storage returned
    }

    describe('when item is not in cache', function(){
      beforeEach(function(){
        spyOn(chrome.storage.local, 'get');
        spyOn(chrome.storage.local, 'set');
        subject();
      });

      it('should call chrome local storage', function(){
        expect(chrome.storage.local.get).toHaveBeenCalled();
      });

      it('should call the getter', function(){
        executeCallback({}); // call the callback as if the local storage returned
        expect(getter).toHaveBeenCalled();
      });

      it('should save the data into the cache', function(){
        executeCallback({});
        getterDeferred.resolve('value');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          cache:{
            key: {
                value: 'value',
                expiresTimestamp: new Date().getTime() + cacheMinutes * 60 * 1000,
                lastUpdated: new Date().getTime()
            }
          }
        });
      });
    });

    describe('when item is in cache, but cache expired', function(){
      var cachedData;
      beforeEach(function(){
        cachedData = {
          cache: {
            key: { value: 'hi', expiresTimestamp: (current_time-1) }
          }
        };
        spyOn(chrome.storage.local, 'get');
        subject();
      });
      it('should call the getter', function(){
        executeCallback(cachedData);
        expect(getter).toHaveBeenCalled();
      });
    });

    describe('when item is in cache, and cache has not expired', function(){
      var cachedData;
      beforeEach(function(){
        cachedData = {
          cache: {
            key: { value: 'hi', expiresTimestamp: (current_time+1) }
          }
        };
        spyOn(chrome.storage.local, 'get');
        subject();
      });
      it('should NOT call the getter', function(){
        executeCallback(cachedData);
        expect(getter.calls.count()).toEqual(0);
      });
    });

  });


  describe('.get_recent', function(){
    var key, uid, getter, getterDeferred, get_recent_deferred;
    beforeEach(function(){
      key = 'key';
      uid = 'uid';
      getterDeferred = $.Deferred();
      getter = jasmine.createSpy('getter').and.returnValue(getterDeferred);
      spyOn(chrome.storage.local, 'get');
      spyOn(chrome.storage.local, 'set');
      subject();
    });

    function subject(){
      get_recent_deferred = cache.get_recent(uid, key, getter);
      spyOn(get_recent_deferred, 'resolve');
    }

    function executeCallback(params){
      var callback = chrome.storage.local.get.calls.first().args[1];
      callback(params); // call the callback as if the local storage returned
    }

    describe('when item is not found in cache', function(){
      var cachedData = {};
      var getterData = 'value';
      beforeEach(function(){
        executeCallback(cachedData);
      });

      it('should use getter to get data', function(){
        expect(getter).toHaveBeenCalled();
      });

      it('should save whatever it got to cache', function(){
        getterDeferred.resolve(getterData);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          cache:{
            key:{
              value: getterData,
              expiresTimestamp: current_time,
              lastUpdated: current_time
            }
          }
        });
      });

      it('should resolve with the value', function(){
        getterDeferred.resolve(getterData);
        expect(get_recent_deferred.resolve).toHaveBeenCalledWith(getterData);
      });

    });

    describe('when item is found in cache', function(){
      var firebase_response, cachedData;
      
      var store = {
        once: function(){}
      };
      
      var snapshot = {
        val: function(){}
      };

      beforeEach(function(){
        spyOn(store, 'once');
        spyOn(window, 'Firebase').and.returnValue(store);
      });

      function execute_firebase_callback(params){
        var callback = store.once.calls.first().args[1];
        callback(params);
      }

      function setup_with_firebase_response(firebase_response){
        spyOn(snapshot, 'val').and.returnValue(firebase_response);
        cachedData = {
          cache: {
            key: {
              value: 'hi',
              expiresTimestamp: 0,
              lastUpdated: current_time
            }
          }
        };
        executeCallback(cachedData);
        subject();
        execute_firebase_callback(snapshot);
      }

      describe('when last_updated does not exist in firebase', function(){
        beforeEach(function(){
          setup_with_firebase_response({});
        });

        it('should NOT call the getter', function(){
          expect(getter.calls.count()).toEqual(0);
        });
      });

      describe('when last_updated is older than cache\'s last updated', function(){
        beforeEach(function(){
          setup_with_firebase_response({
            key: current_time-1
          });
        });

        it('should NOT call the getter', function(){
          expect(getter.calls.count()).toEqual(0);
        });
      });

      describe('when last_updated is newer than cache\'s last updated', function(){
        beforeEach(function(){
          setup_with_firebase_response({
            key: current_time+1
          });
        });

        it('should call the getter', function(){
          expect(getter.calls.count()).toEqual(1);
        });
      });

    });


  });

  // TODO: Get all these specs to work
  describe('.set_recent', function(){
    var uid, key, getter, getterDeferred;
    beforeEach(function(){
      uid = 'uid';
      key = 'key';
      getterDeferred = $.Deferred();
      getter = jasmine.createSpy('getter').and.returnValue(getterDeferred);
      subject();
    });

    function subject(){
      cache.set_recent(uid, key, getter);
    }

    it('should call the getter', function(){
      expect(getter.calls.count()).toEqual(1);
    });

    describe('after getter returns data', function(){

      var store = {
        set: function(){}
      };

      beforeEach(function(){
        spyOn(chrome.storage.local, 'set');
        spyOn(store, 'set');
        spyOn(window, 'Firebase').and.returnValue(store);
        getterDeferred.resolve('value');
      });

      it('should save data to local storage', function(){
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            cache: {
              key: {
                value: 'value',
                expiresTimestamp: current_time,
                lastUpdated: current_time
              }
            }
        });
      });

      it('should save data to firebase', function(){
        expect(store.set).toHaveBeenCalledWith({
          key: current_time
        });
      });
    });

  });

});
