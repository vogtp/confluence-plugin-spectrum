/**
 * A simple cache manager that supports a
 * FIFO cache invalidation strategy.
 *
 * @class cacheManager
 * @namespace AJS.Confluence
 * @constructor
 * @param cacheSize the size of the cache before keys are invalidated
 */
AJS.Confluence.cacheManager = function (cacheSize) {
    var cache = {},
        cacheStack = [],
        cacheSize = cacheSize || 30;

    return {
        /**
         * Return the value stored in the cache for the given key
         * @method get
         * @param key {String}
         */
        get: function(key) {
            return cache[key];
        },
        /**
         * Put the given key, value in the cache
         * @method put
         * @param key {String}
         * @param value {Object}
         */
        put: function(key, value) {
            cache[key] = value;
            cacheStack.push(key);
            if (cacheStack.length > cacheSize) {
                delete cache[cacheStack.shift()];
            }
        },
        /**
         * Clear the cache.
         */
        clear : function() {
            cache = {};
            cacheStack = [];
        }
    };
};
