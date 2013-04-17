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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, Mustache, less, setTimeout */

define(function (require, exports, module) {
    "use strict";
    
    // Modules
    var inspect                 = require("inspect"),
        inspectHtml             = require("text!htmlContent/inspect.html"),
        inspectToolbarHtml      = require("text!htmlContent/inspect-toolbar.html"),
        Strings                 = require("strings");

    var AppInit                 = brackets.getModule("utils/AppInit"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        StringUtils             = brackets.getModule("utils/StringUtils"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        CodeHintManager         = brackets.getModule("editor/CodeHintManager"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        Commands                = brackets.getModule("command/Commands"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        Menus                   = brackets.getModule("command/Menus");
    
    // DOM elements and HTML
    var $toolbarIcon = null,
        $inspectControls = "";
    
    
    var Paths = {
        ROOT : require.toUrl('./')
    };
    
    // Commands & Prefs Strings
    var COMMAND_HANDLE_INSPECT_CONTROLS = "edgeinspect.handleinspectcontrols";
    
    function _documentIsHTML(doc) {
        return doc && doc.getLanguage().getName() === "HTML";
    }
    
    function _showHowtoDialog() {
        Dialogs.showModalDialog("edge-web-fonts-howto-dialog");
    }
    
    function _handleGenerateInspectControls() {
        
    }

    function _handleToolbarClick() {
        var doc = DocumentManager.getCurrentDocument();
        CommandManager.execute(COMMAND_HANDLE_INSPECT_CONTROLS);

//        Put back when we get everything working        
//        if (!doc || !_documentIsHTML(doc)) {
//            console.log('Inspect should only work on HTML documents');
//            //_showHowtoDialog();
//        } else {
//            CommandManager.execute(COMMAND_HANDLE_INSPECT_CONTROLS);
//        }
    }
        
    function _handleDocumentChange() {
        var doc = DocumentManager.getCurrentDocument();
        // doc will be null if there's no active document (user closed all docs)
        if (doc && _documentIsHTML(doc)) {
            $toolbarIcon.addClass("active");
        } else {
            $toolbarIcon.removeClass("active");
        }
    }
    
    function init() {
        
        // load styles
        ExtensionUtils.loadStyleSheet(module, "styles/inspect.css");
        
        // register commands
        CommandManager.register(Strings.GENERATE_INSPECT_CONTROLS, COMMAND_HANDLE_INSPECT_CONTROLS, inspect.handleInspectControls);

        
        // set up toolbar icon
        $toolbarIcon = $(Mustache.render(inspectToolbarHtml, Strings));
        $("#main-toolbar .buttons").append($toolbarIcon);
        $toolbarIcon.on("click", _handleToolbarClick);
        
        // add event handler to enable/disable the webfont toolbar icon
        $(DocumentManager).on("currentDocumentChange", _handleDocumentChange);
        _handleDocumentChange(); // set to appropriate state for curret doc

    }

    // load everything when brackets is done loading
    AppInit.appReady(function () {
        inspect.init()
            .done(init) // only register commands if the core loaded properly
            .fail(function (err) {
                // TODO: Should probably keep trying at some interval -- may have failed because not connected to net
                console.log("[edge-inspect extension] failed to initialize: " + err);
            });
    });
});
