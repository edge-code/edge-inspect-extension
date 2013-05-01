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
        console.log("setBadgeIcon");
    };

    SkyLabView.triggerFollowModeOn = function () {
        console.log("triggerFollowModeOn");
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "on"});
        }
    };

    SkyLabView.triggerFollowModeOff = function () {
        console.log("triggerFollowModeOff");
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "off"});
        }
    };

    SkyLabView.triggerFollowUrl = function () {
        console.log("triggerFollowUrl");
        // This must be overloaded by the browser specific code
    };

    SkyLabView.triggerPasscodeInvalid = function (devices) {
        console.log("triggerPasscodeInvalid");
        $(SkyLabController).trigger({type: "passcode_invalid.popup", devices: devices});
    };

    SkyLabView.triggerShowHostInfo = function () {
        console.log("triggerShowHostInfo");
        $(SkyLabController).trigger({type: "host_info.popup"});
    };

    SkyLabView.transferComplete = function (reqID) {
        console.log("transferComplete");
        SkyLabController.setNewScreenshotsFlag();
        $(SkyLabController).trigger({type: "transfer_complete.popup"});
    };

    SkyLabView.triggerFirstRunCheck = function () {
        console.log("triggerFirstRunCheck");
        if (SkyLabController.firstRun()) {
            SkyLabController.setShowedFirstRun();
        }
    };

    SkyLabView.triggerPreferencesUpdated = function () {
        console.log("triggerPreferencesUpdated");
        $(SkyLabController).trigger({type: "screenshotfolder.options", folder: SkyLabController.getScreenshotFolder()});
    };

    SkyLabView.triggerScreenshotFolderError = function (msg) {
        console.log("triggerScreenshotFolderError");
        $(SkyLabController).trigger({type: "screenshotfoldererror.options", message: msg});
    };

    SkyLabView.getSurveyLink = function () {
        console.log("getSurveyLink");
        return this._surveyLink;
    };

    SkyLabView.shouldFollowThisUrl = function () {
        console.log("shouldFollowThisUrl");
        SkyLabView.shouldFollowThisUrl = function (url) {
            return (url !== SkyLabController.getSurveyLink());
        };
    };

    SkyLabView.openSurvey = function () {
        console.log("openSurvey");
        var surveyURL = "http://survey.omniture.com/d1/hosted/9fa80394e3";
        brackets.app.openURLInDefaultBrowser(function () {}, surveyURL);
    };

    SkyLabView.triggerDeviceDisconnected = function () {
        console.log("triggerDeviceDisconnected");
    };

    SkyLabView.triggerDeviceWantsToPair = function () {
        console.log("triggerDeviceWantsToPair");
    };

    SkyLabView.triggerNowPairingDismiss = function () {
        console.log("triggerNowPairingDismiss");
    };

    SkyLabView.triggerDeviceListUpdated = function () {
        console.log("triggerDeviceListUpdated");
        $(SkyLabController).trigger({type: "refresh.popup"});
    };

    SkyLabView.triggerDeviceManagerError = function () {
        console.log("triggerDeviceManagerError");
        $(SkyLabController).trigger({type: "appstate.popup", state: "dmerror"});
    };
    
    SkyLabView.triggerDeviceManagerAuthFail = function () {
        console.log("triggerDeviceManagerAuthFail");
    };

    SkyLabView.triggerDeviceManagerConnecting = function () {
        console.log("triggerDeviceManagerConnecting");
    };

    SkyLabView.triggerRemoteInspect = function (devices, server) {
        console.log("triggerRemoteInspect");
    };

    SkyLabView.triggerShowNameChange = function () {
        console.log("triggerShowNameChange");
    };

    SkyLabView.triggerSubscriptionHasExpiredMessage = function () {
        console.log("triggerSubscriptionHasExpiredMessage");
        $(SkyLabController).trigger({type: "subscriptionexpired.popup"});
    };

    SkyLabView.triggerDevicesArePremium = function () {
        console.log("triggerDevicesArePremium");
        $(SkyLabController).trigger({type: "premiumdevices.popup"});
    };

    SkyLabView.triggerScreenshotsArePremium = function () {
        console.log("triggerScreenshotsArePremium");
        $(SkyLabController).trigger({type: "premiumscreenshots.popup"});
    };

    SkyLabView.triggerStopShowingBuyMessage = function () {
        console.log("triggerStopShowingBuyMessage");
        $(SkyLabController).trigger({type: "hidebuy.popup"});
    };

    SkyLabView.triggerShowBuyMessage = function () {
        console.log("triggerShowBuyMessage");
        $(SkyLabController).trigger({type: "showbuy.popup"});
    };
    
    SkyLabView.closeToastWithHandle = function () {
        console.log("closeToastWithHandle");
    };
    
    SkyLabView.restoreRemoteInspectionWeAreStillDoingThat = function () {
        console.log("restoreRemoteInspection");
    };
    
    SkyLabView.getRemoteInspectionServer = function () {
        console.log("getRemoteInspectionServer");
    };
    
    SkyLabView.trackEvent = function (eventDescription) {
        var s_account   = "mxskylab",
            channel     = "Shadow",
            pageName    = "Shadow: Background",
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

