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
        EventMap            = require("lib/eventmap"),
        SkylabPopup         = require("lib/inspect/skylabpopup"),
        SkylabView          = require("lib/inspect/skylabview");
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager");
    
    var INSPECT_URL = "http://127.0.0.1:8007/",
        _ON_CLASS = "followOn",
        _OFF_CLASS = "followOff",
        _skyLabInited = false;
    
    var $mainContent,
        $inspect,
        firstRun = false,
        inspectEnabled = false,
        inspectViewState = _OFF_CLASS,
        serverRoot = null,
        inspectShown = false;

    /**
    * Tell inspect to refresh.
    */
    function dispatchURLChange() {
        if (!serverRoot) {
            return;
        }
        var urlEvent = $.Event("Inspect:urlchange");
        urlEvent.inspectURL = INSPECT_URL;
        EventMap.publish(urlEvent);
    }
    

    /**
    * Start server with specified root.
    * @param root {string} Path to directory from where web server
    * serves content.
    */
    function startServer(root) {
        console.log('server start goes here');
//      TODO: implement server
//        root = root || this.getDefaultServerRoot();
//        if (root === this.serverRoot) {
//            return;
//        }
//        this.serverRoot = root;
//        var self = this;
//        reflowShell.app.startWebServer(this.serverRoot, function (code) {
//            self.publishRecreatePreview();
//        });
    }
    
    /**
    * Start web server if necessary and when HTML has been
    * generated, notify inspect.
    * @param evt Event with previewFolder parameter that points
    * to the path where HTML was generated.
    */
    function handleHTMLChange(evt) {
        if (evt && evt.previewFolder) {
            startServer(evt.previewFolder);
        }
        dispatchURLChange();
    }
    

    /**
    * Stop web server.
    */
    function stopServer() {
        serverRoot = null;
//        reflowShell.app.stopWebServer(function (code) {});
    }
    
    
    function listenForDocumentChanges() {
        var evtId = ".inspectView";
        EventMap.subscribe("Preview:htmlchange" + evtId, handleHTMLChange);
//        EventMap.subscribe("Undo:change" + evtId + " UndoManager:commited" + evtId, handleCanvasChanged);
//        EventMap.subscribe("AssetModel:imageWritten" + evtId, handleImageAdd);
//        EventMap.subscribe("project:load" + evtId, handleProjectLoad);
    }
    
    /**
    * Cleanup event handlers.
    */
    function stopListeningForDocumentChanges() {
        var evtId = ".inspectView";
        EventMap.unsubscribe("Preview:htmlchange" + evtId, handleHTMLChange);
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
        console.log('reposition popup event');
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
        publishInspectViewState("closed");
        inspectShown = false;
    }
    
    function beforeShow() {
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
        $mainContent = (Mustache.render(inspectHtml));
        $("body").append($mainContent);
        $inspect = $("#inspect");
        $inspect.on("Inspect:redraw", repositionPopup);
        $inspect.on("Inspect:followtoggle", onFollowToggle);
        return d.promise();
    }
    
    exports.init = init;
    exports.handleInspectControls = handleInspectControls;
});