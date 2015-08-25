if(typeof LDR === 'undefined'){
    LDR = {};
}

LDR.Cache = (function(){
    var cache = {};
    var cacheKey = 'cache';

    // returns deferred
    // resolved by either getting from chrome cache if cache is expired
    // or calling the getter if cache is expired, and resetting the cache
    // cache items are { value: 'thing being stored', expiresTimestamp: 123 }
    cache.get = function(key, cacheMinutes, getter){
        var deferred = $.Deferred();
        chrome.storage.local.get(cacheKey, function(data) {
            var cacheItem = (typeof data === 'undefined' || typeof data.cache === 'undefined' || typeof data.cache[key] === 'undefined') ? false : data.cache[key];
            if( !cacheItem || typeof cacheItem.value === 'undefined' || cacheItem.expiresTimestamp < new Date().getTime() ){
                // use getter to get data, save to cache, and return
                var getterPromise = getter();
                $.when(getterPromise).done(function(fetchedValue){
                    var newCacheItem = {};
                    newCacheItem[key] = {
                        value: fetchedValue,
                        expiresTimestamp: new Date().getTime() + cacheMinutes * 60 * 1000
                    };
                    chrome.storage.local.set(newCacheItem);
                    deferred.resolve(fetchedValue);
                });
            } else{
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

    return cache;
}());