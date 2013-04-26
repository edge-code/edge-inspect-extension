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
        nodeConnection;

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
                    currentURL = "http://" + serverAddress.address + ":" + serverAddress.port + relativePath;
                    
                    console.log("Setting URL: " + currentURL);
                    _refreshCurrentURL();
                }
            } else {
                console.log("Document root does not match project root");
            }
        }
    }
    
    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 5000; // 30 seconds
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = $.Deferred();
    
    /**
     * @private
     * @type {NodeConnection}
     */
    var _nodeConnection = new NodeConnection();
    
   /**
    * Stop web server.
    */
    function stopServer(root) {
        if (_nodeConnection.connected()) {
            _nodeConnection.domains.inspectHttpServer.closeServer(root);
        }
    }
    
    /**
    * Start server with specified root.
    * @param root {string} Path to directory from where web server
    * serves content.
    */
    function startServer(root) {
        var deferred            = $.Deferred(),
            connectionTimeout   = setTimeout(function () {
                console.error("[InspectHTTPServer] Timed out while trying to connect to node");
                _nodeConnectionDeferred.reject();
            }, NODE_CONNECTION_TIMEOUT);
        
        _nodeConnection.connect(true).done(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/InspectHTTPDomain")],
                true
            ).done(function () {
                if (_nodeConnection.connected()) {
                    _nodeConnection.domains.inspectHttpServer.getServer(root).done(function (newAddress) {
                        console.log("New address: " + JSON.stringify(newAddress));
                        serverAddress = newAddress;
                        deferred.resolve();
                    }).fail(function () {
                        deferred.reject();
                    });
                } else {
                    deferred.reject();
                }
                
                clearTimeout(connectionTimeout);
                _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
            }).fail(function () { // Failed to connect
                console.error("[InspectHttpServer] Failed to connect to node", arguments);
                _nodeConnectionDeferred.reject();
                deferred.reject();
            });
        }).fail(function () {
            deferred.reject();
        });
        
        return deferred.promise();
    }
        
    function onFollowToggle() {
        var $toolbarIcon = $("#inspect-toolbar");
        
        if (SkyLabPopup.getFollowState() === "on") {
            if (!inspectEnabled) {
                
                startServer(projectRoot).done(function () {
                    _updateCurrentURL();
                    _refreshCurrentURL();
                    
                    $(ProjectManager)
                        .on("beforeProjectClose.edge-code-inspect beforeAppClose.edge-code-inspect", function () {
                            if (inspectEnabled) {
                                stopServer(projectRoot);
                            }
                        })
                        .on("projectOpen.edge-code-inspect", function (event, newProjectRoot) {
                            projectRoot = newProjectRoot.fullPath;
                            if (inspectEnabled) {
                                startServer(projectRoot);
                            }
                        });
                    
                    $(DocumentManager)
                        .on("currentDocumentChange.edge-code-inspect", _updateCurrentURL)
                        .on("documentSaved.edge-code-inspect", _refreshCurrentURL);
                    
                    $toolbarIcon.addClass("active");
                    inspectEnabled = true;
                });
                
            } else {
                console.log("Toggle state switched on but Inspect is enabled");
            }
        } else {
            if (inspectEnabled) {
                inspectEnabled = false;
                
                stopServer(projectRoot);
                
                $(DocumentManager).off(".edge-code-inspect");
                $(ProjectManager).off(".edge-code-inspect");
                
                $toolbarIcon.removeClass("active");
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
        
        projectRoot = ProjectManager.getProjectRoot().fullPath;
        nodeConnection = new NodeConnection();
        return nodeConnection.connect();
    }
    
    exports.init = init;
    exports.handleInspectControls = handleInspectControls;
});