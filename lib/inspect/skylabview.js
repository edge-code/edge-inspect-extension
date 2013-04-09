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
/*global define: false, $: false, _: false, saveAs: false, Backbone: false */
/*global reflowShell: false */
define(function (require, exports, module) {
    "use strict";

    var EdgeInspect = require('lib/inspect/skylab'),
        EventMap = require('lib/eventmap'),
        SkyLabController = EdgeInspect.SkyLabController,
        SkyLabView = EdgeInspect.SkyLabView;
    
    var $inspect;

    function followOrRemoteInspect(event, url) {
        if (SkyLabView.shouldFollowThisUrl(url)) {
            console.log(url);
            SkyLabController.followUrl('http://10.1.0.178:51740/' + url, [], "false");
        }
    }
    // Function to poll the URL bar for changes.
    function watchForURLChange() {
        $inspect.on('Inspect:urlchange', followOrRemoteInspect);
    }

    // Used to keep my connection alive to the device manager.
    function pingDeviceManager() {
        SkyLabController.pingDeviceManager();
    }

    function attachTabWatchers() {
        watchForURLChange();
    }

    function detachTabWatchers() {
    }

    function initializeExtension() {
        // Open the connection to the DM
        SkyLabController.connectToDeviceManager();
        SkyLabController.setUrl('http://10.1.0.178:51740/');

        setInterval(pingDeviceManager, 20000);
    }

    // Before we begin we have to prototype some methods into SkyLabView
    // Generic method for how we handle toast like notifications that go away on their own.
    SkyLabView.toast = function (content) {
        console.log("Toast " + content);
        // Revisit toast messages when the WebKit bugs are worked out.
//        var toast = webkitNotifications.createNotification("shadow_beta_48.png", "Edge Inspect", content);
//        toast.show();
        return;
    };

    // Generic method for how we handle toast like notifications that we persist until we cancel.
    SkyLabView.toastWithHandle = function () {
        SkyLabView.closeToastWithHandle();
//        SkyLabView._toasthandle = webkitNotifications.createHTMLNotification('notification.html');
//        SkyLabView._toasthandle.show();
        return;
    };

    SkyLabView.closeToastWithHandle = function () {
        if (SkyLabView._toasthandle !== "") {
            SkyLabView._toasthandle.cancel();
            SkyLabView._toasthandle = "";
        }
        return;
    };

    SkyLabView.openRemoteInspection = function (id, server) {

    };

    SkyLabView.openSurvey = function () {

    };

    SkyLabView.setBadgeState = function (state) {
        $(SkyLabController).trigger({type: "badge.state", state: state});
    };

    SkyLabView.triggerFollowModeOn = function () {
        attachTabWatchers();
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "on"});
        }
    };

    SkyLabView.triggerFollowModeOff = function () {
        detachTabWatchers();
        if (SkyLabController.isDeviceManagerAlive()) {
            $(SkyLabController).trigger({type: "followmode.popup", mode: "off"});
        }
    };

    SkyLabView.triggerDeviceDisconnected = function () {
        SkyLabView.setBadgeState("-");
        setTimeout(function () { SkyLabView.setBadgeState(""); }, 5000);
    };

    SkyLabView.triggerDeviceWantsToPair = function () {
        SkyLabView.setBadgeState("+");
    };

    SkyLabView.triggerNowPairingDismiss = function () {
        SkyLabView.closeToastWithHandle();
        SkyLabView.setBadgeState("");
    };

    SkyLabView.setBadgeIcon = function (icon) {

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

    SkyLabView.triggerFollowUrl = function () {

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

    SkyLabView.triggerShowNameChange = function () {

    };

    SkyLabView.triggerPreferencesUpdated = function () {
        $(SkyLabController).trigger({type: "screenshotfolder.options", folder: SkyLabController.getScreenshotFolder()});
    };

    SkyLabView.triggerScreenshotFolderError = function (msg) {
        $(SkyLabController).trigger({type: "screenshotfoldererror.options", message: msg});
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

    SkyLabView.shouldFollowThisUrl = function (url) {
        return (url !== SkyLabController.getSurveyLink());
    };

    SkyLabView.restoreRemoteInspectionWeAreStillDoingThat = function () {

    };

    function initialize() {
        $inspect = $("#inspect");
        SkyLabController.triggerFirstRunCheck();
        initializeExtension();
    }

    exports.initialize = initialize;
});

