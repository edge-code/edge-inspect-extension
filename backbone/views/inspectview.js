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
/*global define: false, $: false, _: false, Backbone: false, reflowShell: false */

define(function (require, exports, module) {
    "use strict";

    var PopoverView     = require("modules/propertiespanel/views/popoverview"),
        EventMap        = require("modules/utils/eventmap"),
        SkylabPopup     = require("inspectextension/skylabpopup"),
        SkylabView      = require("inspectextension/skylabview"),
        HTMLPreview     = require("modules/htmlpreview/htmlpreview"),
        InspectTemplate = require("text!modules/inspect/views/templates/inspect.html");

    var INSPECT_URL = "http://127.0.0.1:8007/",
        _ON_CLASS = "followOn",
        _OFF_CLASS = "followOff",
        _skyLabInited = false;

    var InspectView = PopoverView.extend({

        el: "#inspect",

        _templateText: InspectTemplate,

        firstRun: false,

        inspectEnabled: false,

        /**
         * @class Inspect view class.
         * @augments Backbone.View
         * @constructs
         */
        initialize: function () {
            PopoverView.prototype.initialize.call(this);
            this.template = _.template(this._templateText);
            _.bindAll(this);

            var evtId = ".inspectView";
            EventMap.subscribe("Inspect:followtoggle" + evtId, this.onFollowToggle);
            EventMap.subscribe("Inspect:redraw" + evtId, this.repositionPopup);
        },

        destroy: function () {
            EventMap.unsubscribe(".inspectView");
        },

        /**
         * Listen for changes that we want to notify Inspect about.
         * Any time an action is recorded in undo, when an image is
         * added or a project is loaded.
         */
        listenForDocumentChanges: function () {
            var evtId = ".inspectView";
            EventMap.subscribe("Preview:htmlchange" + evtId, this.handleHTMLChange);
            EventMap.subscribe("Undo:change" + evtId + " UndoManager:commited" + evtId, this.handleCanvasChanged);
            EventMap.subscribe("AssetModel:imageWritten" + evtId, this.handleImageAdd);
            EventMap.subscribe("project:load" + evtId, this.handleProjectLoad);
        },

        /**
         * Cleanup event handlers.
         */
        stopListeningForDocumentChanges: function () {
            var evtId = ".inspectView";
            EventMap.unsubscribe("Preview:htmlchange" + evtId, this.handleHTMLChange);
            EventMap.unsubscribe("Undo:change" + evtId + " UndoManager:commited" + evtId, this.handleCanvasChanged);
            EventMap.unsubscribe("AssetModel:imageWritten" + evtId, this.handleImageAdd);
            EventMap.unsubscribe("project:load" + evtId, this.handleProjectLoad);
        },

        render: function () {
            PopoverView.prototype.render.call(this);

            if (this.template === null) {
                this.template = _.template(this._templateText);
                this._templateText = null;
            }
            var finalHTML = this.template();
            this.$el.html(finalHTML);
            SkylabPopup.localize(this.$el);
            return this;
        },

        /**
         * Each call made to this function with the same id
         * clears any pending call that has not executed within
         * 150ms until it finally executes.
         * @param fn The function to execute.
         * @param id A unique string id identifying this
         * function.
         */
        executeOnceWithinTime: function (id, fn) {
            var self = this,
                intervalId = "pendingInterval" + id;
            if (this[intervalId]) {
                clearTimeout(this[intervalId]);
            }
            this[intervalId] = setTimeout(function () {
                self[intervalId] = null;
                fn();
            }, 150);

        },

        /**
         * Generate HTML as the design surface changes. The only time
         * this event fires unnecessarily is when we switch to a region.
         */
        handleCanvasChanged: function () {
            if (this.inspectEnabled) {
                //make sure we don"t send too many generate
                //html events in a short amount of time
                this.executeOnceWithinTime("genhtml", function () {
                    EventMap.publish("Preview:generateHTML");
                });
            }
        },

        /**
         * Recreate temp dir, copy assets, generate HTML.
         */
        recreateAfterDelay: function () {
            var self = this;
            this.executeOnceWithinTime("createhtml", function () {
                if (self.inspectEnabled) {
                    self.publishRecreatePreview();
                }
            });
        },

        /**
         * Recreate temp dir when an image is added via the
         * image tool, dropped onto the background image popover,
         * or when an image is changed via the image pane.
         */
        handleImageAdd: function () {
            if (this.inspectEnabled) {
                this.recreateAfterDelay();
            }
        },

        /**
         * Recreate after project load
         * (happens on new and open).
         */
        handleProjectLoad: function () {
            if (this.inspectEnabled) {
                this.recreateAfterDelay();
            }
        },

        getPopoverOptions: function () {
            return {
                position: "left",
                animateChange: false,
                verticalOffset: 28,
                horizontalOffset: -1,
                repositionX: true,
                repositionY: true,
                autoReposition: true
            };
        },

        /**
         * Start web server if necessary and when HTML has been
         * generated, notify inspect.
         * @param evt Event with previewFolder parameter that points
         * to the path where HTML was generated.
         */
        handleHTMLChange: function (evt) {
            if (evt && evt.previewFolder) {
                this.startServer(evt.previewFolder);
            }
            this.dispatchURLChange();
        },

        /**
         * Tell inspect to refresh.
         */
        dispatchURLChange: function () {
            if (!this.serverRoot) {
                return;
            }
            var urlEvent = $.Event("Inspect:urlchange");
            urlEvent.inspectURL = INSPECT_URL;
            EventMap.publish(urlEvent);
        },

        /**
         * Called whenever on/off is toggled in the
         * inspect popover.
         */
        onFollowToggle: function () {
            var oldEnabled = this.inspectEnabled;
            this.inspectEnabled = SkylabPopup.getFollowState() === "on";
            if (!oldEnabled && this.inspectEnabled) {
                this.listenForDocumentChanges();
                this.startServer();
            }
            if (oldEnabled && !this.inspectEnabled) {
                this.stopListeningForDocumentChanges();
                this.stopServer();
            }
            this.publishInspectOnOff();
            this.repositionPopup();
        },

        /**
         * Need to reposition our popup whenever popup changes size.
         */
        repositionPopup: function () {
            if (this.inspectShown && this.$target) {
                this.$target.popover("reposition");
            }
        },

        /**
         * @return {string} Path to the temporary directory where
         * HTML is generated for inspect.
         */
        getDefaultServerRoot: function () {
            return HTMLPreview.getPreviewPath().path;
        },

        /**
         * Start server with specified root.
         * @param root {string} Path to directory from where web server
         * serves content.
         */
        startServer: function (root) {
            root = root || this.getDefaultServerRoot();
            if (root === this.serverRoot) {
                return;
            }
            this.serverRoot = root;
            var self = this;
            reflowShell.app.startWebServer(this.serverRoot, function (code) {
                self.publishRecreatePreview();
            });
        },

        /**
         * Stop web server.
         */
        stopServer: function () {
            this.serverRoot = null;
            reflowShell.app.stopWebServer(function (code) {});
        },

        /**
         * Tell status bar that our state changed.
         * @param state {string} Can be _ON_CLASS or _OFF_CLASS.
         */
        publishInspectViewState: function (state) {
            if (this.inspectViewState === _ON_CLASS && state !== _OFF_CLASS) {
                return;
            }
            this.inspectViewState = state;
            var evt = $.Event("InspectView:change");
            evt.inspectState = state;
            EventMap.publish(evt);
        },

        /**
         * Notify world if we are on or off.
         */
        publishInspectOnOff: function () {
            if (this.inspectEnabled) {
                this.publishInspectViewState(_ON_CLASS);
            } else {
                this.publishInspectViewState(_OFF_CLASS);
            }
        },

        /**
         * Hide popup, reset inspectShown.
         */
        handleHiding: function () {
            this.$el.off("hiding", this.handleHiding);
            this.trigger("popoverClosed");
            this.publishInspectViewState("closed");
            this.inspectShown = false;
        },

        /**
         * Notify HTMLPreview to recreate temp dir
         * but never open Chrome or put sniffing code in.
         */
        publishRecreatePreview: function () {
            EventMap.publish("Preview:createSilent");
        },

        /**
         * Called before popup is shown - inits inspect
         * popup view and core.
         */
        beforeShow: function () {
            if (!this.firstRun) {
                this.firstRun = true;
                SkylabView.initialize();
                this.render();
                SkylabPopup.initInspect(this.$el);
            }
            if (!_skyLabInited) {
                _skyLabInited = true;
                SkylabPopup.startListening();
            }


        },

        /**
         * Show popup
         */
        show: function () {
            this.beforeShow();
            PopoverView.prototype.show.call(this);
            this.inspectShown = true;
            this.publishInspectViewState("open");
            this.$el.on("hiding", this.handleHiding);
        }
    });

    return InspectView;
});
