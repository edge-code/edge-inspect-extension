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
/*global brackets, require, define, Mustache, $, setTimeout, clearTimeout */


define(function (require, exports, module) {
    "use strict";

    var inspectHtml         = require("text!htmlContent/inspect.html"),
        EdgeInspect         = require('lib/inspect/skylab'),
        SkyLabController    = EdgeInspect.SkyLabController,
        EventMap            = require("lib/eventmap"),
        SkyLabPopup         = require("lib/inspect/skylabpopup"),
        SkyLabView          = require("lib/inspect/skylabview"),
        Strings             = require("strings");
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        Menus               = brackets.getModule("command/Menus"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager      = brackets.getModule("project/ProjectManager");
    
    var _ON_CLASS = "followOn",
        _OFF_CLASS = "followOff";

    var $mainContent,
        $inspect,
        $inspectPopoverArrow,
        inspectViewState = _OFF_CLASS,
        inspectEnabled = false,
        inspectShown = false;
    
    var projectRoot,
        serverAddress,
        currentURL = null,
        nodeConnection,
        inspectPromise;

    function _refreshCurrentURL() {
        if (currentURL) {
            console.log("Refreshing URL: " + currentURL);
            SkyLabController.followUrl(currentURL, "false");
        }
    }
    
    function _updateCurrentURL() {
        var document = DocumentManager.getCurrentDocument();
        
        if (document && document.file) {
            var fullPath    = document.file.fullPath,
                language    = LanguageManager.getLanguageForPath(fullPath),
                rootIndex   = fullPath.indexOf(projectRoot),
                relativePath;
            
            if (rootIndex === 0) {
                if (language.getId() === "html") {
                    relativePath = fullPath.substring(projectRoot.length - 1, fullPath.length);
                    relativePath = encodeURIComponent(relativePath);
                    relativePath = relativePath.replace(/%2F/g, "/");
                    currentURL = "http://" + serverAddress.address + ":" + serverAddress.port + relativePath;
                    
                    console.log("New URL: " + currentURL);
                    return true;
                }
            } else {
                console.log("Document root does not match project root");
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
    
    function startInspect(root) {
        inspectEnabled = true;
        return startServer(projectRoot).done(function () {
            if (_updateCurrentURL()) {
                _refreshCurrentURL();
            }
        });
    }
    
    function stopInspect(root) {
        var deferred = $.Deferred();
        
        inspectEnabled = false;
        currentURL = null;
        inspectPromise.done(function () {
            stopServer(root).done(function () {
                deferred.resolve();
            });
        });
        
        return deferred.promise();
    }

        
    function onFollowToggle(forceOff) {
        var $toolbarIcon = $("#inspect-toolbar");
        
        if (SkyLabPopup.getFollowState() === "on") {
            if (!inspectEnabled) {
                projectRoot = ProjectManager.getProjectRoot().fullPath;
                inspectPromise = startInspect(projectRoot);
                inspectPromise.done(function () {
                    $(ProjectManager)
                        .on("beforeProjectClose.edge-code-inspect beforeAppClose.edge-code-inspect", function () {
                            console.log("Changing project...");
                            if (inspectEnabled) {
                                stopInspect(projectRoot);
                                projectRoot = null;
                            }
                        })
                        .on("projectOpen.edge-code-inspect", function (event, newProjectRoot) {
                            if (!inspectEnabled) {
                                projectRoot = newProjectRoot.fullPath;
                                console.log("New project: " + projectRoot);
                                inspectPromise = startInspect(projectRoot);
                            }
                        });
                    
                    $(DocumentManager)
                        .on("documentSaved.edge-code-inspect", _refreshCurrentURL)
                        .on("currentDocumentChange.edge-code-inspect", function () {
                            inspectPromise.done(function () {
                                if (_updateCurrentURL()) {
                                    _refreshCurrentURL();
                                }
                            });
                        });
                        
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
                    $(ProjectManager).off(".edge-code-inspect");
                    $(DocumentManager).off(".edge-code-inspect");
                    $toolbarIcon.addClass("active");
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
        
        $(".content, .sidebar").off(".inspect");
        inspectShown = false;
    }
    
    function showControls() {
        var $toolbarIcon    = $("#inspect-toolbar"),
            iconOffset      = $toolbarIcon.offset().top,
            inspectTop      = iconOffset - 20,
            arrowTop        = inspectTop + 22;
        
        $inspect.css("top", inspectTop);
        $inspectPopoverArrow.css("top", arrowTop);
        $inspect.addClass("visible");
        $inspectPopoverArrow.addClass("visible");
        
        $(".content, .sidebar").on("click.inspect keyup.inspect", hideControls);
        inspectShown = true;
    }
    
    function handleInspectControls() {
        if (inspectShown) {
            hideControls();
        } else {
            showControls();
        }
    }
    
    function init() {
        var $mainContent = Mustache.render(inspectHtml, Strings);
        
        $("body").append($mainContent);
        $inspect = $("#inspect");
        $inspectPopoverArrow = $(".inspectPopoverArrow");
        $inspect.on("Inspect:followtoggle", onFollowToggle);

        SkyLabView.initialize();
        SkyLabPopup.initInspect($inspect);
        SkyLabPopup.startListening();
        
        nodeConnection = new NodeConnection();
        
        var connectionDeferred = nodeConnection.connect(true);
        connectionDeferred.done();
        
        return nodeConnection.connect();
    }
    
    exports.init = init;
    exports.handleInspectControls = handleInspectControls;
});