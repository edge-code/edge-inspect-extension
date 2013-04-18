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
        SkylabPopup         = require("lib/inspect/skylabpopup"),
        SkylabView          = require("lib/inspect/skylabview"),
        Strings             = require("strings");
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        Menus               = brackets.getModule("command/Menus"),
        NodeConnection      = brackets.getModule("utils/NodeConnection"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        ProjectManager       = brackets.getModule("project/ProjectManager");
    
    var INSPECT_URL = "http://127.0.0.1:8007/",
        _ON_CLASS = "followOn",
        _OFF_CLASS = "followOff",
        _skyLabInited = false;

    var $mainContent,
        $inspect,
        $inspectPopoverArrow,
        docurl = "",
        firstRun = false,
        inspectEnabled = false,
        inspectViewState = _OFF_CLASS,
        serverRoot = null,
        inspectShown = false;

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
     * @private
     * Callback for "request" event handlers to override the HTTP ServerResponse.
     */
    function _send(location) {
        return function (resData) {
            if (_nodeConnection.connected()) {
                return _nodeConnection.domains.inspectHttpServer.writeFilteredResponse(location.root, location.pathname, resData);
            }

            return new $.Deferred().reject().promise();
        };
    }
    
    function _getNodeConnectionDeferred() {
        return _nodeConnectionDeferred;
    }
    
    /**
    * Start server with specified root.
    * @param root {string} Path to directory from where web server
    * serves content.
    */
    function startServer(root) {
        var connectionTimeout = setTimeout(function () {
            console.error("[InspectHTTPServer] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        _nodeConnection.connect(true).then(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/InspectHTTPDomain")],
                true
            ).then(
                function () {
                    $(_nodeConnection).on("inspectHttpServer.requestFilter", function (event, request) {
                        console.log(request);
                        /* create result object to pass to event handlers */
                        var requestData = {
                            headers     : request.headers,
                            location    : request.location,
                            send        : _send(request.location)
                        };
                    });

                    // if we're spun up correctly lets get down to business
                    var readyToServeDeferred = $.Deferred(),
                        self = this;

                    if (_nodeConnection.connected()) {
                        self.root = ProjectManager.getProjectRoot().fullPath;

                        _nodeConnection.domains.inspectHttpServer.getServer(self.root).done(function (address) {
                            // Once we successfully have a server, trigger a URL change to load the URL of our document.
                            $inspect.trigger("Inspect:urlchange", docurl);
                            readyToServeDeferred.resolve();
                        }).fail(function () {
                            readyToServeDeferred.reject();
                        });
                    } else {
                        readyToServeDeferred.reject();
                    }
                    
                    clearTimeout(connectionTimeout);
                    _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
                },
                function () { // Failed to connect
                    console.error("[InspectHttpServer] Failed to connect to node", arguments);
                    _nodeConnectionDeferred.reject();
                }
            );
        });
    }
    

    /**
    * Stop web server.
    */
    function stopServer() {
        // Start up the node connection, which is held in the
        // _nodeConnectionDeferred module variable. (Use 
        // _nodeConnectionDeferred.done() to access it.

        

        
        serverRoot = null;
//        reflowShell.app.stopWebServer(function (code) {});
    }
    
    
    function _onDocumentChange() {
        var projectRoot = ProjectManager.getProjectRoot().fullPath;
        var doc = DocumentManager.getCurrentDocument().file.fullPath;
        
        docurl = doc.substring(projectRoot.length, doc.length);
        $inspect.trigger("Inspect:urlchange", docurl);
    }
    
    function _onDocumentSaved() {
        var projectRoot = ProjectManager.getProjectRoot().fullPath;
        var doc = DocumentManager.getCurrentDocument().file.fullPath;
        
        docurl = doc.substring(projectRoot.length, doc.length);
        $inspect.trigger("Inspect:urlchange", docurl);
    }
    
    function listenForDocumentChanges() {
        $(DocumentManager).on("currentDocumentChange", _onDocumentChange)
            .on("documentSaved", _onDocumentSaved);
        /*
                $(DocumentManager).on("currentDocumentChange", _onDocumentChange)
            .on("documentSaved", _onDocumentSaved)
        */
//        EventMap.subscribe("Undo:change" + evtId + " UndoManager:commited" + evtId, handleCanvasChanged);
//        EventMap.subscribe("AssetModel:imageWritten" + evtId, handleImageAdd);
//        EventMap.subscribe("project:load" + evtId, handleProjectLoad);
    }
    
    /**
    * Cleanup event handlers.
    */
    function stopListeningForDocumentChanges() {
        $(DocumentManager).off("currentDocumentChange", _onDocumentChange)
            .off("documentSaved", _onDocumentSaved);
//        EventMap.unsubscribe("Undo:change" + evtId + " UndoManager:commited" + evtId, this.handleCanvasChanged);
//        EventMap.unsubscribe("AssetModel:imageWritten" + evtId, this.handleImageAdd);
//        EventMap.unsubscribe("project:load" + evtId, this.handleProjectLoad);
    }
    

    /**
    * Tell status bar that our state changed.
    * @param state {string} Can be _ON_CLASS or _OFF_CLASS.
    */
    function publishInspectViewState(state) {
        if (inspectViewState === _ON_CLASS && state !== _OFF_CLASS) {
            return;
        }
        inspectViewState = state;
    }
    
    /**
    * Notify world if we are on or off.
    */
    function publishInspectOnOff() {
        if (inspectEnabled) {
            publishInspectViewState(_ON_CLASS);
        } else {
            publishInspectViewState(_OFF_CLASS);
        }
    }
    
    /**
    * Need to reposition our popup whenever popup changes size.
    */
    function repositionPopup(event) {
//        if (inspectShown && $target) {
//            $target.popover("reposition");
//        }
    }
    
    function onFollowToggle() {
        var oldEnabled = inspectEnabled;
        
        inspectEnabled = SkylabPopup.getFollowState() === "on";
        if (!oldEnabled && inspectEnabled) {
            listenForDocumentChanges();
            startServer();
        }
        if (oldEnabled && !inspectEnabled) {
            stopListeningForDocumentChanges();
            stopServer();
        }
        publishInspectOnOff();
        repositionPopup();
    }


    /**
    * Hide popup, reset inspectShown.
    */
    function handleHiding() {
        $inspect.removeClass("visible");
        $inspectPopoverArrow.removeClass("visible");
        publishInspectViewState("closed");
        inspectShown = false;
    }
    
    function beforeShow() {
        /* RCS - is there an easier way to do this?
        * One that would require me not doing it in three places?
        * Put it in init() and save these values?
        * TBD
        */
        var projectRoot = ProjectManager.getProjectRoot().fullPath;
        var doc = DocumentManager.getCurrentDocument().file.fullPath;
        docurl = doc.substring(projectRoot.length, doc.length);
        
        if (!firstRun) {
            firstRun = true;
            
            SkylabView.initialize();
            inspectShown = true;
            publishInspectViewState("open");
            $inspect.on("hiding", handleHiding);
            SkylabPopup.initInspect($inspect);
        }
        if (!_skyLabInited) {
            _skyLabInited = true;
            SkylabPopup.startListening();
        }
    }
    
    function handleInspectControls() {
        if (inspectShown) {
            handleHiding();
        } else {
            beforeShow();
            inspectShown = true;
            publishInspectViewState("open");
            $inspect.addClass("visible");
            $inspectPopoverArrow.addClass("visible");
        }
    }

    /**
    * Notify HTMLPreview to recreate temp dir
    * but never open Chrome or put sniffing code in.
    */
    function publishRecreatePreview() {
        EventMap.publish("Preview:createSilent");
    }
    
    function init() {
        var d = $.Deferred();
        var evtId = ".inspectView";
        d.resolve();
        $mainContent = (Mustache.render(inspectHtml, Strings));
        $("body").append($mainContent);
        $inspect = $("#inspect");
        $inspectPopoverArrow = $(".inspectPopoverArrow");
        $inspect.on("Inspect:redraw", repositionPopup);
        $inspect.on("Inspect:followtoggle", onFollowToggle);
        return d.promise();
    }
    
    exports.init = init;
    exports.handleInspectControls = handleInspectControls;
});