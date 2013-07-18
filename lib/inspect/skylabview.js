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
 *
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false, _: false, brackets : false */
define(function (require, exports, module) {
    "use strict";

    var EdgeInspect = require('lib/inspect/skylab'),
        SkyLabController = EdgeInspect.SkyLabController,
        SkyLabView = EdgeInspect.SkyLabView;
    
    SkyLabView.setBadgeIcon = function () {

    };

    SkyLabView.triggerFollowModeOn = function () {
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "on"});
        }
    };

    SkyLabView.triggerFollowModeOff = function () {
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "off"});
        }
    };

    SkyLabView.triggerFollowUrl = function () {
        // This must be overloaded by the browser specific code
    };

    SkyLabView.triggerPasscodeInvalid = function (devices) {
        $(SkyLabController).trigger({type: "passcode_invalid.popup", devices: devices});
    };

    SkyLabView.triggerShowHostInfo = function () {
        $(SkyLabController).trigger({type: "host_info.popup"});
    };

    SkyLabView.transferComplete = function (reqID) {
        SkyLabController.setNewScreenshotsFlag();
        $(SkyLabController).trigger({type: "transfer_complete.popup"});
    };

    SkyLabView.triggerFirstRunCheck = function () {
        if (SkyLabController.firstRun()) {
            SkyLabController.setShowedFirstRun();
        }
    };

    SkyLabView.triggerPreferencesUpdated = function () {
        $(SkyLabController).trigger({type: "screenshotfolder.options", folder: SkyLabController.getScreenshotFolder()});
    };

    SkyLabView.triggerScreenshotFolderError = function (msg) {
        $(SkyLabController).trigger({type: "screenshotfoldererror.options", message: msg});
    };

    SkyLabView.getSurveyLink = function () {
        return this._surveyLink;
    };

    SkyLabView.shouldFollowThisUrl = function () {
        SkyLabView.shouldFollowThisUrl = function (url) {
            return (url !== SkyLabController.getSurveyLink());
        };
    };

    SkyLabView.openSurvey = function () {
        var surveyURL = "http://survey.omniture.com/d1/hosted/9fa80394e3";
        brackets.app.openURLInDefaultBrowser(surveyURL);
    };

    SkyLabView.triggerDeviceDisconnected = function () {

    };

    SkyLabView.triggerDeviceWantsToPair = function () {
        
    };

    SkyLabView.triggerNowPairingDismiss = function () {

    };

    SkyLabView.triggerDeviceListUpdated = function () {
        $(SkyLabController).trigger({type: "refresh.popup"});
    };

    SkyLabView.triggerDeviceManagerError = function () {
        $(SkyLabController).trigger({type: "appstate.popup", state: "dmerror"});
    };

    SkyLabView.triggerDeviceManagerConnecting = function () {
    };

    SkyLabView.triggerRemoteInspect = function (devices, server) {

    };

    SkyLabView.triggerShowNameChange = function () {

    };

    SkyLabView.triggerSubscriptionHasExpiredMessage = function () {
        $(SkyLabController).trigger({type: "subscriptionexpired.popup"});
    };

    SkyLabView.triggerDevicesArePremium = function () {
        $(SkyLabController).trigger({type: "premiumdevices.popup"});
    };

    SkyLabView.triggerScreenshotsArePremium = function () {
        $(SkyLabController).trigger({type: "premiumscreenshots.popup"});
    };

    SkyLabView.triggerStopShowingBuyMessage = function () {
        $(SkyLabController).trigger({type: "hidebuy.popup"});
    };

    SkyLabView.triggerShowBuyMessage = function () {
        $(SkyLabController).trigger({type: "showbuy.popup"});
    };
    
    SkyLabView.closeToastWithHandle = function () {
        
    };
    
    SkyLabView.trackEvent = function (eventDescription) {
        var s_account   = "mxskylab",
            channel     = "Shadow",
            pageName    = "Edge Code",
            server      = "Adobe Shadow",
            prop32      = "en-us",
            imgstr      = "http://stats.adobe.com/b/" +
                               "ss/" + encodeURIComponent(s_account) +
                               "/1/H.24--NS/" + Math.floor(Math.random() * 10000000) +
                               "?pe=lnk_o" +
                               "&ch=" + encodeURIComponent(channel) +
                               "&pageName=" + encodeURIComponent(pageName) +
                               "&pev2=" + encodeURIComponent(eventDescription) +
                               "&server=" + encodeURIComponent(server) +
                               "&c32=" + encodeURIComponent(prop32);
        $.ajax({
            url: imgstr,
            timeout: 5000
        });
    };
    
    function initialize() {
        SkyLabController.triggerFirstRunCheck();
        SkyLabController.connectToDeviceManager();
        setInterval(function () {
            SkyLabController.pingDeviceManager();
        }, 20000);
    }

    exports.initialize = initialize;
});

