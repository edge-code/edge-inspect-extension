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
/*global define: false, $: false, _: false, saveAs: false, Backbone: false, Crypto: false, WebSocket: false, Uint8Array */
/*global WebKitBlobBuilder: false, FileReader: false */
/*global reflowShell: false */

define(function (require, exports, module) {
    "use strict";
    
    require("lib/crypto/2.5.3-crypto-sha1-hmac-pbkdf2-blockmodes-aes");
    
    var SkyLabController = null,
        SkyLab = null,
        SkyLabView = null,
        StorageManager = null,
        Connection = null,
        Inventory = null,
        Resource = null;


    function ASLConnection() {
        this._protocol = StorageManager.get('protocol');
        this._host = StorageManager.get('host');
        this._port = StorageManager.get('port');
        this._uuid = StorageManager.get('uuid');
        this._followmode = false;
        this._dmfirstrun = false;
        this._timeout = 0;
        this._queuedPayload = "";
        this._isconnected   = false;
        this.salt = "b8b5d15f0de11ceed565376436d25d74";
        this.passcode = "correct horse battery staple";
        this.key256bit = Crypto.PBKDF2(this.passcode, this.salt, 32, { iterations: 1000, asBytes: true});
        this.keyHex = Crypto.PBKDF2(this.passcode, this.salt, 32, { iterations: 1000});
        this.rand1 = Crypto.util.bytesToHex(Crypto.util.randomBytes(16));
        this.rand2 = Crypto.util.bytesToHex(Crypto.util.randomBytes(16));
        this.tryPairingWithAPasscode = false;
        this.giveUpAndStopTrying = false;

        this.verifyConnection = function () {
            if (this._wshandle.readyState === 3 || this._wshandle.readyState === 2) {
                this._isconnected   = false;
                SkyLabController.triggerDeviceManagerError();
            } else if (this._wshandle.readyState === 0) {
                this._isconnected   = false;
                SkyLabController.triggerDeviceManagerConnecting();
            } else {
                this._isconnected   = true;
                SkyLabController.setLastFollowMode();
                SkyLabView.triggerPreferencesUpdated();
            }
        };

        this.connect = function () {
            Connection.reinitialize();
            this._wshandle = new WebSocket(this._protocol + "://" + this._host + ":" + this._port + "/", "shadow");
            this._wshandle.binaryType = 'arraybuffer';
            this._wshandle.onopen = function (ev) {
                Connection._isconnected = true;
                Connection.pair();
            };
            this._wshandle.onclose = function (ev) {
                // Do something when the connection is explicitly closed
                Connection._isconnected = false;
                SkyLabController.triggerDeviceManagerError();
                SkyLabController.pollDeviceManager();
            };
            this._wshandle.onmessage = function (ev) {
                // Call out to a browser specific function
                Connection.receive(ev);
            };
            this._wshandle.onerror = function (ev) {
                // Call out to a browser specific function
                Connection.receiveError(ev);
            };
            // We need to check and see if the connection is ready before proceeding.
            setTimeout(function () {Connection.verifyConnection(); }, 100);
        };

        this.receive = function (ev) {
            var message;
            try {
                message = JSON.parse(ev.data);
            } catch (ex) {
                // try decrypting it
                try {
                    message = JSON.parse(Crypto.charenc.UTF8.bytesToString(this.decrypt(new Uint8Array(ev.data))));
                } catch (ex1) {
                    SkyLabController.debug(ex1.description + "When trying to decrypt");
                    SkyLabController.debug(ev);
                }
            }
            if (message.action !== "pong") {
                var d = new Date();
                StorageManager.log(JSON.stringify({"received" :  d.toDateString() + " " + d.toLocaleTimeString() + "." + d.getMilliseconds(), "payload" : message}));

            }
            var messageActionMap = {
                'inventory' : function () {
                    var messageSubActionMap = {
                        'passcode_request' : function () {
                            SkyLabController.updateDeviceList();
                        },
                        'passcode_invalid' : function () {
                            SkyLabController.triggerPasscodeInvalid([message.options.id]);
                        },
                        'resourcelist' : function () {
                            SkyLabController.parseDeviceList(message.options.resources);
                        },
                        'resource_change' : function () {
                            SkyLabController.updateDeviceList();
                        },
                        'manager_info' : function () {
                            SkyLabController.setDeviceManagerInfo(message.options);
                        }
                    };
                    try {
                        messageSubActionMap[message.options.subaction]();
                    } catch (ex) {
                        SkyLabController.debug('Unknown Inventory Subaction: ' + message.options.subaction + " - " + ex.description);
                    }
                },
                'pair_ready' : function () {
                    try {
                        // There may not be a message version, and we don't want it to choke there
                        SkyLab._dmmsgversion = parseInt(message.version, 10);
                    } catch (ex) {
                        SkyLab._dmmsgversion = 0;
                    }
                    if (Connection.checkForSupportedDM()) {
                        Connection.secureConnection(message.options.challenge);
                    }
                },
                'passcode_request' : function () {
                    try {
                        // There may not be a message version, and we don't want it to choke there
                        SkyLab._dmmsgversion = parseInt(message.version, 10);
                    } catch (ex) {
                        SkyLab._dmmsgversion = 0;
                    }
                    if (Connection.checkForSupportedDM()) {
                        Connection._dmfirstrun = true;
                        SkyLabController.triggerFirstRunCheck();
                        Connection.pair();
                    }
                },
                'connect_ok' : function () {
                    Connection.updateDeviceManagerSettings();
                    SkyLabController.showDeviceManagerConnect(message.source);
                },
                'error' : function () {
                    SkyLabController.debug(message.message);
                },
                'pong' : function () {
                    // Do nothing with the Pong action yet
                },
                'transfer_complete' : function () {
                    SkyLabController.debug('got transfer complete message with requestID = ' + message.options.reqID);
                    SkyLabView.transferComplete(message.options.reqID);
                },
                'log_event' : function () {
                    SkyLabView.trackEvent(message.options.event_desc);
                },
                'preferences' : function () {
                    var messageSubActionMap = {
                        'values' : function () {
                            SkyLabController.updatePreferences(message.options.prefs);
                        },
                        'errors' : function () {
                            Connection.getPreferences();
                            SkyLabController.handlePreferenceErrors(message.options.errors);
                        }
                    };
                    try {
                        messageSubActionMap[message.options.subaction]();
                    } catch (ex) {
                        SkyLabController.debug('Unknown Preferences Subaction: ' + message.options.subaction + " - " + ex.description);
                    }
                },
                'subscription' : function () {
                    var messageSubActionMap = {
                        'info' : function () {
                            SkyLabController.updateSubscriptionLevel(message.options);
                        },
                        'error' : function () {
                            SkyLabController.handleSubscriptionErrors(message.options);
                        }
                    };
                    try {
                        messageSubActionMap[message.options.subaction]();
                    } catch (ex) {
                        SkyLabController.debug('Unknown Subscription Subaction: ' + message.options.subaction + " - " + ex.description);
                    }
                },
                'not_authorized' : function () {
                    Connection.giveUpAndStopTrying = true;
                    Connection.disconnect();
                    SkyLabController.triggerDeviceManagerError();
                }
            };
            try {
                messageActionMap[message.action]();
            } catch (ex2) {
                // Pitch this to SL Controller
                SkyLabController.debug('Unknown WebSocket Action: ' + message.action);
            }
        };

        this.receiveError = function (ev) {
            var message = JSON.parse(ev.data);
            // Pitch the error to the view?
        };

        this.disconnect = function () {
            this._wshandle.close();
            this._wshandle = null;
        };

        this.pair = function () {
            if (Connection._dmfirstrun) {
                this.send(this._formatPairFirst());
            } else {
                this.send(this._formatPair());
            }
        };

        this.pairDevice = function (passcode, deviceid) {
            this.sendWithoutLogging(this.encrypt(this._formatPasscode(passcode, deviceid)));
        };

        this.ejectDevice = function (deviceid) {
            var requestID = SkyLab.generateUUID();

            this.sendWithoutLogging(this.encrypt(this._formatShowChrome(requestID, deviceid)));
            this.sendWithoutLogging(this.encrypt(this._formatEject(deviceid)));
        };

        this.forgetDevice = function (deviceid) {
            this.sendWithoutLogging(this.encrypt(this._formatForget(deviceid)));
        };

        this.cancelDevice = function (deviceid) {
            this.sendWithoutLogging(this.encrypt(this._formatCancel(deviceid)));
        };

        this.updateDeviceList = function () {
            this.sendWithoutLogging(this.encrypt(this._formatInventory()));
        };

        this.secureConnection = function (challenge) {
            var mine,
                unpacked,
                yours;
            
            try {
                unpacked = Crypto.util.bytesToHex(this.decrypt(challenge, true));
                mine = unpacked.substring(0, 32);
                yours = unpacked.substring(32, 64);
            } catch (ex) {
                SkyLabController.debug("Couldn't Decrypt - " + challenge);
                // Try Resetting The Passcode
                if (this.tryPairingWithAPasscode === false) {
                    this.send(this._formatPairFirst());
                    this.tryPairingWithAPasscode = true;
                } else {
                    // We can't work it out.  Stop Trying.
                    this.giveUpAndStopTrying = true;
                    clearTimeout(Connection._timeout);
                }
            }
            if (mine === this.rand1) {
                // We can decrypt
                this.send(this._formatConnect(yours));
            } else {
                // This failed
                SkyLabController.debug("Rand Isn't The Same");
                // Try Resetting The Passcode
                if (this.tryPairingWithAPasscode === false) {
                    this.send(this._formatPairFirst());
                    this.tryPairingWithAPasscode = true;
                } else {
                    // We can't work it out.  Stop Trying.
                    this.giveUpAndStopTrying = true;
                    clearTimeout(Connection._timeout);
                }
            }
        };

        this.checkForSupportedDM = function () {
            if (SkyLab._dmmsgversion < 1 || isNaN(SkyLab._dmmsgversion)) {
                SkyLabController.triggerDeviceManagerError();
                Connection.disconnect();
                return false;
            } else {
                return true;
            }
        };

        this.encrypt = function (message, asHex) {
            asHex = (typeof asHex === "undefined") ? false : asHex;
            try {
                var forlogging = JSON.parse(message);
                var d = new Date();
                delete forlogging.options.random;
                if (forlogging.action !== 'ping') {
                    StorageManager.log(JSON.stringify({"    sent" :  d.toDateString() + " " + d.toLocaleTimeString() + "." + d.getMilliseconds(), "payload" : forlogging}));
                }
            } catch (ex) {
                // Swallow the error, it wasn't a JSON message
            }

            var encryptedBytes = Crypto.util.base64ToBytes(Crypto.AES.encrypt(message, this.key256bit, { mode: new Crypto.mode.CBC(Crypto.pad.pkcs7) }));

            return (asHex ? Crypto.util.bytesToHex(encryptedBytes) : encryptedBytes);
        };

        this.decrypt = function (message, asHex) {
            asHex = (typeof asHex === "undefined") ? false : asHex;

            var encryptedBytes = asHex ? Crypto.util.hexToBytes(message) : message;

            return (Crypto.AES.decrypt(Crypto.util.bytesToBase64(encryptedBytes), this.key256bit, { mode: new Crypto.mode.CBC(Crypto.pad.pkcs7), asBytes: true }));
        };

        this.updateDeviceManagerSettings = function () {
            this.sendWithoutLogging(this.encrypt(this._formatgetHostInfo()));
            this.getPreferences();
        };

        this.send = function (message) {
            if (this._isconnected) {
                var d = new Date();
                StorageManager.log(JSON.stringify({"    sent" :  d.toDateString() + " " + d.toLocaleTimeString() + "." + d.getMilliseconds(), "payload" : JSON.parse(message)}));
                this._send(message);
            } else {
                var d1 = new Date();
                StorageManager.log(JSON.stringify({"cant send" :  d1.toDateString() + " " + d1.toLocaleTimeString() + "." + d1.getMilliseconds(), "payload" : JSON.parse(message)}));
            }
        };

        this.sendWithoutLogging = function (message) {
            if (this._isconnected) {
                this._send(message);
            }
        };

        this._send = function (message) {
            if (Array.isArray(message)) {
                // send array as binary message
                this._wshandle.send(new Uint8Array(message).buffer);
            } else {
                this._wshandle.send(message);
            }
        };

        this.message = function (payload) {
            if (!this._wshandle) {
                this.connect();
                this._queuedPayload = payload;
                this._timeout = setTimeout(function () {SkyLabController.clearQueue(); }, 100);
            } else if (this._wshandle.readyState !== 1) {
                this.disconnect();
                this.connect();
                this._queuedPayload = payload;
                this._timeout = setTimeout(function () {SkyLabController.clearQueue(); }, 100);
            }
            // We need code here to queue responses in case the connection isn't open or ready yet
            try {
                if (payload.action === "browse") {
                    this.sendWithoutLogging(this.encrypt(this._formatBrowse(payload.options.url, payload.options.devices, payload.options.fullscreen)));
                }
                if (payload.action === "passcode") {
                    this.sendWithoutLogging(this.encrypt(this._formatPasscode(payload.options.passcode, payload.options.deviceid)));
                }
                if (payload.action === "gethostinfo") {
                    this.sendWithoutLogging(this.encrypt(this._formatgetHostInfo()));
                }
                if (payload.action === "screenshot") {
                    this.sendWithoutLogging(this.encrypt(this._formatScreenshot(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "forcerefresh") {
                    this.sendWithoutLogging(this.encrypt(this._formatForcerefresh(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "showchrome") {
                    this.sendWithoutLogging(this.encrypt(this._formatShowChrome(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "fullscreen") {
                    this.sendWithoutLogging(this.encrypt(this._formatFullScreen(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "devicerefresh") {
                    this.sendWithoutLogging(this.encrypt(this._formatForcerefresh(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "cancelscreenshot") {
                    this.sendWithoutLogging(this.encrypt(this._formatCancelScreenshot(payload.options.request_id, payload.options.devices)));
                }
                if (payload.action === "scrollBy") {
                    this.sendWithoutLogging(this.encrypt(this._formatScrollBy(payload.options.request_id, payload.options.devices, payload.options.xPercScroll, payload.options.yPercScroll)));
                }
                if (payload.action === "scrollToElement") {
                    this.sendWithoutLogging(this.encrypt(this._formatScrollToElement(payload.options.request_id, payload.options.devices, payload.options.elementId)));
                }
            } catch (ex) {
                // do something interesting
            }
        };

        this.onReceive = function () {
            // do something interesting
        };

        this.onError = function () {
            // do something interesting
        };

        this.isConnected = function () {
            return this._isconnected;
        };

        this.pingDeviceManager = function () {
            this.sendWithoutLogging(this.encrypt(this._formatPing()));
        };

        this.openScreenshotFolder = function () {
            this.sendWithoutLogging(this.encrypt(this._formatScreenshotFolder()));
        };

        this.setScreenshotFolder = function (ssfolder) {
            this.sendWithoutLogging(this.encrypt(this._formatSetScreenshotFolder(ssfolder)));
        };

        this.getPreferences = function () {
            this.sendWithoutLogging(this.encrypt(this._formatGetPreferences()));
        };

        this.reinitialize = function () {
            this._protocol = StorageManager.get('protocol');
            this._host     = StorageManager.get('host');
            this._port     = StorageManager.get('port');
            this._uuid     = StorageManager.get('uuid');
        };

        this.setUUID = function () {
            SkyLab.setUUID();
            this._uuid = StorageManager.get('uuid');
        };

        this._formatPairFirst = function () {
            return JSON.stringify({
                "action" : "pair",
                "source" : this._uuid,
                "options" : {
                    "id": this._uuid,
                    "name" : "Chrome Extension",
                    "type": "administrator",
                    "passcode" : this.keyHex,
                    "rand" : this.rand1
                }
            });
        };

        this._formatPair = function () {
            return JSON.stringify({
                "action" : "pair",
                "source" : this._uuid,
                "options" : {
                    "id": this._uuid,
                    "name" : "Chrome Extension",
                    "type": "administrator",
                    "rand" : this.rand1
                }
            });
        };

        this._formatConnect = function (yours) {
            return JSON.stringify({
                "action" : "connect",
                "source" : this._uuid,
                "options" : {
                    "id": this._uuid,
                    "name" : "Chrome Extension",
                    "type": "administrator",
                    "challenge" : this.encrypt(Crypto.util.hexToBytes(yours + this.rand2), true)
                }
            });
        };

        this._formatInventory = function (status) {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "listresources",
                    "type": "device",
                    "status" : status
                }
            });
        };

        this._formatPasscode = function (passcode, deviceid) {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "passcode_response",
                    "id": deviceid,
                    "passcode" : passcode
                }
            });
        };

        this._formatBrowse = function (url, devices, fullscreen) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "browser_navigate",
                        "source" : this._uuid,
                        "options" : {
                            "url": url,
                            "fullscreen": fullscreen
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatScreenshot = function (requestID, devices) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "screenshot_request",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatForcerefresh = function (requestID, devices) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "force_refresh",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };


        this._formatScrollBy = function (requestID, devices, xPercScroll, yPercScroll) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "scrollBy",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID,
                            "xPercScroll" : xPercScroll,
                            "yPercScroll" : yPercScroll
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatScrollToElement = function (requestID, devices, elementId) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "scrollToElement",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID,
                            "elementId" : elementId
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatShowChrome = function (requestID, devices) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "show_chrome",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatFullScreen = function (requestID, devices) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "full_screen",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatCancelScreenshot = function (requestID, devices) {
            return JSON.stringify({
                "action" : "publish",
                "source" : this._uuid,
                "options" : {
                    "message" : {
                        "action": "transfer_cancel",
                        "source" : this._uuid,
                        "options" : {
                            "request_id": requestID
                        }
                    },
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "destinations" : devices
                }
            });
        };

        this._formatScreenshotFolder = function () {
            return JSON.stringify({
                "action" : "screenshotfolder",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16))
                }
            });
        };

        this._formatSetScreenshotFolder = function (ssfolder) {
            return JSON.stringify({
                "action" : "preferences",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "set",
                    "prefs" : {
                        "screenshotfolder"  : ssfolder
                    }
                }
            });
        };

        this._formatGetPreferences = function () {
            return JSON.stringify({
                "action" : "preferences",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "get"
                }
            });
        };

        this._formatEject = function (deviceid) {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "eject_device",
                    "deviceids": deviceid
                }
            });
        };

        this._formatForget = function (deviceid) {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "forget_device",
                    "deviceids": [deviceid]
                }
            });
        };

        this._formatCancel = function (deviceid) {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "cancel_connect",
                    "deviceids": [deviceid]
                }
            });
        };

        this._formatgetHostInfo = function () {
            return JSON.stringify({
                "action" : "inventory",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16)),
                    "subaction" : "get_manager_info"
                }
            });
        };

        this._formatPing = function () {
            return JSON.stringify({
                "action" : "ping",
                "source" : this._uuid,
                "options" : {
                    "random" : Crypto.util.bytesToHex(Crypto.util.randomBytes(16))
                }
            });
        };

    }

    function ASLInventory() {
        this.remove = function () {

        };

        this.add = function () {

        };
    }

    function ASLResource() {
        this._networkAddress = null;
        this._UUID = null;
        this._resourceState = null;
        this._resourceEncryptionKey = null;
    }

    function ASLStorageManager() {

        // localStorage only holds strings.

        this.get = function (key) {
            return localStorage.getItem(key);
        };
        this.put = function (key, value) {
            return localStorage.setItem(key, value);
        };
        this["delete"] = function (key) {
            return localStorage.removeItem(key);
        };
        this.log = function (message) {
            var unpacked = JSON.parse(message);
            if (unpacked.payload && unpacked.payload.action === "publish") {
                //            unpacked.payload.options.message.options.url = "***scrubbed***";
                message = JSON.stringify(unpacked);
            } else if (unpacked.payload && unpacked.payload.options.rand) {
                delete unpacked.payload.options.rand;
                message = JSON.stringify(unpacked);
            }
            var log = this.get("log");
            if (log === null) {
                // This is an empty object
                log = [];
            } else {
                log = JSON.parse(log);
            }
            if (log.length > 1000) {
                log.shift();
            }
            log.push(message);
            this.put("log", JSON.stringify(log));
        };
    }

    // Order matter here, which may be a good argument for passing everything through the controller

    StorageManager = new ASLStorageManager();

    Connection = new ASLConnection();

    Inventory = new ASLInventory();

    Resource = new ASLResource();

    function ASLSkyLab() {
        this._defaultfollowmode     = 'off';
        this._followmode            = this._defaultfollowmode;
        this._nowpairing            = [];
        this._url                   = '';
        this._devices               = [];
        this._unavailabledevices    = [];
        this._hostname              = '';
        this._dmversion             = '';
        this._machinename           = '';
        this._hostport              = '';
        this._hostips               = [''];
        this._showedfirstrun        = false;
        this._expired               = false;
        this._showsurveyreminder    = false;
        this._dmmsgversion          = 0;
        this.newscreenshots         = false;
        this._prefs                 = {};
        this._subscriptionfeatures  = {screenshot: true};
        this._showrenew             = false;
        this._showpremiumscreenshots = false;
        this._showpremiumdevices    = false;
        this._showbuyitnow          = true;
        this._enablepurchasenag     = true;

        this.setFollowMode = function (mode) {
            this._followmode = mode;
            if (mode === "on") {
                SkyLabView.triggerFollowModeOn();
            } else {
                SkyLabView.triggerFollowModeOff();
            }
        };

        this.setDefaultFollowMode = function () {
            return SkyLab.setFollowMode(this._defaultfollowmode);
        };
        this.setLastFollowMode = function () {
            return SkyLab.setFollowMode(this._followmode);
        };
        this.getFollowMode = function () {
            return this._followmode;
        };
        this.firstRun = function () {
            // Check to set UUID for non-firstrun
            if (!Connection._uuid) {
                Connection.setUUID();
            }
            var firstRun = StorageManager.get('runbefore'),
                shownNameChange = StorageManager.get('shownnamechange'),
                returnValue = true;
            if (!firstRun) {
                shownNameChange = 'skip';
                StorageManager.put('protocol', 'ws');
                StorageManager.put('host', '127.0.0.1');
                StorageManager.put('port', '7682');
                StorageManager.put('runbefore', 'yes');
                StorageManager.put('shownnamechange', shownNameChange);
                StorageManager.put('uuid', SkyLab.generateUUID());
                Connection.reinitialize();
            } else {
                // otherwise, return the DM's first run value;
                returnValue = Connection._dmfirstrun;
            }
            if (!shownNameChange) {
                StorageManager.put('shownnamechange', 'yes');
                SkyLabView.triggerShowNameChange();
            }
            return returnValue;
        };
        this.sendUrl = function (url, devices, fullscreen) {
            this.setUrl(url);
            return Connection.message({'action' : 'browse', 'options' : {'url': url, 'devices' : devices, 'fullscreen' : fullscreen}});
        };

        this.getUrl = function () {
            return this._url;
        };

        this.setUrl = function (url) {
            this._url = url;
            return this._url;
        };

        this.followUrl = function (url, devices, fullscreen) {
            if (this.getFollowMode() === "on" && SkyLab._devices.length > 0 && url !== "" && SkyLabView.shouldFollowThisUrl(url)) {
                SkyLabView.trackEvent("URL Sent, Device Count: " + SkyLab._devices.length);
                this.sendUrl(url, devices, fullscreen);
            } else if (url !== "") {
                this.setUrl(url);
            }
            return 0;
        };

        this.pairDevice = function (passcode, deviceid) {
            return Connection.pairDevice(passcode, deviceid);

        };

        this.connectToDeviceManager = function () {
            return Connection.connect();
        };

        this.disconnectFromDeviceManager = function () {
            return Connection.disconnect();
        };

        this.updateDeviceList = function () {
            Connection.updateDeviceList();
        };

        this.getDeviceList = function () {
            return SkyLab._devices;
        };

        this.getUnavailableDeviceList = function () {
            return SkyLab._unavailabledevices;
        };

        this.setDeviceList = function (deviceList) {
            var newDevices = [],
                knownDevices = [],
                eventsuffix = " - ",
                lastDate = new Date(StorageManager.get('lastsessiontrack')),
                today = new Date(),
                fullscreen = "false";

            if (SkyLab._devices.length > deviceList.length) {
                SkyLabView.triggerDeviceDisconnected();
            }
            if (deviceList.length > 0) {
                SkyLab._devices.forEach(function (device) {
                    knownDevices.push(device.id);
                });
                deviceList.forEach(function (device) {
                    if (knownDevices.indexOf(device.id) === -1) {
                        // new device
                        if (SkyLabView.ridevice === device.id) {
                            SkyLabView.restoreRemoteInspectionWeAreStillDoingThat();
                        } else {
                            newDevices.push(device.id);
                        }
                    }
                });
                if (newDevices.length === 1 && SkyLab._devices.length === 0) {
                    if (typeof SkyLab._subscriptionlevel !== 'undefined') {
                        if (SkyLab._subscriptionlevel === '') {
                            eventsuffix += "Not Signed In";
                        } else {
                            eventsuffix += SkyLab._subscriptionlevel;
                        }
                    }
                    if (StorageManager.get('lastsessiontrack') === null || ((today - lastDate) / 1000 / 60 / 60 / 24 >= 7)) {
                        StorageManager.put('lastsessiontrack', today);
                        SkyLabView.trackEvent('First Session This Week' + eventsuffix);
                    }
                    SkyLabView.trackEvent('First Device This Session' + eventsuffix);
                }
            }
            SkyLab._devices = deviceList;
            if (newDevices.length > 0 && this.getFollowMode() === "on") {
                // We should always have a URL because it gets set on init
                SkyLabController.followUrl(SkyLabController.getUrl(), newDevices, fullscreen);
            }
            return SkyLab._devices;
        };

        this.setUnavailableDeviceList = function (deviceList) {
            SkyLab._unavailabledevices = deviceList;
            // We don't need to trigger a DeviceListUpdated here, this can only change if one goes offline
            return SkyLab._unavailabledevices;
        };

        this.setPairingDeviceList = function (deviceList) {
            SkyLab._nowpairing = deviceList;
            if (deviceList.length > 0) {
                SkyLab.showRequestPasscode();
            } else {
                SkyLabView.triggerNowPairingDismiss();
            }
        };

        this.parseDeviceList = function (deviceList) {
            if (deviceList.length === 0) {
                SkyLab.setDeviceList([]);
                SkyLab.setUnavailableDeviceList([]);
                SkyLab.setPairingDeviceList([]);
                SkyLabView.triggerDeviceListUpdated();
                return SkyLab.getDeviceList();
            }
            var connectedDevices = [];
            var pairingDevices   = [];
            var unavailableDevices = [];
            deviceList.forEach(function (device) {
                if (device.status === "connected") {
                    // This device is connected
                    connectedDevices.push(device);
                } else if (device.status === "needs_passcode") {
                    // This device needs a passcode
                    pairingDevices.push(device);
                } else if (device.status === "unavailable" || device.status === "unknown") {
                    // This device is offline
                    unavailableDevices.push(device);
                }
            });
            SkyLab.setPairingDeviceList(pairingDevices);
            SkyLab.setDeviceList(connectedDevices);
            SkyLab.setUnavailableDeviceList(unavailableDevices);
            SkyLabView.triggerDeviceListUpdated();
            return SkyLab.getDeviceList();
        };

        this.showRequestPasscode = function () {
            SkyLabView.renderPairingRequest();
        };

        this.dismissRequestPasscode = function () {
            SkyLabView.dismissPairingRequest();
        };

        this.showDeviceManagerConnect = function (name) {
            var dmConnections = StorageManager.get('dmconnections'),
                surveyReminderDismissed = StorageManager.get('surveyreminderdismissed');

            if (dmConnections !== null) {
                dmConnections++;
                StorageManager.put('dmconnections', dmConnections);
                if (dmConnections > 30 && surveyReminderDismissed !== 'true') {
                    SkyLab._showsurveyreminder = true;
                }
            } else {
                dmConnections = 1;
                StorageManager.put('dmconnections', dmConnections);
            }

            StorageManager.put('dmmsgversion', SkyLab._dmmsgversion);
            SkyLabController.setLastFollowMode();
            SkyLabView.renderDeviceManagerConnect(name);
        };

        this.getNowPairing = function () {
            return SkyLab._nowpairing;
        };

        this.triggerDeviceManagerError = function () {
            SkyLab.setDeviceList([]);
            SkyLab.setPairingDeviceList([]);
            SkyLabController.stopShowingMessage('buyitnow');
            return SkyLabView.triggerDeviceManagerError();
        };

        this.triggerDeviceManagerConnecting = function () {
            return SkyLabView.triggerDeviceManagerConnecting();
        };

        this.triggerFollowUrl = function () {
            return SkyLabView.triggerFollowUrl();
        };

        this.triggerFirstRunCheck = function () {
            if (!this._showedfirstrun) {
                return SkyLabView.triggerFirstRunCheck();
            } else {
                return false;
            }
        };

        this.setShowedFirstRun = function () {
            this._showedfirstrun = true;
        };

        this.triggerPasscodeInvalid = function (devices) {
            // Set Some Array Of Devices With Invalid Passcode
            // but only if we persist error states

            // Send a message to the popup to invalidate a passcode field
            return SkyLabView.triggerPasscodeInvalid(devices);

        };

        this.showSurvey = function () {
            return SkyLabView.openSurvey();
        };

        this.screenshot = function () {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'screenshot', 'options' : {'request_id': requestID, 'devices' : []}});
        };

        this.devicerefresh = function (deviceid) {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'forcerefresh', 'options' : {'request_id': requestID, 'devices' : deviceid}});
        };

        this.fullscreen = function (doFull) {
            var requestID = SkyLab.generateUUID();

            if (doFull === true) {
                return Connection.message({'action' : 'fullscreen', 'options' : {'request_id': requestID, 'devices' : []}});
            } else {
                return Connection.message({'action' : 'showchrome', 'options' : {'request_id': requestID, 'devices' : []}});
            }
        };

        this.forcerefresh = function () {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'forcerefresh', 'options' : {'request_id': requestID, 'devices' : []}});
        };

        this.cancelscreenshot = function () {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'cancelscreenshot', 'options' : {'request_id': requestID, 'devices' : []}});
        };

        this.scrollBy = function (xPercScroll, yPercScroll) {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'scrollBy', 'options' : {'request_id': requestID, 'devices' : [], 'xPercScroll' : xPercScroll, 'yPercScroll': yPercScroll}});
        };


        this.scrollToElement = function (elementId) {
            var requestID = SkyLab.generateUUID();

            return Connection.message({'action' : 'scrollToElement', 'options' : {'request_id': requestID, 'devices' : [], 'elementId' : elementId}});
        };

        this.pollDeviceManager = function () {
            clearTimeout(Connection._timeout);
            if (Connection.giveUpAndStopTrying !== true) {
                Connection._timeout = setTimeout(function () {SkyLabController.connectToDeviceManager(); }, 5000);
            }
        };

        this.isDeviceManagerAlive = function () {
            return Connection.isConnected();
        };

        this.clearQueue = function () {
            clearTimeout(Connection._timeout);
            var payload = Connection._queuedPayload;
            Connection._queuedPayload = "";
            Connection.message(payload);
        };

        this.ejectDevice = function (deviceid) {
            return Connection.ejectDevice(deviceid);
        };

        this.forgetDevice = function (deviceid) {
            return Connection.forgetDevice(deviceid);
        };

        this.cancelDevice = function (deviceid) {
            return Connection.cancelDevice(deviceid);
        };

        this.debug = function (message) {
            console.log(JSON.stringify({"debug" : message}));
            //StorageManager.log(JSON.stringify({"debug" : message}));
        };

        this.getDeviceManagerInfo = function () {
            return {"hostname" : SkyLab._hostname, "hostips" : SkyLab._hostips, "hostport" : SkyLab._hostport, "machinename" : SkyLab._machinename, "build" : SkyLab._dmversion};
        };

        this.updateDeviceManagerSettings = function () {
            return Connection.updateDeviceManagerSettings();
        };

        this.setDeviceManagerInfo = function (options) {
            SkyLab._dmversion = options.build;
            SkyLab._hostname = options.hostname;
            SkyLab._hostips = options.addresses;
            SkyLab._machinename = options.machinename;
            if (options.expired === "true") {
                SkyLab._expired = true;
            } else {
                SkyLab._expired = false;
            }

            // save this for now, may use it later
            SkyLab._hostport = options.port;
            SkyLabView.triggerShowHostInfo();
        };

        this.getSurveyLink = function () {
            return SkyLabView.getSurveyLink();
        };

        this.pingDeviceManager = function () {
            return Connection.pingDeviceManager();
        };

        this.openScreenshotFolder = function () {
            return Connection.openScreenshotFolder();
        };

        this.isDeviceManagerValid = function () {
            return !this._expired;
        };


        this.generateUUID = function () {
            // Big hat tip to the https://github.com/jed and his public gist for this https://gist.github.com/982883
            function b(a) {
                return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
            }
            return b();
        };

        this.setUUID = function () {
            StorageManager.put('uuid', SkyLab.generateUUID());
        };

        this.dismissSurveyReminder = function () {
            StorageManager.put('surveyreminderdismissed', 'true');
            SkyLab._showsurveyreminder = false;
        };

        this.dismissBuyItNow = function () {
            SkyLab._showbuyitnow = false;
        };

        this.getShowSubscriptionExpired = function () {
            return SkyLab._showrenew;
        };

        this.getShowScreenshotsArePremium = function () {
            return SkyLab._showpremiumscreenshots;
        };

        this.setShowScreenshotsArePremium = function (state) {
            SkyLab._showpremiumscreenshots = state;
        };

        this.getShowDevicesArePremium = function () {
            return SkyLab._showpremiumdevices;
        };

        this.setShowDevicesArePremium = function (state) {
            SkyLab._showpremiumdevices = state;
        };

        this.getShowSurveyReminder = function () {
            return SkyLab._showsurveyreminder;
        };

        this.getShowBuyItNow = function () {
            return (SkyLab._showbuyitnow && SkyLab._enablepurchasenag);
        };

        this.showWhichMessage = function () {
            // Which messages are the most important to show first.
            var returnvalue = [];
            if (this.getShowSubscriptionExpired()) {
                returnvalue.push('renew');
            }
            if (this.getShowScreenshotsArePremium()) {
                returnvalue.push('premiumscreenshots');
            }
            if (this.getShowDevicesArePremium()) {
                returnvalue.push('premiumdevices');
            }
            if (this.getShowSurveyReminder()) {
                returnvalue.push('survey');
            }
            if (this.getShowBuyItNow()) {
                returnvalue.push('buyitnow');
            }

            return returnvalue;
        };

        this.stopShowingMessage = function (msgtype) {
            if (msgtype === 'renew') {
                SkyLab._showrenew = false;
            }

            if (msgtype === 'premiumscreenshots') {
                SkyLabController.setShowScreenshotsArePremium(false);
            }

            if (msgtype === 'premiumdevices') {
                SkyLabController.setShowDevicesArePremium(false);
            }

            if (msgtype === 'survey') {
                SkyLabController.dismissSurveyReminder();
            }

            if (msgtype === 'buyitnow') {
                SkyLabController.dismissBuyItNow();
            }
        };

        this.shouldShowWelcomeMessage = function () {
            var dmmsgversion = StorageManager.get('dmmsgversion');
            return (dmmsgversion < 1 && SkyLab._dmmsgversion !== null);
        };

        this.setNewScreenshotsFlag = function () {
            SkyLab.newscreenshots = true;
            return;
        };

        this.unsetNewScreenshotsFlag = function () {
            SkyLab.newscreenshots = false;
            return;
        };

        this.getNewScreenshotsFlag = function () {
            return SkyLab.newscreenshots;
        };

        this.setScreenshotFolder = function (ssfolder) {
            return Connection.setScreenshotFolder(ssfolder);
        };

        this.getScreenshotFolder = function () {
            try {
                return SkyLab.prefs.screenshotfolder;
            } catch (ex) {
                // No prefs set yet, DM probably not launched.
            }
        };

        this.updatePreferences = function (prefs) {
            SkyLab.prefs = prefs;
            SkyLabView.triggerPreferencesUpdated();
            return SkyLab.prefs;
        };

        this.handlePreferenceErrors = function (errors) {
            var errorcode,
                message;
            
            var messageActionMap = {
                "screenshotfolder" : function (error) {
                    SkyLabView.triggerScreenshotFolderError(errors.screenshotfolder);
                }
            };
            for (errorcode in errors) {
                try {
                    messageActionMap[errorcode]();
                } catch (ex) {
                    // Pitch this to SL Controller
                    SkyLabController.debug('Unknown Preferences Error Code: ' + message.action);
                }
            }
            return;
        };

        this.updateSubscriptionLevel = function (subscription) {
            var existingSubscriptionLevel = StorageManager.get('subscriptionlevel');
            if (existingSubscriptionLevel !== null && existingSubscriptionLevel !== subscription.level && subscription.level === 'FREE_LVL_1') {
                SkyLabView.triggerSubscriptionHasExpiredMessage();
            }

            if (subscription.level !== null && subscription.level !== 'FREE_LVL_1' && subscription.level !== "") {
                SkyLabController.stopShowingMessage('buyitnow');
                SkyLabView.triggerStopShowingBuyMessage();
                SkyLabController.setShowDevicesArePremium(false);
            } else {
                SkyLab._showbuyitnow = true;
                SkyLabView.triggerShowBuyMessage();
            }

            SkyLabView.setSurveyLinkForSubscriptionLevel(subscription.level);

            SkyLab._subscriptionlevel = subscription.level;
            SkyLab._subscriptionstatus = subscription.status;
            SkyLab._subscriptionfeatures = subscription.features;
            StorageManager.put('subscriptionlevel', subscription.level);
            return;
        };

        this.handleSubscriptionErrors = function (errors) {
            delete errors.rand;
            if (errors.subaction === 'error' && errors.feature === 'connection') {
                SkyLabController.setShowDevicesArePremium(true);
                SkyLabView.triggerDevicesArePremium();
            } else if (errors.subaction === 'error' && errors.feature === 'screenshot') {
                SkyLabController.setShowScreenshotsArePremium(true);
                SkyLabView.triggerScreenshotsArePremium();
            }
            SkyLabController.debug("Subscription Error: " + JSON.stringify(errors));
        };

        this.isFeatureEnabled = function (feature) {
            return (feature in SkyLab._subscriptionfeatures && SkyLab._subscriptionfeatures[feature]);
        };

    }

    SkyLab = new ASLSkyLab();

    function ASLSkyLabController(view) {
        this.aniid = window.hasOwnProperty('aniid') ? window.aniid++ : 0;
        window.aniid = this.aniid;
        this.connectToDeviceManager = function () {
            return SkyLab.connectToDeviceManager();
        };

        this.disconnectFromDeviceManager = function () {
            return SkyLab.disconnectFromDeviceManager();
        };

        this.setFollowMode = function (mode) {
            return SkyLab.setFollowMode(mode);
        };

        this.getFollowMode = function () {
            return SkyLab.getFollowMode();
        };

        this.setDefaultFollowMode = function () {
            return SkyLab.setDefaultFollowMode();
        };

        this.setLastFollowMode = function () {
            return SkyLab.setLastFollowMode();
        };

        this.sendUrl = function (url, devices, fullscreen) {
            return SkyLab.sendUrl(url, devices, fullscreen);
        };

        this.setUrl = function (url) {
            return SkyLab.setUrl(url);
        };

        this.followUrl = function (url, devices, fullscreen) {
            return SkyLab.followUrl(url, devices, fullscreen);
        };

        this.pairDevice = function (passcode, deviceid) {
            return SkyLab.pairDevice(passcode, deviceid);
        };

        this.getUrl = function () {
            return SkyLab.getUrl();
        };

        this.getDeviceList = function () {
            return SkyLab.getDeviceList();
        };

        this.getUnavailableDeviceList = function () {
            return SkyLab.getUnavailableDeviceList();
        };

        this.parseDeviceList = function (deviceList) {
            return SkyLab.parseDeviceList(deviceList);
        };

        this.updateDeviceList = function () {
            return SkyLab.updateDeviceList();
        };

        this.firstRun = function () {
            return SkyLab.firstRun();
        };

        this.showRequestPasscode = function () {
            return SkyLab.showRequestPasscode();
        };

        this.dismissRequestPasscode = function () {
            return SkyLab.dismissRequestPasscode();
        };

        this.debug = function (message) {
            return SkyLab.debug(message);
        };

        this.showDeviceManagerConnect = function (name) {
            return SkyLab.showDeviceManagerConnect(name);
        };

        this.getNowPairing = function () {
            return SkyLab.getNowPairing();
        };

        this.triggerDeviceManagerError = function () {
            return SkyLab.triggerDeviceManagerError();
        };

        this.triggerDeviceManagerConnecting = function () {
            return SkyLab.triggerDeviceManagerConnecting();
        };

        this.triggerFollowUrl = function () {
            return SkyLab.triggerFollowUrl();
        };

        this.triggerPasscodeInvalid = function (devices) {
            return SkyLab.triggerPasscodeInvalid(devices);
        };

        this.triggerFirstRunCheck = function () {
            return SkyLab.triggerFirstRunCheck();
        };

        this.setShowedFirstRun = function () {
            SkyLab.setShowedFirstRun();
        };

        this.showSurvey = function () {
            return SkyLab.showSurvey();
        };

        this.screenshot = function () {
            return SkyLab.screenshot();
        };

        this.forcerefresh = function () {
            return SkyLab.forcerefresh();
        };

        this.scrollBy = function (xPercScroll, yPercScroll) {
            return SkyLab.scrollBy(xPercScroll, yPercScroll);
        };

        this.scrollToElement = function (elementId) {
            return SkyLab.scrollToElement(elementId);
        };

        this.fullscreen = function (goFull) {
            return SkyLab.fullscreen(goFull);
        };

        this.devicerefresh = function (deviceid) {
            return SkyLab.devicerefresh(deviceid);
        };

        this.cancelscreenshot = function () {
            return SkyLab.cancelscreenshot();
        };

        this.pollDeviceManager = function () {
            return SkyLab.pollDeviceManager();
        };

        this.clearQueue = function () {
            return SkyLab.clearQueue();
        };

        this.ejectDevice = function (deviceid) {
            return SkyLab.ejectDevice(deviceid);
        };

        this.forgetDevice = function (deviceid) {
            return SkyLab.forgetDevice(deviceid);
        };

        this.cancelDevice = function (deviceid) {
            return SkyLab.cancelDevice(deviceid);
        };

        this.isDeviceManagerAlive = function () {
            return SkyLab.isDeviceManagerAlive();
        };

        this.getDeviceManagerInfo = function () {
            return SkyLab.getDeviceManagerInfo();
        };

        this.setDeviceManagerInfo = function (options) {
            return SkyLab.setDeviceManagerInfo(options);
        };

        this.updateDeviceManagerSettings = function () {
            return SkyLab.updateDeviceManagerSettings();
        };

        this.getSurveyLink = function () {
            return SkyLab.getSurveyLink();
        };

        this.pingDeviceManager = function () {
            return SkyLab.pingDeviceManager();
        };

        this.openScreenshotFolder = function () {
            return SkyLab.openScreenshotFolder();
        };

        this.isDeviceManagerValid = function () {
            return SkyLab.isDeviceManagerValid();
        };

        this.dismissSurveyReminder = function () {
            return SkyLab.dismissSurveyReminder();
        };

        this.dismissBuyItNow = function () {
            return SkyLab.dismissBuyItNow();
        };

        this.getShowSurveyReminder = function () {
            return SkyLab.getShowSurveyReminder();
        };

        this.getShowSubscriptionExpired = function () {
            return SkyLab.getShowSubscriptionExpired();
        };

        this.getShowScreenshotsArePremium = function () {
            return SkyLab.getShowScreenshotsArePremium();
        };
        
        this.getShowDevicesArePremium = function () {
            return SkyLab.getShowDevicesArePremium();
        };

        this.showWhichMessage = function () {
            return SkyLab.showWhichMessage();
        };

        this.shouldShowWelcomeMessage = function () {
            return SkyLab.shouldShowWelcomeMessage();
        };

        this.setNewScreenshotsFlag = function () {
            return SkyLab.setNewScreenshotsFlag();
        };

        this.unsetNewScreenshotsFlag = function () {
            return SkyLab.unsetNewScreenshotsFlag();
        };

        this.getNewScreenshotsFlag = function () {
            return SkyLab.getNewScreenshotsFlag();
        };

        this.setScreenshotFolder = function (ssfolder) {
            return SkyLab.setScreenshotFolder(ssfolder);
        };

        this.getScreenshotFolder = function () {
            return SkyLab.getScreenshotFolder();
        };

        this.updatePreferences = function (prefs) {
            return SkyLab.updatePreferences(prefs);
        };

        this.handlePreferenceErrors = function (errors) {
            return SkyLab.handlePreferenceErrors(errors);
        };

        this.updateSubscriptionLevel = function (subscription) {
            return SkyLab.updateSubscriptionLevel(subscription);
        };

        this.handleSubscriptionErrors = function (errors) {
            return SkyLab.handleSubscriptionErrors(errors);
        };

        this.isFeatureEnabled = function (feature) {
            return SkyLab.isFeatureEnabled(feature);
        };

        this.setShowScreenshotsArePremium = function (state) {
            return SkyLab.setShowScreenshotsArePremium(state);
        };

        this.setShowDevicesArePremium = function (state) {
            return SkyLab.setShowDevicesArePremium(state);
        };
        
        this.stopShowingMessage = function (msgtype) {
            return SkyLab.stopShowingMessage(msgtype);
        };
    }

    SkyLabController = new ASLSkyLabController();

    function ASLSkyLabView() {
        this.riwindow = -1;
        this.ritab = -1;
        this.ridevice = '';
        this.risourcetab = -1;
        this.initiatingri = false;
        this.initiatingsv = false;
        this.fbwindow = -1;
        this._toasthandle = "";
        this.extensionport = {
            "devicemanager" : "",
            "popup" : "",
            "options" : ""
        };
        
        this._surveyLinkFree = "http://adobe.com/go/edgeinspect_nps_survey_free";
        this._surveyLinkPaid = "http://adobe.com/go/edgeinspect_nps_survey";
        this._surveyLink = this._surveyLinkFree;

        this.debug = function (message) {
            // Used to be a toast message
        };

        this.setSurveyLinkForSubscriptionLevel = function (subscription_level) {
            if (subscription_level === 'CS_LVL_2') {
                this._surveyLink = this._surveyLinkPaid;
            } else {
                this._surveyLink = this._surveyLinkFree;
            }
        };

        this.renderDeviceManagerConnect = function (name) {
        };

        this.renderPairingRequest = function () {
            SkyLabView.triggerDeviceWantsToPair();
        };

        this.dismissPairingRequest = function () {
            SkyLabView.closeToastWithHandle();
        };

        this.setBadgeIcon = function () {
            // This must be overloaded by the browser specific code
        };

        this.triggerFollowModeOn = function () {
            // This must be overloaded by the browser specific code
        };

        this.triggerFollowModeOff = function () {
            // This must be overloaded by the browser specific code
        };

        this.triggerFollowUrl = function () {
            // This must be overloaded by the browser specific code
        };

        this.triggerPasscodeInvalid = function (devices) {
            // This must be overloaded by the browser specific code.
        };

        this.triggerShowHostInfo = function () {
            // This must be overloaded by the browser specific code.
        };

        this.transferComplete = function (reqID) {
            // This must be overloaded by the browser specific code.
        };

        this.triggerFirstRunCheck = function () {
            // This must be overloaded by the browser specific code.
        };

        this.triggerPreferencesUpdated = function () {
            // This must be overloaded by the browser specific code.
        };

        this.triggerScreenshotFolderError = function () {
            // this must be overloaded by the browser specific code
        };

        this.getSurveyLink = function () {
            return this._surveyLink;
        };

        this.shouldFollowThisUrl = function () {
            // this should be overloaded by the browser specific code
            return true;
        };
    }

    SkyLabView = new ASLSkyLabView();

    if (typeof exports !== 'undefined') {
        exports.SkyLabView = SkyLabView;
        exports.SkyLab = SkyLab;
        exports.SkyLabController = SkyLabController;
        exports.isFullScreen = false;
    }

});
