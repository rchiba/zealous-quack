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

  });

  // TODO: Get all these specs to work
  describe('.set_recent', function(){

  });

});
