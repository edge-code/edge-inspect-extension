/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, waits, waitsFor, waitsForDone, runs, $, brackets, waitsForDone, spyOn, tinycolor, KeyEvent */

define(function (require, exports, module) {
    "use strict";
    
    var inspect         = require("inspect"),
        NodeConnection  = brackets.getModule("utils/NodeConnection"),
        FileUtils       = brackets.getModule("file/FileUtils"),
        SpecRunnerUtils = brackets.getModule("spec/SpecRunnerUtils");
    
    var testFolder     = FileUtils.getNativeModuleDirectoryPath(module) + "/unittest-files/";
    
    var CONNECT_TIMEOUT = 20000;
                
    function makeBaseUrl(serverInfo) {
        return "http://" + serverInfo.address + ":" + serverInfo.port;
    }
    
    function getUrl(serverInfo, path) {
        return $.get(makeBaseUrl(serverInfo) + path);
    }
    
    describe("Inspect", function () {
        
        // Unit tests for the underlying node HTTP server.
        describe("Inspect HTTP Server", function () {
            var nodeConnection,
                logs;
            
            beforeEach(function () {
                logs = [];
                
                if (!nodeConnection) {
                    runs(function () {
                        // wait for StaticServer/main to connect and load the StaticServerDomain
                        var promise = inspect.nodeConnection.connect(true);
                        promise.done(function () {
                            nodeConnection = inspect.nodeConnection;
                        });

                        waitsForDone(promise, "NodeConnection connected", CONNECT_TIMEOUT);
                    });

                    runs(function () {
                        $(nodeConnection).on("base.log", function (event, level, timestamp, message) {
                            logs.push({level: level, message: message});
                        });
                    });
                }
            });
            
            afterEach(function () {
                runs(function () {
                    nodeConnection.disconnect();
                    nodeConnection = null;
                });
            });
            
            it("should open a connection to node", function () {
                runs(function () {
                    expect(nodeConnection.connected()).toBe(true);
                });
            });
            
            it("should load inspectHttpServer domain", function () {
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                });
                
                runs(function () {
                    expect(nodeConnection.domains.hasOwnProperty("inspectHttpServer")).toBe(true);
                });
            });
            
            it("should open a server on a valid address", function () {
                var promise,
                    address;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });

                runs(function () {
                    promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var host = address.address,
                        port = address.port,
                        octets = host.split(".").map(function (o) { return parseInt(o, 10); });
                    
                    expect(port).toBeGreaterThan(1024);
                    expect(octets.length).toBe(4);
                    expect(octets[0]).toBeGreaterThan(-1);
                    expect(octets[0]).toBeLessThan(256);
                    expect(octets[1]).toBeGreaterThan(-1);
                    expect(octets[1]).toBeLessThan(256);
                    expect(octets[2]).toBeGreaterThan(-1);
                    expect(octets[2]).toBeLessThan(256);
                    expect(octets[3]).toBeGreaterThan(-1);
                    expect(octets[3]).toBeLessThan(256);
                });
            });
            
            it("should serve files over HTTP", function () {
                var address,
                    data;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });
                
                runs(function () {
                    var promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var promise = getUrl(address, "/folder1/index.html");
                    
                    promise.done(function (_data) {
                        data = _data;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    expect(data).toBe("This is a file in folder 1.");
                    inspect.closeHTTPServer(testFolder);
                });
            });
            
            it("should serve default files over HTTP", function () {
                var address,
                    data;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });
                
                runs(function () {
                    var promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var promise = getUrl(address, "/folder1/");
                    
                    promise.done(function (_data) {
                        data = _data;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    expect(data).toBe("This is a file in folder 1.");
                    inspect.closeHTTPServer(testFolder);
                });
            });
            
            it("should not serve directories over HTTP", function () {
                var address,
                    success;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });
                
                runs(function () {
                    var promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var promise = getUrl(address, "/folder2/"),
                        deferred = $.Deferred();
                    
                    promise.done(function () {
                        success = true;
                    }).fail(function () {
                        success = false;
                    }).always(function () {
                        deferred.resolve();
                    });
                    waitsForDone(deferred.promise());
                });
                
                runs(function () {
                    expect(success).toBe(false);
                    inspect.closeHTTPServer(testFolder);
                });
            });
            
            it("should serve files with the correct content type", function () {
                var address,
                    mimeType;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });
                
                runs(function () {
                    var promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var promise = getUrl(address, "/folder1/index.html");
                    
                    promise.done(function (data, status, jqXHR) {
                        mimeType = jqXHR.getResponseHeader("Content-Type");
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    expect(mimeType.indexOf("text/html")).toBe(0);
                });
                
                runs(function () {
                    var promise = getUrl(address, "/folder1/style.css");
                    
                    promise.done(function (data, status, jqXHR) {
                        mimeType = jqXHR.getResponseHeader("Content-Type");
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    expect(mimeType.indexOf("text/css")).toBe(0);
                    inspect.closeHTTPServer(testFolder);
                });
            });
            
            it("should close HTTP server", function () {
                var address,
                    success;
                
                runs(function () {
                    waitsForDone(inspect.loadDomain());
                    waitsForDone(inspect.openHTTPServer(testFolder));
                });
                
                runs(function () {
                    var promise = nodeConnection.domains.inspectHttpServer.getServer(testFolder);
                    promise.done(function (_address) {
                        address = _address;
                    });
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var promise = inspect.closeHTTPServer(testFolder);
                    waitsForDone(promise);
                });
                
                runs(function () {
                    var ajaxPromise = getUrl(address, "/folder1/index.html"),
                        deferred = $.Deferred();
                    
                    ajaxPromise.done(function () {
                        success = true;
                    }).fail(function () {
                        success = false;
                    }).always(function () {
                        deferred.resolve();
                    });
                    waitsForDone(deferred.promise());
                });
                
                runs(function () {
                    expect(success).toBe(false);
                });
            });
        });
    });
});
