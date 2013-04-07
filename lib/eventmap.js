/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, _: false, Backbone: false, window:false */
 
/**
 * @description EventMap namespace.
 * @name EventMap
 * @type Object
 * @namespace
 */
define(function (require, exports, module) {
    "use strict";
    
	/**
     * @memberOf EventMap
     */
    var publish = function publish(event) {
        $(this).trigger(event);
    };

	/**
     * @memberOf EventMap
     */
    var subscribe = function (event, fn) {
        $(this).on(event, fn);
    };

	/**
     * @memberOf EventMap
     */
    var unsubscribe = function (event, fn) {
        $(this).off(event, fn);
    };

    // Exports
    exports.unsubscribe = unsubscribe;
    exports.subscribe = subscribe;
    exports.publish = publish;
});
