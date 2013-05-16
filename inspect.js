/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50,  */
/*global brackets, require, define, Mustache, $, setInterval, window */

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        ProjectManager      = brackets.getModule("project/ProjectManager");
    
    var inspectHtml         = require("text!htmlContent/inspect.html"),
        SkyLabController    = require("lib/inspect/skylab").SkyLabController,
        SkyLabPopup         = require("lib/inspect/skylabpopup"),
        SkyLabView          = require("lib/inspect/skylabview"),
        Strings             = require("strings");
        
    var $inspect,
        $inspectPopoverArrow,
        inspectEnabled = false,
        inspectShown = false,
        deviceManagerInitialized = false,
        projectRoot,
        serverAddress,
        currentURL = null,
        nodeConnection = new NodeConnection(),
        inspectPromise;
    
    function inspectEvent(event) {
        var EVENT_NAMESPACE = ".edge-code-inspect";
        
        if (event === undefined) {
            return EVENT_NAMESPACE;
        } else if (arguments.length > 1) {
            return Array.prototype.slice
                .call(arguments)
                .map(function (elem) {
                    return inspectEvent(elem);
                })
                .join(" ");
        } else if (typeof event === "string") {
            return event + EVENT_NAMESPACE;
        }
    }
    
    function initDeviceManager() {
        console.log("Initializing device manager...");
        SkyLabView.initialize();
        SkyLabPopup.initInspect($inspect, Strings);
        SkyLabPopup.startListening();
        
        deviceManagerInitialized = true;
    }
    
    function refreshCurrentURL() {
        if (currentURL) {
            console.log("Refreshing URL: " + currentURL);
            SkyLabController.followUrl(currentURL, "false");
        }
    }
    
    function updateCurrentURL() {
        var document = DocumentManager.getCurrentDocument();
        
        if (document && document.file) {
            var fullPath    = document.file.fullPath,
                rootIndex   = fullPath.indexOf(projectRoot),
                relativePath;
            
            if (rootIndex === 0) {
                var language = LanguageManager.getLanguageForPath(fullPath);
                
                if (language.getId() === "html") {
                    relativePath = fullPath.substring(projectRoot.length - 1,
                                                      fullPath.length);
                    relativePath = encodeURIComponent(relativePath);
                    relativePath = relativePath.replace(/%2F/g, "/");
                    currentURL = "http://" + serverAddress.address + ":" +
                        serverAddress.port + relativePath;
                    
                    console.log("New URL: " + currentURL);
                    return true;
                }
            } else {
                throw new Error("Document root does not match project root",
                                projectRoot,
                                fullPath);
            }
        }
        return false;
    }

    function connectToNode() {
        console.log("Connecting to node...");
        if (nodeConnection.connected()) {
            return $.Deferred().resolve().promise();
        } else {
            return nodeConnection.connect(true);
        }
    }
    
    function loadDomains() {
        console.log("Loading domains...");
        if (nodeConnection.connected()) {
            var modulePath = ExtensionUtils.getModulePath(module, "node/InspectHTTPDomain");
            return nodeConnection.loadDomains([modulePath], true);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    function openHTTPServer(root) {
        console.log("Opening server connection...");
        if (nodeConnection.connected()) {
            return nodeConnection.domains.inspectHttpServer.getServer(root);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    function closeHTTPServer(root) {
        console.log("Closing server connection...");
        if (nodeConnection.connected()) {
            return nodeConnection.domains.inspectHttpServer.closeServer(root);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    function stopServer(root) {
        var deferred = $.Deferred();
        
        connectToNode().done(function () {
            loadDomains().done(function () {
                closeHTTPServer(root).done(function () {
                    console.log("Closed connection");
                    serverAddress = null;
                    deferred.resolve();
                }).fail(function () {
                    deferred.reject();
                });
            }).fail(function () {
                deferred.reject();
            });
        }).fail(function () {
            deferred.reject();
        });
        
        return deferred.promise();
    }
    
    function startServer(root) {
        var deferred = $.Deferred();
        
        connectToNode().done(function () {
            loadDomains().done(function () {
                openHTTPServer(root).done(function (address) {
                    console.log("Opened connection: " + JSON.stringify(address));
                    serverAddress = address;
                    deferred.resolve();
                }).fail(function () {
                    deferred.reject();
                });
            }).fail(function () {
                deferred.reject();
            });
        }).fail(function () {
            deferred.reject();
        });
        
        return deferred.promise();
    }
    
    function stopInspect(root) {
        var deferred = $.Deferred();
        
        inspectEnabled = false;
        currentURL = null;
        
        $(nodeConnection).off(inspectEvent());
        
        inspectPromise.done(function () {
            stopServer(root).done(function () {
                deferred.resolve();
            });
        }).fail(function () {
            inspectEnabled = true;
            deferred.reject();
            console.log("Failed to disable Inspect");
        });
        
        return deferred.promise();
    }
    
    function startInspect(root) {
        inspectEnabled = true;
        return startServer(projectRoot).done(function () {
            if (updateCurrentURL()) {
                refreshCurrentURL();
            }
            
            $(nodeConnection).on(inspectEvent("base.newDomains"), function () {
                console.log("New domains!");
                if (inspectEnabled) {
                    stopInspect(projectRoot);
                    inspectPromise = startInspect(projectRoot);
                }
            });
            
        }).fail(function () {
            inspectEnabled = false;
            console.log("Failed to enable Inspect");
        });
    }
        
    function onFollowToggle() {
        var $toolbarIcon = $("#inspect-toolbar");
        
        if (SkyLabPopup.getFollowState() === "on") {
            if (!inspectEnabled) {
                projectRoot = ProjectManager.getProjectRoot().fullPath;
                inspectPromise = startInspect(projectRoot);
                inspectPromise.done(function () {
                    $(ProjectManager)
                        .on(inspectEvent("beforeProjectClose", "beforeAppClose"), function () {
                            console.log("Changing project...");
                            if (inspectEnabled) {
                                stopInspect(projectRoot);
                                projectRoot = null;
                            }
                        })
                        .on(inspectEvent("projectOpen"), function (event, newProjectRoot) {
                            if (!inspectEnabled) {
                                projectRoot = newProjectRoot.fullPath;
                                console.log("New project: " + projectRoot);
                                inspectPromise = startInspect(projectRoot);
                            }
                        });
                    
                    $(DocumentManager)
                        .on(inspectEvent("documentSaved"), refreshCurrentURL)
                        .on(inspectEvent("currentDocumentChange"), function () {
                            inspectPromise.done(function () {
                                if (updateCurrentURL()) {
                                    refreshCurrentURL();
                                }
                            });
                        });
                    
                    $(window)
                        .on(inspectEvent("focus"), refreshCurrentURL);
                        
                    $toolbarIcon.addClass("active");
                }).fail(function () {
                    inspectEnabled = false;
                });
            } else {
                console.log("Toggle state switched on but Inspect is enabled");
            }
        } else {
            if (inspectEnabled) {
                stopInspect(projectRoot).done(function () {
                    $(ProjectManager).off(inspectEvent());
                    $(DocumentManager).off(inspectEvent());
                    $(window).off(inspectEvent());
                    $toolbarIcon.removeClass("active");
                });
            } else {
                console.log("Toggle state switched off but Inspect is disabled");
            }
        }
    }
    
    function hideControls() {
        $("#inspect, .inspectPopoverArrow").fadeOut(50, function () {
            $inspect.css("display", "");
            $inspect.removeClass("visible");
            $inspectPopoverArrow.css("display", "");
            $inspectPopoverArrow.removeClass("visible");
        });
        
        $(".content, .sidebar")
            .off(inspectEvent());
        inspectShown = false;
    }
    
    function showControls() {
        var $toolbarIcon    = $("#inspect-toolbar"),
            iconOffset      = $toolbarIcon.offset().top,
            inspectTop      = iconOffset - 20,
            arrowTop        = inspectTop + 22;
        
        if (!deviceManagerInitialized) {
            initDeviceManager();
        }
        
        $inspect.css("top", inspectTop);
        $inspectPopoverArrow.css("top", arrowTop);
        $inspect.addClass("visible");
        $inspectPopoverArrow.addClass("visible");
        
        $(".content, .sidebar")
            .on(inspectEvent("mousedown", "keyup"), hideControls);
        inspectShown = true;
    }
    
    function handleInspectControls() {
        if (inspectShown) {
            hideControls();
        } else {
            showControls();
        }
    }
    
    function initAdmin() {
        var $mainContent = Mustache.render(inspectHtml, Strings);
        $("body").append($mainContent);
        
        $inspect = $("#inspect");
        $inspectPopoverArrow = $(".inspectPopoverArrow");
        $inspect.on("Inspect:followtoggle", onFollowToggle);
        
        return nodeConnection.connect(true);
    }
    
    exports.initAdmin = initAdmin;
    exports.initDeviceManager = initDeviceManager;
    exports.handleInspectControls = handleInspectControls;
});
