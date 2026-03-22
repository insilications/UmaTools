(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LazyLoader = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LOAD_TIMEOUT_MS = 30000;
  var RETRY_ATTEMPTS = 2;
  var RETRY_DELAY_MS = 1000;

  /**
   * LazyLoader - Utility for lazy loading JavaScript modules with dynamic imports
   * Supports both ES modules and traditional script loading
   */
  function LazyLoader() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadedModules = new Set();
  }

  /**
   * Load a single JavaScript module dynamically
   * @param {string} url - URL of the module to load
   * @param {Object} options - Loading options
   * @param {boolean} options.cache - Whether to cache the module (default: true)
   * @param {boolean} options.async - Whether to load async (default: true)
   * @param {boolean} options.module - Whether to load as ES module (default: auto-detect)
   * @param {number} options.timeout - Load timeout in ms (default: 30000)
   * @param {number} options.retries - Number of retry attempts (default: 2)
   * @returns {Promise} Promise that resolves when module is loaded
   */
  LazyLoader.prototype.load = function (url, options) {
    if (!url || typeof url !== 'string') {
      return Promise.reject(new Error('LazyLoader.load requires a valid URL'));
    }

    var opts = options || {};
    var cache = opts.cache !== false;
    var timeout = opts.timeout || LOAD_TIMEOUT_MS;
    var retries = opts.retries !== undefined ? opts.retries : RETRY_ATTEMPTS;

    // Return cached module if available
    if (cache && this.loadedModules.has(url)) {
      return Promise.resolve(this.loadedModules.get(url));
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    var self = this;
    var loadPromise = this._loadWithRetry(url, opts, retries, timeout).then(
      function (module) {
        if (cache) {
          self.loadedModules.set(url, module);
        }
        self.loadingPromises.delete(url);
        return module;
      },
      function (error) {
        self.loadingPromises.delete(url);
        throw error;
      }
    );

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  };

  /**
   * Load with retry logic
   * @private
   */
  LazyLoader.prototype._loadWithRetry = function (url, opts, retries, timeout) {
    var self = this;
    return this._loadModule(url, opts, timeout).catch(function (error) {
      if (retries > 0) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve(self._loadWithRetry(url, opts, retries - 1, timeout));
          }, RETRY_DELAY_MS);
        });
      }
      throw error;
    });
  };

  /**
   * Internal module loading implementation
   * @private
   */
  LazyLoader.prototype._loadModule = function (url, opts, timeout) {
    var isModule = this._shouldLoadAsModule(url, opts);

    if (isModule && this._supportsImport()) {
      return this._loadViaImport(url, timeout);
    } else {
      return this._loadViaScript(url, opts, timeout);
    }
  };

  /**
   * Check if URL should be loaded as ES module
   * @private
   */
  LazyLoader.prototype._shouldLoadAsModule = function (url, opts) {
    if (opts.module !== undefined) {
      return opts.module;
    }
    // Auto-detect based on file extension
    return url.endsWith('.mjs') || url.includes('type=module');
  };

  /**
   * Check if dynamic import is supported
   * @private
   */
  LazyLoader.prototype._supportsImport = function () {
    try {
      return typeof importScripts === 'function' || 'import' in Function.prototype;
    } catch (e) {
      return false;
    }
  };

  /**
   * Load module using dynamic import()
   * @private
   */
  LazyLoader.prototype._loadViaImport = function (url, timeout) {
    var timeoutId;
    var timeoutPromise = new Promise(function (_, reject) {
      timeoutId = setTimeout(function () {
        reject(new Error('Module load timeout: ' + url));
      }, timeout);
    });

    var importPromise = import(url).then(function (module) {
      clearTimeout(timeoutId);
      return module;
    });

    return Promise.race([importPromise, timeoutPromise]);
  };

  /**
   * Load script using script tag injection
   * @private
   */
  LazyLoader.prototype._loadViaScript = function (url, opts, timeout) {
    var async = opts.async !== false;

    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') {
        return reject(new Error('Script loading requires browser environment'));
      }

      var script = document.createElement('script');
      script.src = url;
      script.async = async;

      if (opts.module) {
        script.type = 'module';
      }

      var timeoutId = setTimeout(function () {
        cleanup();
        reject(new Error('Script load timeout: ' + url));
      }, timeout);

      function cleanup() {
        clearTimeout(timeoutId);
        script.onload = null;
        script.onerror = null;
      }

      script.onload = function () {
        cleanup();
        resolve({ url: url, loaded: true });
      };

      script.onerror = function () {
        cleanup();
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error('Failed to load script: ' + url));
      };

      document.head.appendChild(script);
    });
  };

  /**
   * Load multiple modules in parallel
   * @param {Array<string>} urls - Array of module URLs to load
   * @param {Object} options - Loading options (same as load())
   * @returns {Promise<Array>} Promise that resolves with array of loaded modules
   */
  LazyLoader.prototype.loadMultiple = function (urls, options) {
    if (!Array.isArray(urls)) {
      return Promise.reject(new Error('loadMultiple requires an array of URLs'));
    }

    var self = this;
    var loadPromises = urls.map(function (url) {
      return self.load(url, options);
    });

    return Promise.all(loadPromises);
  };

  /**
   * Preload a module without executing (if supported by browser)
   * @param {string} url - URL of the module to preload
   * @param {Object} options - Preload options
   * @param {boolean} options.module - Whether this is an ES module
   * @returns {Promise} Promise that resolves when preload link is added
   */
  LazyLoader.prototype.preload = function (url, options) {
    if (!url || typeof url !== 'string') {
      return Promise.reject(new Error('preload requires a valid URL'));
    }

    if (this.preloadedModules.has(url)) {
      return Promise.resolve();
    }

    var self = this;
    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') {
        return reject(new Error('Preloading requires browser environment'));
      }

      var link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = url;

      if (options && options.module === false) {
        link.rel = 'preload';
        link.as = 'script';
      }

      link.onload = function () {
        self.preloadedModules.add(url);
        resolve();
      };

      link.onerror = function () {
        reject(new Error('Failed to preload: ' + url));
      };

      document.head.appendChild(link);
    });
  };

  /**
   * Preload multiple modules
   * @param {Array<string>} urls - Array of URLs to preload
   * @param {Object} options - Preload options
   * @returns {Promise<Array>} Promise that resolves when all preloads complete
   */
  LazyLoader.prototype.preloadMultiple = function (urls, options) {
    if (!Array.isArray(urls)) {
      return Promise.reject(new Error('preloadMultiple requires an array of URLs'));
    }

    var self = this;
    var preloadPromises = urls.map(function (url) {
      return self.preload(url, options);
    });

    return Promise.all(preloadPromises);
  };

  /**
   * Check if a module is already loaded
   * @param {string} url - URL to check
   * @returns {boolean} True if module is loaded
   */
  LazyLoader.prototype.isLoaded = function (url) {
    return this.loadedModules.has(url);
  };

  /**
   * Check if a module is currently loading
   * @param {string} url - URL to check
   * @returns {boolean} True if module is loading
   */
  LazyLoader.prototype.isLoading = function (url) {
    return this.loadingPromises.has(url);
  };

  /**
   * Clear the module cache
   * @param {string} url - Optional specific URL to clear, or clear all if omitted
   */
  LazyLoader.prototype.clearCache = function (url) {
    if (url) {
      this.loadedModules.delete(url);
      this.preloadedModules.delete(url);
    } else {
      this.loadedModules.clear();
      this.preloadedModules.clear();
    }
  };

  /**
   * Get stats about loaded modules
   * @returns {Object} Object with loaded, loading, and preloaded counts
   */
  LazyLoader.prototype.getStats = function () {
    return {
      loaded: this.loadedModules.size,
      loading: this.loadingPromises.size,
      preloaded: this.preloadedModules.size
    };
  };

  // Create singleton instance for convenience
  var defaultInstance = new LazyLoader();

  // Export both constructor and singleton
  LazyLoader.default = defaultInstance;

  return LazyLoader;
});
