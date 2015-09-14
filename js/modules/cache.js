if(typeof LDR === 'undefined'){
    LDR = {};
}

LDR.Cache = (function(){
    var cache = {};
    var cacheKey = 'cache';

    // params = {
    //  value: The value of whatever is being stored
    //  cacheMinutes (optional): number of minutes to cache the object
    //  lastUpdated (optional): timestamp of when the item was last updated
    // }
    var constructCacheItem = function(params){
        var cacheMinutes = params.cacheMinutes || 0;
        return {
            value: params.value,
            expiresTimestamp: new Date().getTime() + cacheMinutes * 60 * 1000,
            lastUpdated: params.lastUpdated || new Date().getTime()
        };
    };

    // returns deferred
    // resolved by either getting from chrome cache if cache is not expired
    // or calling the getter if cache is expired, and resetting the cache
    // cache items are { value: 'thing being stored', expiresTimestamp: 123 }
    cache.get = function(key, cacheMinutes, getter){
        var deferred = $.Deferred();
        chrome.storage.local.get(cacheKey, function(data) {
            var cacheItem = (typeof data === 'undefined' || typeof data.cache === 'undefined' || typeof data.cache[key] === 'undefined') ? false : data.cache[key];
            if( !cacheItem || typeof cacheItem.value === 'undefined' || cacheItem.expiresTimestamp < new Date().getTime() ){
                // no item in cache or cache has expired
                // use getter to get data, save to cache, and return
                var getterPromise = getter();
                $.when(getterPromise).done(function(fetchedValue){
                    if(typeof data.cache === 'undefined'){
                        data.cache = {};
                    }
                    data.cache[key] = constructCacheItem({
                        value: fetchedValue,
                        cacheMinutes: cacheMinutes
                    });
                    chrome.storage.local.set(data);
                    deferred.resolve(fetchedValue);
                });
            } else{
                // item is in cache
                // return cached value
                deferred.resolve(cacheItem.value);
            }
        });
        return deferred;
    };

    // when called, removes all cached items
    cache.clear = function(){
        chrome.storage.local.clear();
    };

    // returns deferred
    // This method similar to the .get method, but is used if cache delay is not acceptable.
    // It uses a last_updated timestamp on the firebase source to determine to either fetch
    // or use cached value. This method returns the cached data immediately, and if it senses
    // that the remote has updated recently, updates the cache to reflect the remote
    // uid - current user's id
    // key - arbitrary string used as key to chrome cache and firebase store used to store last_updated
    // getter - a method to get the most recent item

    // the setter must use cache too
    cache.get_recent = function(uid, key, getter){
        var deferred = $.Deferred();
        chrome.storage.local.get(cacheKey, function(data){
            var cacheItem = (typeof data === 'undefined' || typeof data.cache === 'undefined' || typeof data.cache[key] === 'undefined') ? false : data.cache[key];
            if( !cacheItem || typeof cacheItem.value === 'undefined' ){
                // item was not found in cache
                // use getter to get data, save to cache, and return
                var getterPromise = getter();
                $.when(getterPromise).done(function(fetchedValue){
                    if(typeof data.cache === 'undefined'){
                        data.cache = {};
                    }
                    data.cache[key] = constructCacheItem({
                        value: fetchedValue
                    });
                    chrome.storage.local.set(data);
                    deferred.resolve(fetchedValue);
                });
            } else{
                // item found in cache

                // resolve with cached item
                deferred.resolve(cacheItem.value);

                // check last updated on firebase for cases:
                // 1. last_updated does not exist - do nothing
                // 2. last_updated is behind cache's last updated - do nothing
                // 3. last_updated is ahead of cache's last updated - pull data from remote, save in cache
                // and update cache's last_updated to match store's last_updated
                var cache_last_updated = cacheItem.lastUpdated;
                var last_updated_store = new Firebase(LDR.AppView.STORE_URL + 'cache/last_updated/' + uid);
                last_updated_store.once('value', function(snapshot){
                    var last_updated_data = snapshot.val();
                    var firebase_last_updated;
                    if(last_updated_data && typeof last_updated_data === 'object'){
                        firebase_last_updated = last_updated_data[key];
                    }
                    if(typeof firebase_last_updated === 'undefined'){
                        // 1. last_updated does not exist
                    } else if(firebase_last_updated <= cache_last_updated){
                        // 2. last_updated is behind cache's last updated
                    } else{
                        // 3. last_updated is ahead of cache's last updated
                        // pull data from remote, save in cache, and update cache's last_update to match store's last_updated
                        var getterPromise = getter();
                        $.when(getterPromise).done(function(fetchedValue){
                            var data = {};
                            data.cache = {};
                            data.cache[key] = constructCacheItem({
                                value: fetchedValue,
                                lastUpdated: firebase_last_updated
                            });
                            chrome.storage.local.set(data);
                        });
                    }
                });
            }
        });
        return deferred;
    };

    // save the record as usual, AND
    // set both chrome and firebase last_updated for a given key
    cache.set_recent = function(uid, key, getter){
        // use getter to get data, save to cache, and return
        var deferred = $.Deferred();
        var getterPromise = getter();
        $.when(getterPromise).done(function(fetchedValue){
            var lastUpdated = new Date().getTime();
            var data = {cache: {}};
            data.cache[key] = constructCacheItem({
                value: fetchedValue,
                lastUpdated: lastUpdated
            });
            chrome.storage.local.set(data);

            var last_updated_store = new Firebase(LDR.AppView.STORE_URL + 'cache/last_updated/' + uid);
            var obj_to_store = {};
            obj_to_store[key] = data.cache[key].lastUpdated;
            last_updated_store.set(obj_to_store);

            deferred.resolve(fetchedValue);
        });
        return deferred;
    };

    return cache;
}());