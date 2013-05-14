/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, brackets: false, $: false, _: false */

define(function (require, exports, module) {
    'use strict';

    var EdgeInspect = require('lib/inspect/skylab'),
        Strings;

    var ASLLocalizer = {
        // Localize all sub-elements, or the entire page if none are provided
        localize: function localize($element) {
            $element = $element || $(document);
            var self = this;

            $element.find('[data-l10n]').each(function (idx, element) {
                self.localizeElement($(element));
            });
        },

        localizeElement: function localizeElement($element) {
            var messageKey = $element.attr('data-l10n');
            if (messageKey) {
                var rawArgs = $element.attr('data-l10n-args');
                var messageArgs;
                if (rawArgs) {
                    messageArgs = JSON.parse(rawArgs);
                }
                var result = ""; //Strings["INSPECT_" + messageKey];

                if (messageArgs && messageArgs.length) {
                    result = result.replace('$arg1$', messageArgs[0]);
                }
                $element.html(result);
            }
        }
    };

    var SkyLabController = EdgeInspect.SkyLabController,
        SkyLabView = EdgeInspect.SkyLabView,
        isFocused = false,
        showingWelcome = false,
        deviceListLookup = {},
        pairingDeviceListLookup = {},
        unavailableDeviceListLookup = {},
        newDeviceListLookup = {},
        deviceList = [],
        pairingDeviceList = [],
        unavailableDeviceList = [],
        firstKeydown = false,
        $mainContainer = null;


    function getEdgeLocalized(str) {
        if (str === "@@ui_locale") {
            return brackets.getLocale();
        }
        return Strings["INSPECT_" + str];
    }

    function flushDeviceLists() {
        $mainContainer.find("#removedevices").children(".hl").remove();
        $mainContainer.find("#removeconnected").children(".hl").remove();
        $mainContainer.find("#pairingdevices").children(".hl").remove();
        $mainContainer.find("#connecteddevices").children(".hl").remove();
    }

    function toggleDeviceWidgets(state) {
        if (SkyLabController.getFollowMode() === 'off') {
            state = 'off';
        }
        if (SkyLabController.getDeviceList().length === 0) {
            state = 'off';
        }
        if (state === 'off') {
            $mainContainer.find('#screenshot').attr('disabled', 'disabled');
            $mainContainer.find('#forcerefresh').attr('disabled', 'disabled');
            $mainContainer.find('#togglechrome').attr('disabled', 'disabled');
        } else {
            $mainContainer.find('#screenshot').removeAttr('disabled');
            $mainContainer.find('#forcerefresh').removeAttr('disabled');
            $mainContainer.find('#togglechrome').removeAttr('disabled');
        }
    }

    function hideWaitingAndSyncBrowsingOff() {
        $mainContainer.find('#waitingdiv').hide();
        $mainContainer.find('#syncbrowseoff').hide();
        if (EdgeInspect.SkyLab.getShowBuyItNow()) {
            $mainContainer.find('#buyitnowwrapper').show();
        } else {
            $mainContainer.find('#buyitnowwrapper').hide();
        }
    }

    function showWaitingOrSyncBrowseOff() {
        if (SkyLabController.isDeviceManagerAlive()) {
            $mainContainer.find("#dmerror").hide();
            if (SkyLabController.getFollowMode() === "off") {
                $mainContainer.find('#syncbrowseoff').show();
                $mainContainer.find('#waitingdiv').hide();
                if (EdgeInspect.SkyLab.getShowBuyItNow()) {
                    $mainContainer.find('#buyitnowwrapper').show();
                } else {
                    $mainContainer.find('#buyitnowwrapper').hide();
                }
            } else {
                $mainContainer.find('#syncbrowseoff').hide();
                if (deviceList.length === 0 && pairingDeviceList.length === 0) {
                    $mainContainer.find('#waitingdiv').show();
                } else {
                    $mainContainer.find('#waitingdiv').hide();
                }
            }
        } else {
            hideWaitingAndSyncBrowsingOff();
            $mainContainer.find("#dmerror").show();
        }
    }

    function setToggleModeImage() {
        
        // TODO: reduce the code here.  Use "disabled" more intelligently
        $mainContainer.find("#inspectToggle").removeAttr('disabled');

        if (SkyLabController.getFollowMode() === "on") {
            if (SkyLabController.isDeviceManagerAlive()) {
                $mainContainer.find("#inspectToggle").attr("class", "toggleon");
                $mainContainer.find("#inspectToggle").attr("title", getEdgeLocalized("browsingon_tt"));
                $mainContainer.find('#screenshotfolder').removeAttr('disabled');
                toggleDeviceWidgets('on');
            } else {
                $mainContainer.find("#inspectToggle").attr("class", "toggleon");
                $mainContainer.find("#inspectToggle").attr("title", getEdgeLocalized("browsingtooltipNoDM_tt"));
                $mainContainer.find('#screenshotfolder').attr('disabled', 'disabled');
                toggleDeviceWidgets('off');
            }
        } else {
            if (SkyLabController.isDeviceManagerAlive()) {
                $mainContainer.find("#inspectToggle").attr("class", "toggleoff");
                $mainContainer.find("#inspectToggle").attr("title", getEdgeLocalized("browsingoff_tt"));
            } else {
                $mainContainer.find("#inspectToggle").attr("class", "toggleoff");
                $mainContainer.find("#inspectToggle").attr("disabled", "disabled");
                $mainContainer.find("#inspectToggle").attr("title", getEdgeLocalized("browsingtooltipNoDM_tt"));
                $mainContainer.find('#screenshotfolder').attr('disabled', 'disabled');
            }
            toggleDeviceWidgets('off');
        }
        showWaitingOrSyncBrowseOff();
    }


    function setFullScreenImage() {
        if (EdgeInspect.isFullScreen === true) {
            $mainContainer.find('#togglechrome').attr('title', getEdgeLocalized("showchrome_tt"));
            $mainContainer.find('#togglechrome').removeClass('fullon');
            $mainContainer.find('#togglechrome').addClass('fulloff');
        } else {
            $mainContainer.find('#togglechrome').removeClass('fulloff');
            $mainContainer.find('#togglechrome').addClass('fullon');
            $mainContainer.find('#togglechrome').attr('title', getEdgeLocalized("fullscreen_tt"));
        }
    }


    function shouldShowWelcomeMessage() {
        // We want to make sure the message is persistent until
        // the user has succesfully connnected to an updated version of DM.
        //return false;
        return SkyLabController.shouldShowWelcomeMessage();
    }

    function showWelcomeMessage() {
        var i = 0,
            removeMessage = '',
            showme = SkyLabController.showWhichMessage(),
            showWhatDivForMessage = {
                survey: 'periodicsurveywrapper',
                renew: 'subscriptionexpiredwrapper',
                premiumscreenshots: 'screenshotsarepremiumwrapper',
                premiumdevices: 'seconddeviceispremiumwrapper',
                buyitnow: 'buyitnowwrapper'
            };

        if (showme.length > 0) {
            //$mainContainer.find("#periodicsurveywrapper").hide();
            $mainContainer.find("#subscriptionexpiredwrapper").hide();
            $mainContainer.find("#screenshotsarepremiumwrapper").hide();
            $mainContainer.find("#seconddeviceispremiumwrapper").hide();
            $mainContainer.find("#buyitnowwrapper").hide();
            while (i < showme.length) {
                $mainContainer.find('#' + showWhatDivForMessage[showme[i]]).show();
                $mainContainer.find("#shadmessage").show();
                $mainContainer.find('#' + showWhatDivForMessage[showme[i]] + '-remove').off('click');
                $mainContainer.find('#' + showWhatDivForMessage[showme[i]] + '-remove').on('click', function (ev) {
                    removeMessage = this.parentNode.id;
                    $mainContainer.find('#' + removeMessage).hide();
                    $.each(showWhatDivForMessage, function (index, value) {
                        if (value === removeMessage) {
                            SkyLabController.stopShowingMessage(index);
                        }
                    });
                });
                i += 1;
            }
            $mainContainer.trigger("Inspect:redraw");

        }
    }

    function showDeviceManagerError() {
        flushDeviceLists();
        $mainContainer.find("#welcomeDiv").hide();
        $mainContainer.find("#machineinfoheader").show();

        // show the widgets at the bottom
        $mainContainer.find("#screenshot").show();
        $mainContainer.find("#forcerefresh").show();
        $mainContainer.find("#togglechrome").show();
        $mainContainer.find("#screenshotfolder").show();

        hideWaitingAndSyncBrowsingOff();
        $mainContainer.find("#dmexpired").hide();
        $mainContainer.find("#dmerror").show();
        setToggleModeImage();
        $mainContainer.find("#removeback").click();
    }

    function showDeviceManagerExpired() {
        flushDeviceLists();
        $mainContainer.find("#welcomeDiv").hide();
        $mainContainer.find("#machineinfoheader").show();

        // show the widgets at the bottom
        $mainContainer.find("#screenshot").show();
        $mainContainer.find("#forcerefresh").show();
        $mainContainer.find("#togglechrome").show();
        $mainContainer.find("#screenshotfolder").show();

        hideWaitingAndSyncBrowsingOff();
        $mainContainer.find("#dmerror").hide();
        $mainContainer.find("#dmexpired").show();
        setToggleModeImage();
        $mainContainer.find("#removeback").click();
    }

    function refreshDeviceList() {
        // TODO: Clone hidden divs in the dom and show them rather than building them on the fly in here.
        if (shouldShowWelcomeMessage()) {
            showWelcomeMessage();
            showingWelcome = true;
            return;
        }

        deviceList = SkyLabController.getDeviceList();
        pairingDeviceList = SkyLabController.getNowPairing();
        unavailableDeviceList = SkyLabController.getUnavailableDeviceList();
        if (deviceList.length === 0 && pairingDeviceList.length === 0 && unavailableDeviceList.length === 0) {
            toggleDeviceWidgets('off');
            $.each(deviceListLookup, function (index, value) {
                $mainContainer.find("#" + value.id).remove();
                $mainContainer.find("#remove" + value.id).remove();
                delete deviceListLookup[value.id];
            });
            $.each(pairingDeviceListLookup, function (index, value) {
                $mainContainer.find("#" + value.id).remove();
                $mainContainer.find("#remove" + value.id).remove();
                delete pairingDeviceListLookup[value.id];
            });
            $.each(unavailableDeviceListLookup, function (index, value) {
                $mainContainer.find("#" + value.id).remove();
                $mainContainer.find("#remove" + value.id).remove();
                delete unavailableDeviceListLookup[value.id];
            });
            if (SkyLabController.isDeviceManagerAlive()) {
                if (SkyLabController.isDeviceManagerValid()) {
                    $mainContainer.find("#dmexpired").hide();
                    showWaitingOrSyncBrowseOff();
                } else {
                    hideWaitingAndSyncBrowsingOff();
                    $mainContainer.find("#dmexpired").show();
                }
                $mainContainer.find("#dmerror").hide();
            } else {
                showDeviceManagerError();
            }
        } else {
            $mainContainer.find("#dmerror").hide();
            $mainContainer.find("#dmexpired").hide();
            $mainContainer.find("#devicelistfooter").show();
            if (deviceList.length !== 0) {
                hideWaitingAndSyncBrowsingOff();
                newDeviceListLookup = {};
                $.each(deviceList, function (index, value) {
                    var addAfter, addAfterRemove;
                    newDeviceListLookup[value.id] = value;
                    if (!deviceListLookup[value.id]) {
                        // push the device list into the lookup by id
                        deviceListLookup[value.id] = value;
                        if (pairingDeviceListLookup[value.id]) {
                            delete pairingDeviceListLookup[value.id];
                        }
                        if (unavailableDeviceListLookup[value.id]) {
                            delete unavailableDeviceListLookup[value.id];
                        }
                        $mainContainer.find("#" + value.id).remove();
                        $mainContainer.find("#remove" + value.id).remove();
                        addAfter = "#devicelistheader";
                        $mainContainer.find("#connecteddevices").children(".hl").each(function (domindex, domvalue) {
                            if ($mainContainer.find(this).children(".clearrow").children(".devicename").text().trim().toUpperCase() <  value.name.toUpperCase()) {
                                addAfter = "#" + domvalue.id;
                            }
                        });
                        // Clone a hidden template in the popup, and add it after the appropriate thing.
                        $mainContainer.find(addAfter).after($mainContainer.find("#connectedtemplate").clone().attr("id", value.id));
                        $mainContainer.find("#" + value.id + " .clearrow .devicebuttons .deviceeject").click(function (ev) {
                            SkyLabView.trackEvent("Eject Device");
                            SkyLabController.ejectDevice([value.id]);
                        });
                        $mainContainer.find("#" + value.id + " .clearrow .devicebuttons .deviceeject").attr('title', getEdgeLocalized("disconnect_tt"));
                        addAfterRemove = "#removeconnectedheader";
                        $mainContainer.find("#removeconnected").children("div").not(".message").each(function (domindex, domvalue) {
                            if ($mainContainer.find(this).children(".clearrow").first(".devicename").text().trim().toUpperCase() <  value.name.toUpperCase()) {
                                addAfterRemove = "#" + domvalue.id;
                            }
                        });

                        // Clone a hidden template in the popup, and add it after the appropriate thing.
                        $mainContainer.find(addAfterRemove).after($mainContainer.find("#removetemplate").clone().attr("id", "remove" + value.id));
                        $mainContainer.find("#" + value.id + " .clearrow .devicename").append(value.name);
                        $mainContainer.find("#" + value.id + " .clearrow .devicename").attr('title', value.name);
                        $mainContainer.find("#remove" + value.id + " div .devicename").append(value.name);
                        $mainContainer.find("#remove" + value.id + " div .devicename").attr('title', value.name);
                        $mainContainer.find("#remove" + value.id + " div .devicebuttons a").click(function (ev) {
                            SkyLabController.ejectDevice([value.id]);
                        });
                        $mainContainer.find("#remove" + value.id + " div .devicebuttons a").attr('title', getEdgeLocalized("disconnect_tt"));
                    }
                });
                // Drop anything left in the dropped lookup
                $.each(deviceListLookup, function (index, value) {
                    if (!newDeviceListLookup[value.id]) {
                        $mainContainer.find("#" + value.id).remove();
                        $mainContainer.find("#remove" + value.id).remove();
                        delete deviceListLookup[value.id];
                    }
                });
                toggleDeviceWidgets('on');
            } else {
                // Drop everything in the device lookup, there's nothing in the list
                $.each(deviceListLookup, function (index, value) {
                    $mainContainer.find("#" + value.id).remove();
                    $mainContainer.find("#remove" + value.id).remove();
                    delete deviceListLookup[value.id];
                });
                toggleDeviceWidgets('off');
            }
            if (pairingDeviceList.length !== 0) {
                hideWaitingAndSyncBrowsingOff();
                newDeviceListLookup = {};
                $.each(pairingDeviceList, function (index, value) {
                    newDeviceListLookup[value.id] = value;
                    if (!pairingDeviceListLookup[value.id]) {
                        // push the device list into the lookup by id
                        pairingDeviceListLookup[value.id] = value;
                        $mainContainer.find("#" + value.id).remove();
                        var addAfter = "#pairinglistheader";
                        $mainContainer.find("#pairingdevices").children(".hl").each(function (domindex, domvalue) {
                            if ($mainContainer.find(this).children(".clearrow").children("div").children(".pairingdevicename").text().trim().toUpperCase() <  value.name.toUpperCase()) {
                                addAfter = "#" + domvalue.id;
                            }
                        });
                        // Clone a hidden template in the popup, and add it after the appropriate thing.
                        $mainContainer.find(addAfter).after($mainContainer.find("#pairingtemplate").clone().attr("id", value.id));
                        // Set IDs for easy triggering.  If you change the layout, you need to update this.
                        // This can and should be done better.
                        $mainContainer.find("#" + value.id + " div div .passcodefield .passcodefield").attr("id", "passcode" + value.id);
                        $mainContainer.find("#" + value.id + " div div .passcodefield .passcodefield").attr("value", getEdgeLocalized("default_passcode"));
                        $mainContainer.find("#" + value.id + " div div .devicecheck").attr("id", "devicecheck" + value.id);
                        $mainContainer.find("#" + value.id + " div .devicecancel").attr("id", "devicecancel" + value.id);
                        $mainContainer.find("#" + value.id + " div div .pairingdevicename").append(value.name);
                        $mainContainer.find("#" + value.id + " div div .pairingdevicename").attr('title', value.name);
                        $mainContainer.find("#passcode" + value.id).click(function () {
                            $mainContainer.find("#passcode" + value.id).attr("value", "");
                        });
                        $mainContainer.find("#passcode" + value.id).keydown(function (event) {
                            if (event.keyCode === 13 || event.keyCode === 9) {
                                // Return or Tab, Respectively
                                $mainContainer.find("#devicecheck" + value.id).trigger("click");
                            } else if (firstKeydown === false) {
                                firstKeydown = true;
                                $mainContainer.find("#passcode" + value.id).attr("value", "");
                            }
                        });
                        $mainContainer.find("#passcode" + value.id).focus(function () {
                            isFocused = "#passcode" + value.id;
                        });
                        $mainContainer.find("#devicecheck" + value.id).click(function (ev) {
                            SkyLabView.trackEvent("Authorize Device");
                            SkyLabController.pairDevice($mainContainer.find("#passcode" + value.id).val(), value.id);
                        });
                        $mainContainer.find("#devicecancel" + value.id).click(function (ev) {
                            SkyLabController.cancelDevice(value.id);
                        });
                        $mainContainer.find("#devicecheck" + value.id).attr("title", getEdgeLocalized("authorize_tt"));
                        $mainContainer.find("#devicecancel" + value.id).attr("title", getEdgeLocalized("cancel_tt"));
                    }
                });
                // Drop anything left in the dropped lookup
                $.each(pairingDeviceListLookup, function (index, value) {
                    if (!newDeviceListLookup[value.id]) {
                        $mainContainer.find("#" + value.id).remove();
                        delete pairingDeviceListLookup[value.id];
                    }
                });
            } else {
                // Drop anything in the lookup, because there's nothing in a pairing state
                $.each(pairingDeviceListLookup, function (index, value) {
                    $mainContainer.find("#" + value.id).remove();
                    delete pairingDeviceListLookup[value.id];
                });
            }
            // Now that we're done mucking with the Pairing list, resolve focus
            if (!isFocused  || $mainContainer.find("#" + isFocused).length <= 0) {
                firstKeydown = false;
                $mainContainer.find("input.passcodefield:first").focus();
                isFocused = $mainContainer.find("input.passcodefield:first").attr("id");
            }
            if (deviceList.length === 0 && pairingDeviceList.length === 0) {
                if (SkyLabController.isDeviceManagerValid()) {
                    $mainContainer.find("#dmexpired").hide();
                    showWaitingOrSyncBrowseOff();
                } else {
                    hideWaitingAndSyncBrowsingOff();
                    $mainContainer.find("#dmexpired").show();
                }
            }
            if (unavailableDeviceList.length !== 0) {
                newDeviceListLookup = {};
                $.each(unavailableDeviceList, function (index, value) {
                    newDeviceListLookup[value.id] = value;
                    if (!unavailableDeviceListLookup[value.id]) {
                        // push the device list into the lookup by id
                        unavailableDeviceListLookup[value.id] = value;
                        $mainContainer.find("#remove" + value.id).remove();
                        var addAfterRemove = "#removelistheader";
                        $mainContainer.find("#removedevices").children(".hl").each(function (domindex, domvalue) {
                            if ($mainContainer.find(this).children(".clearrow").first(".devicename").text().trim().toUpperCase() <  value.name.toUpperCase()) {
                                addAfterRemove = "#" + domvalue.id;
                            }
                        });
                        $mainContainer.find(addAfterRemove).after($mainContainer.find("#unavailabletemplate").clone().attr("id", "remove" + value.id));
                        $mainContainer.find("#remove" + value.id + " div .devicename").append(value.name);
                        $mainContainer.find("#remove" + value.id + " div .devicename").attr('title', value.name);
                        $mainContainer.find("#remove" + value.id + " div .devicebuttons a").click(function (ev) {
                            SkyLabView.trackEvent("Deauthorize Device");
                            SkyLabController.forgetDevice(value.id);
                        });
                        $mainContainer.find("#remove" + value.id + " div .devicebuttons a").attr('title', getEdgeLocalized("deauthorize_tt"));
                    }
                });
                // Drop anything left in the dropped lookup
                $.each(unavailableDeviceListLookup, function (index, value) {
                    if (!newDeviceListLookup[value.id]) {
                        $mainContainer.find("#remove" + value.id).remove();
                        delete unavailableDeviceListLookup[value.id];
                    }
                });
            } else {
                // Drop everything in the device lookup, there's nothing in the list
                $.each(unavailableDeviceListLookup, function (index, value) {
                    $mainContainer.find("#remove" + value.id).remove();
                    delete unavailableDeviceListLookup[value.id];
                });
            }
        }
    }

    function showPasscodeInvalid(devices) {
        $.each(devices, function (key, value) {
            SkyLabView.trackEvent("Authorize Failed - Invalid Passcode");
            $mainContainer.find("#passcode" + value).attr("value", "");
            $mainContainer.find("#passcode" + value).attr("class", "passcodefielderror");
        });
    }


    function showHostInfo() {
        var hostinfo = SkyLabController.getDeviceManagerInfo();
        $mainContainer.find("#machinename").text(hostinfo.machinename);
        $mainContainer.find("#hostips").text(hostinfo.hostips.join(", "));
        $mainContainer.find("#hostips").attr("title", hostinfo.hostips.join(", "));
    }

    function initInspect($viewEl, _Strings) {
        Strings = _Strings;
        $mainContainer = $viewEl;
        var goUrlSuffix = '',
            ui_locale = getEdgeLocalized("@@ui_locale");
        
        if (ui_locale.match(/^fr/)) {
            goUrlSuffix = '_fr';
        } else if (ui_locale.match(/^ja/)) {
            goUrlSuffix = '_jp';
        }
        
        var openURL = function (url) {
            brackets.app.openURLInDefaultBrowser(function () {}, url);
        };
        var urlHandler = function (url) {
            return function () {
                openURL(url);
            };
        };
        $mainContainer.find('#renewlink').on('click', urlHandler('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix));
        $mainContainer.find('#buyitnowlink').on('click', urlHandler('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix));
        $mainContainer.find('#ssupgradelink').on('click', urlHandler('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix));
        $mainContainer.find('#sdupgradelink').on('click', urlHandler('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix));
        $mainContainer.find('#downloadisolink').on('click', urlHandler('http://adobe.com/go/edgeinspect_ios' + goUrlSuffix));
        $mainContainer.find('#downloadandroidlink').on('click', urlHandler('http://adobe.com/go/edgeinspect_android' + goUrlSuffix));
        $mainContainer.find('#downloadamazonlink').on('click', urlHandler('http://adobe.com/go/edgeinspect_amazon' + goUrlSuffix));
        $mainContainer.find('#problemlink').on('click', urlHandler('http://adobe.com/go/edgeinspect_problem' + goUrlSuffix));
        $mainContainer.find('#getedgeinspectlink').on('click', urlHandler('http://adobe.com/go/edgeinspect' + goUrlSuffix));
        $mainContainer.find('#buyitnowlink').on('click', function () {
            SkyLabView.trackEvent("Purchase Nag Link Clicked");
            openURL('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix);
        });
        $mainContainer.find('#renewlink').on('click', function () {
            openURL('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix);
        });
        $mainContainer.find('#ssupgradelink').on('click', function () {
            SkyLabView.trackEvent("Upgrade Link Clicked - Screenshot");
            openURL('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix);
        });
        $mainContainer.find('#sdupgradelink').on('click', function () {
            SkyLabView.trackEvent("Upgrade Link Clicked - Second Device");
            openURL('http://adobe.com/go/edgeinspect_upgrade' + goUrlSuffix);
        });

        $(SkyLabController).on("refresh.popup", function (event) {
            refreshDeviceList();
        });
        $(SkyLabController).on("appstate.popup", function (event) {
            if (event.state === "dmerror") {
                showDeviceManagerError();
            }
            if (event.state === "dmexpired") {
                showDeviceManagerExpired();
            }
        });
        $(SkyLabController).on("passcode_invalid.popup", function (event) {
            showPasscodeInvalid(event.devices);
        });

        $(SkyLabController).on("badge.state", function (event) {
            var newEvent = $.Event("Inspect:badgestate");
            newEvent.badgeState = event.state;
        });

        $(SkyLabController).on("host_info.popup", function (event) {
            showHostInfo();
        });
        $(SkyLabController).on("followmode.popup", function (event) {
            setToggleModeImage();
            $mainContainer.trigger("Inspect:followtoggle");
        });
        $(SkyLabController).on("transfer_complete.popup", function (event) {
            $mainContainer.find("#cancelscreenshotdiv").hide();
            $mainContainer.find("#progressdiv").hide();
            $mainContainer.find("#completedscreenshotdiv").show();
            SkyLabController.unsetNewScreenshotsFlag();
        });

        $(SkyLabController).on("subscriptionexpired.popup", function (event) {
            showWelcomeMessage();
        });


        $(SkyLabController).on("premiumdevices.popup", function (event) {
            showWelcomeMessage();
        });


        $(SkyLabController).on("premiumscreenshots.popup", function (event) {
            showWelcomeMessage();
        });

        $(SkyLabController).on("hidebuy.popup", function (event) {
            $mainContainer.find("#buyitnowwrapper").hide();
            showWelcomeMessage();
        });

        $(SkyLabController).on("showbuy.popup", function (event) {
            $mainContainer.find("#buyitnowwrapper").show();
            showWelcomeMessage();
        });

        if (!showingWelcome) {
            showWaitingOrSyncBrowseOff();
        }

        showWelcomeMessage();

        if (SkyLabController.getNewScreenshotsFlag()) {
            // TODO: Add Screenshots Done img
            $mainContainer.find("#completedscreenshotdiv").show();
            SkyLabController.unsetNewScreenshotsFlag();
        }

        SkyLabController.updateDeviceManagerSettings();
        setToggleModeImage();
        $mainContainer.find("#inspectToggle").click(function (ev) {
            if (SkyLabController.isDeviceManagerAlive()) {
                if (SkyLabController.getFollowMode() === "off") {
                    SkyLabView.trackEvent("Toggle Mode On");
                    SkyLabController.setFollowMode('on');
                } else {
                    SkyLabView.trackEvent("Toggle Mode Off");
                    SkyLabController.setFollowMode('off');
                }
            }
        });

        $mainContainer.find("#welcomeaction").click(function () {
            var props = {
                "url"     :  "http://adobe.com/go/edgeinspect",
                "focused" : true,
                "type"    : "popup"
            };

            //chrome.windows.create(props);

            $mainContainer.find("#welcomeDiv").hide();
            $mainContainer.find("#screenshot").show();
            $mainContainer.find("#forcerefresh").show();
            $mainContainer.find("#togglechrome").show();
            $mainContainer.find("#screenshotfolder").show();
            $mainContainer.find("#machineinfoheader").show();

            showingWelcome = false;
            refreshDeviceList();
        });

        $mainContainer.find('#feedback').click(function (ev) {
            // Take this out to put the panel in the Feedback pane
            SkyLabView.trackEvent("Show Survey Link Clicked");
            SkyLabController.showSurvey();
        });

        // Handle the screenshot widget
        $mainContainer.find('#screenshot').click(function (ev) {
            if (!$mainContainer.find(this).attr('disabled') && SkyLabController.isFeatureEnabled('screenshot')) {
                SkyLabView.trackEvent("Screenshot Icon Clicked");
                SkyLabController.screenshot();
                $mainContainer.find("#completedscreenshotdiv").hide();
                $mainContainer.find("#cancelscreenshotdiv").show();
                $mainContainer.find("#progressdiv").show();
            } else if (!SkyLabController.isFeatureEnabled('screenshot')) {
                SkyLabController.setShowScreenshotsArePremium(true);
                showWelcomeMessage();
            }
        });
        // Handle the screenshot folder widget
        $mainContainer.find('#screenshotfolder').click(function (ev) {
            if (!$mainContainer.find(this).attr('disabled')) {
                SkyLabView.trackEvent("Open Screenshot Folder Clicked");
                SkyLabController.openScreenshotFolder();
                SkyLabController.unsetNewScreenshotsFlag();
            }
        });
        // Handle the refresh widget
        $mainContainer.find('#forcerefresh').click(function (ev) {
            if (!$mainContainer.find(this).attr('disabled')) {
                SkyLabView.trackEvent("Refresh Icon Clicked");
                SkyLabController.forcerefresh();
            }
        });
        $mainContainer.find('#togglechrome').click(function (ev) {
            if (!$mainContainer.find(this).attr('disabled')) {
                if (EdgeInspect.isFullScreen === true) {
                    SkyLabView.trackEvent("Show Chrome Icon Clicked");
                    EdgeInspect.isFullScreen = false;
                } else {
                    SkyLabView.trackEvent("Full Screen Icon Clicked");
                    EdgeInspect.isFullScreen = true;
                }
                setFullScreenImage();
                SkyLabController.fullscreen(EdgeInspect.isFullScreen);
            }
        });
        // Handle the cancel widget
        $mainContainer.find('#cancelscreenshot').click(function (ev) {
            $mainContainer.find("#cancelscreenshotdiv").hide();
            $mainContainer.find("#progressdiv").hide();
            SkyLabView.trackEvent("Cancel Screenshot Clicked");
            SkyLabController.cancelscreenshot();
        });
        $mainContainer.find('#completedscreenshot').click(function (ev) {
            $mainContainer.find("#completedscreenshotdiv").hide();
            $mainContainer.find('#screenshotfolder').trigger('click');
        });
        $mainContainer.find('#remove').click(function (ev) {
            $mainContainer.find("#submenuoverlay").slideToggle('fast');
            $mainContainer.find("#mainpanel").hide();
            $mainContainer.find("#removepanel").show();
        });
        $mainContainer.find("#removeback").click(function (ev) {
            $mainContainer.find("#removepanel").hide();
            $mainContainer.find("#mainpanel").show();
        });

        $mainContainer.find("#logo").click(function (ev) {
            $mainContainer.find("#submenuoverlay").toggle();
        });
        showHostInfo();
        // TODO: Only add this if we're showing that event.
        $mainContainer.find("#periodicsurvey").click(function (ev) {
            SkyLabView.trackEvent("Survey Reminder Link Clicked");
            SkyLabController.showSurvey();
            SkyLabController.dismissSurveyReminder();
        });
        $mainContainer.find('#shadmessage-remove').attr('title', getEdgeLocalized("remove_tt"));
        $mainContainer.find('#subscriptionexpiredwrapper-remove').attr('title', getEdgeLocalized("remove_tt"));
        $mainContainer.find('#screenshotsarepremiumwrapper-remove').attr('title', getEdgeLocalized("remove_tt"));
        $mainContainer.find('seconddeviceispremiumwrapper-remove').attr('title', getEdgeLocalized("remove_tt"));
        $mainContainer.find('#periodicsurveywrapper-remove').attr('title', getEdgeLocalized("remove_tt"));
        $mainContainer.find('#buyitnowwrapper-remove').attr('title', getEdgeLocalized("remove_tt"));

        $mainContainer.find('#removebackimg').attr('title', getEdgeLocalized("disconnect_tt"));
        $mainContainer.find('#progress').attr('title', getEdgeLocalized("progress_tt"));
        $mainContainer.find('#screenshotfolder').attr('title', getEdgeLocalized("screenshotfolder_tt"));
        $mainContainer.find('#screenshot').attr('title', getEdgeLocalized("screenshot_tt"));
        $mainContainer.find('#forcerefresh').attr('title', getEdgeLocalized("forcerefresh_tt"));
        setFullScreenImage();

        // $(window).unload(function (event) {
        //     $(SkyLabController).off(".popup");
        // });


    }

    function startListening() {
        setTimeout(refreshDeviceList, 100);
    }

    function localize($container) {
        ASLLocalizer.localize($container);
    }

    function getFollowState() {
        return SkyLabController.getFollowMode();
    }
    exports.initInspect = initInspect;
    exports.refreshDeviceList = refreshDeviceList;
    exports.localize = localize;
    exports.startListening = startListening;
    exports.getFollowState = getFollowState;
});
