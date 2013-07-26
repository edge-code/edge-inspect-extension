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
        ProjectManager      = brackets.getModule("project/ProjectManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    
    var inspectHtml         = require("text!htmlContent/inspect.html"),
        SkyLabController    = require("lib/inspect/skylab").SkyLabController,
        SkyLabPopup         = require("lib/inspect/skylabpopup"),
        SkyLabView          = require("lib/inspect/skylabview"),
        Strings             = require("strings");
    
    var Dialogs             = brackets.getModule("widgets/Dialogs"),
        inspectHowtoDialogHtml  = require("text!htmlContent/inspect-howto-dialog.html");
        
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
    
    var prefs = PreferencesManager.getPreferenceStorage(module);
    //TODO: Remove preferences migration code
    PreferencesManager.handleClientIdChange(prefs, "com.adobe.brackets.edge-inspect-extension");
    
    /**
     * For a given event name, build a new event name from within the Inspect
     * namespace. The parameter is optional and, if provided, can either be a
     * single String or an array of Strings. If no parameter is provided, the 
     * namespace is returned. If a single name is provide, a single scoped name
     * is returned. If an array of names are passed, an array of scoped names
     * is returned.
     */
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
    
    /**
     * Initialize the connection to the Inspect device manager.
     */
    function initDeviceManager() {
        SkyLabView.initialize();
        SkyLabPopup.initInspect($inspect, Strings);
        SkyLabPopup.startListening();
        
        deviceManagerInitialized = true;
    }
    
    /**
     * Request that the device manager direct clients to the current URL. This
     * has the effect of refreshing and synchronizing clients. (Note though that
     * this does not direct the clients to clear their cache.)
     */
    function refreshCurrentURL() {
        if (currentURL) {
            SkyLabController.followUrl(currentURL, "false");
        }
    }
    
    /**
     * Calculate and record a URL for the current document. If the document is
     * an HTML file, the URL will point to that file. Otherwise, it will not 
     * change the URL.
     *
     * @return boolean - true if the URL has changed; false otherwise.
     */
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

    /**
     * Initialize the connection to the Node process.
     * 
     * @return jQuery.Promise - Resolves when the connection is open.
     */
    function connectToNode() {
        if (nodeConnection.connected()) {
            return $.Deferred().resolve().promise();
        } else {
            return nodeConnection.connect(true);
        }
    }
    
    /**
     * Load the Inspect HTTP server domain into the Node process. The Node
     * connection should be opened before attempting to load the Inspect HTTP
     * server domain.
     * 
     * @return jQuery.Promise - Resolves once the domains are successfully loaded.
     */
    function loadDomain() {
        if (nodeConnection.connected()) {
            var modulePath = ExtensionUtils.getModulePath(module, "node/InspectHTTPDomain");
            return nodeConnection.loadDomains([modulePath], true);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    /**
     * Open a connection to the Inspect HTTP server from the Node process. The
     * Inspect HTTP domain should be loaded before attempting to open a 
     * connection to the HTTP server. 
     * 
     * @param String root - The filesystem root from which the HTTP server
     *      should serve files.
     * @return jQuery.Promise - Resolves with a reference to the HTTP server.
     */
    function openHTTPServer(root) {
        if (nodeConnection.connected()) {
            return nodeConnection.domains.inspectHttpServer.getServer(root);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    /** 
     * Close a connection to the HTTP server from the Node process. The
     * Inspect HTTP domain should be loaded before attempting to close a 
     * connection to the HTTP server.
     *
     * Note that it can take a very long time for this promise to resolve.
     * This is because the close event is not emitted by the Node HTTP server
     * until all clients have disconnected. And because of HTTP Keep-Alive,
     * this can take a long time.
     * 
     * @param String root - The filesystem root from which the HTTP server
     *      serves the files.
     * @return jQuery.Promise - Resolves when the HTTP server is closed.
     */
    function closeHTTPServer(root) {
        if (nodeConnection.connected()) {
            return nodeConnection.domains.inspectHttpServer.closeServer(root);
        } else {
            return $.Deferred().reject().promise();
        }
    }
    
    /**
     * Stop an HTTP server at a given filesystem root. This helper function
     * performs the following steps in order:
     *  1. Connects to the Node process
     *  2. Ensures that the Inspect HTTP domain has been loaded
     *  3. Closes the HTTP server at the given filesystem root.
     * Note that it can take a very long time for this promise to resolve. See
     * the comment at closeHTTPServer above.
     * 
     * @param String root - The filesystem root from which the HTTP server
     *      serves the files.
     * @return jQuery.Promise - Resolves when the HTTP server is closed.
     */
    function stopServer(root) {
        var deferred = $.Deferred();
        
        connectToNode().done(function () {
            loadDomain().done(function () {
                closeHTTPServer(root).done(function (path) {
                    serverAddress = null;
                    deferred.resolve();
                }).fail(function (path) {
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
    
    /**
     * Start an HTTP server at a given filesystem root. This helper function
     * performs the following steps in order:
     *  1. Connects to the Node process
     *  2. Loads the Inspect HTTP domain into the Node process
     *  3. Starts an HTTP server at the given filesystem root.
     * 
     * @param String root - The filesystem root from which the HTTP server
     *      serves the files.
     * @return jQuery.Promise - Resolves when the HTTP server is open.
     */
    function startServer(root) {
        var deferred = $.Deferred();
        
        connectToNode().done(function () {
            loadDomain().done(function () {
                openHTTPServer(root).done(function (address) {
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
    
    /**
     * Disable Inspect at the given filesystem root. Note that it can take a
     * very long time for this promise to resolve. See the comment at 
     * closeHTTPServer above.
     * 
     * @param String root - The filesystem root at which Inspect is enabled.
     * @return jQuery.Promise - Resolves when Inspect is disabled.
     */
    function stopInspect(root) {
        var deferred = $.Deferred();
        
        inspectEnabled = false;
        currentURL = null;
        
        $(nodeConnection).off(inspectEvent());
        
        inspectPromise.done(function () {
            stopServer(root).done(function () {
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
        }).fail(function () {
            inspectEnabled = true;
            deferred.reject();
        });
        
        return deferred.promise();
    }
    
    /**
     * Enable Inspect at the given filesystem root.
     * 
     * @param String root - The filesystem root at which Inspect will be enabled.
     * @return jQuery.Promise - Resolves when Inspect is enabled.
     */
    function startInspect(root) {
        inspectEnabled = true;
        return startServer(projectRoot).done(function () {
            if (updateCurrentURL()) {
                refreshCurrentURL();
            }

            // This event is fired if new domains are added to the node connection,
            // which happens, e.g., if node is restarted. To be on the safe side, 
            // we restart everything when this happens.
            $(nodeConnection).on(inspectEvent("base.newDomains"), function () {
                if (inspectEnabled) {
                    stopInspect(projectRoot);
                    inspectPromise = startInspect(projectRoot);
                }
            });
            
        }).fail(function () {
            inspectEnabled = false;
        });
    }
    
    /**
     * Handle the Inspect follow toggle event by either enabling or disabling
     * Inspect for the current project root.
     */
    function onFollowToggle() {
        var $toolbarIcon = $("#inspect-toolbar");
        
        if (SkyLabPopup.getFollowState() === "on") {
            if (!inspectEnabled) {
                projectRoot = ProjectManager.getProjectRoot().fullPath;
                inspectPromise = startInspect(projectRoot);
                inspectPromise.done(function () {
                    $(ProjectManager)
                        .on(inspectEvent("beforeProjectClose", "beforeAppClose"), function () {
                            if (inspectEnabled) {
                                stopInspect(projectRoot);
                                projectRoot = null;
                            }
                        })
                        .on(inspectEvent("projectOpen"), function (event, newProjectRoot) {
                            if (!inspectEnabled) {
                                projectRoot = newProjectRoot.fullPath;
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
            }
        } else {
            if (inspectEnabled) {
                stopInspect(projectRoot);
                // Note that we don't wait for for this to finish because
                // stopping the underlying HTTP server can take a very long time
                $(ProjectManager).off(inspectEvent());
                $(DocumentManager).off(inspectEvent());
                $(window).off(inspectEvent());
                $toolbarIcon.removeClass("active");
            }
        }
    }
    
    /**
     * Hide the Inspect popover.
     */
    function hideControls() {
        $("#inspect, .inspectPopoverArrow").fadeOut(50, function () {
            $inspect.css("display", "");
            $inspect.removeClass("visible");
            $inspectPopoverArrow.css("display", "");
            $inspectPopoverArrow.removeClass("visible");
            $(SkyLabController).trigger("close.popup");
        });
        
        $("body").off(inspectEvent());
        inspectShown = false;
    }

    /**
     * Show the Inspect popover.
     */
    function showControls() {
        var $toolbarIcon    = $("#inspect-toolbar"),
            iconOffset      = $toolbarIcon.offset().top,
            inspectTop      = iconOffset - 20,
            arrowTop        = inspectTop + 22;
        
        function handleInput(event) {
            function inTree($jqObj) {
                return $jqObj[0] === event.target ||
                    $jqObj.find(event.target).length > 0;
            }
            if (!inTree($inspect) &&
                    !inTree($inspectPopoverArrow) &&
                    !inTree($toolbarIcon)) {
                hideControls();
            }
        }
        
        if (!deviceManagerInitialized) {
            initDeviceManager();
        }
        
        $inspect.css("top", inspectTop);
        $inspectPopoverArrow.css("top", arrowTop);
        $inspect.addClass("visible");
        $inspectPopoverArrow.addClass("visible");
        
        $("body").on(inspectEvent("keyup", "mousedown"), handleInput);
        inspectShown = true;
    }
    
    var Paths = {
        ROOT : require.toUrl('./')
    };
    
    // Rendered templates
    var inspectHowtoDialogTemplate = Mustache.render(inspectHowtoDialogHtml, {Strings : Strings, Paths : Paths});
    
    // work around a URL jQuery URL escaping issue
    var howtoDiagramURL      = Mustache.render("{{{Paths.ROOT}}}{{{Strings.HOWTO_DIAGRAM_IMAGE}}}", {Strings : Strings, Paths : Paths}),
        howtoDiagramHiDPIURL = Mustache.render("{{{Paths.ROOT}}}{{{Strings.HOWTO_DIAGRAM_IMAGE_HIDPI}}}", {Strings : Strings, Paths : Paths});
    
    // show how-to dialog with" Getting Started" instructions    
    function showHowtoDialog() {
        var dlg = Dialogs.showModalDialogUsingTemplate(inspectHowtoDialogTemplate);
        dlg.getElement().find(".close").on("click", dlg.close.bind(dlg));
        
        $(".inspect-howto-diagram").css("background-image", "-webkit-image-set(url('" + howtoDiagramURL + "') 1x, url('" + howtoDiagramHiDPIURL + "') 2x)");
    }
    
    /**
     * Show or hide the Inspect popover depending on its current state.
     */
    function handleInspectControls() {
        if (!prefs.getValue("hasShownGettingStarted")) {
            // only display the Getting Started dialog once
            showHowtoDialog();
            prefs.setValue("hasShownGettingStarted", true);
        } else {
            if (inspectShown) {
                hideControls();
            } else {
                showControls();
            }
        }
    }
    
    /**
     * Initialize this Inspect administrator. Adds the Inspect popover to the
     * DOM and connects to the Node process.
     * 
     * @return jQuery.Promise - Resolves once the connection to the Node 
     *      process is open.
     */
    function initAdmin() {
        var $mainContent = Mustache.render(inspectHtml, Strings);
        $("body").append($mainContent);
        
        $inspect = $("#inspect");
        $inspectPopoverArrow = $(".inspectPopoverArrow");
        $inspect.on("Inspect:followtoggle", onFollowToggle);
        $inspect.on("Inspect:refreshCurrentUrl", function () {
            if (inspectEnabled) {
                refreshCurrentURL();
            }
        });
        
        return nodeConnection.connect(true);
    }
    
    exports.initAdmin = initAdmin;
    exports.initDeviceManager = initDeviceManager;
    exports.handleInspectControls = handleInspectControls;
    exports.showHowtoDialog = showHowtoDialog;
    
    // for unit testing
    exports.nodeConnection = nodeConnection;
    exports.connectToNode = connectToNode;
    exports.loadDomain = loadDomain;
    exports.openHTTPServer = openHTTPServer;
    exports.closeHTTPServer = closeHTTPServer;
});
