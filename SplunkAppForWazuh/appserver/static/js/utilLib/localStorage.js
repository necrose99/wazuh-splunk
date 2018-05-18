/*
 * Wazuh app - Splunk services factory
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

define(function (require, exports, module) {
  /**
   * Encapsulates Local Storage service functionality
   */
  const localStorage = class LocalStorage {
    constructor() {
      this.storage = window.localStorage
    }

    /**
     * Sets a value for a key
     * @param {String} key 
     * @param {String} value 
     */
    set(key,value) {
      this.storage.setItem(key,value)
    }

    /**
     * Obtains the value for a key
     * @param {String} key 
     */
    get(key) {
      return this.storage.getItem(key)
    }

    /**
     * Removes values for a key
     * @param {String} key 
     */
    clear(key) {
      this.set(key,'')
    }
  }

  // Return class
  return localStorage
})