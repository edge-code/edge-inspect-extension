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
/*global define */

define({
    "GENERATE_INSPECT_CONTROLS"                              : "edgeinspect.handleinspectcontrols",
    "TOGGLE_ON_IMG"                                          : "slideswitch_on.png",
    "TOGGLE_ON_IMG_HIDPI"                                    : "slideswitch_on@2x.png",
    "TOGGLE_OFF_IMG"                                         : "slideswitch_off.png",
    "TOGGLE_OFF_IMG_HIDPI"                                   : "slideswitch_off@2x.png",
    
   // for inspect
    "INSPECT_BUTTON"                                         : "Preview on devices using Edge Inspect CC",
    "INSPECT_waiting"                                        : "Waiting for a connection...",
    "INSPECT_syncbrowseoff"                                  : "Synchronized Browsing is off.",
    "INSPECT_dmerror"                                        : "Please start the Edge Inspect CC Application...",
    "INSPECT_getedgeinspect"                                 : "Get Edge Inspect CC.",
    "INSPECT_dmexpired"                                      : "<span class='code'>Edge Inspect CC</span> Has Expired. Please Download a new version.",
    "INSPECT_subscriptionexpiredPrefix"                      : "You no longer have access to Edge Inspect CC full version features.",
    "INSPECT_subscriptionexpiredSuffix"                      : " or continue with limited features.",
    "INSPECT_screenshotsarepremiumPrefix"                    : "Screenshots are an Edge Inspect CC full version feature.",
    "INSPECT_seconddeviceispremiumPrefix"                    : "Use of multiple devices is an Edge Inspect CC full version feature.",
    "INSPECT_renewlink"                                      : "Renew now",
    "INSPECT_upgradelink"                                    : "Upgrade now to connect multiple devices concurrently.",
    "INSPECT_buyitnowPrefix"                                 : "You are currently using Edge Inspect CC Free. Login or ",
    "INSPECT_upgrade"                                        : "Upgrade",
    "INSPECT_buyitnowSuffix"                                 : " to use the Full version.",
    "INSPECT_shadmessagePrefix"                              : "Help us improve by filling out",
    "INSPECT_shadmessageSuffix"                              : "this two-question survey",
    "INSPECT_welcomemessage"                                 : "This is a friendly reminder to let you know that a major update is coming soon; all <span class='code'>$arg1$</span> apps must be updated in order to work.",
    "INSPECT_welcomeaction"                                  : "Continue",
    "INSPECT_feedback"                                       : "Satisfied with <span class='code'>Edge Inspect CC</span>?",
    "INSPECT_remove"                                         : "Authorized Devices",
    "INSPECT_problems"                                       : "Need help?",
    "INSPECT_removetext"                                     : "Deauthorize a device to prevent automatic reconnection.",
    "INSPECT_cancelscreenshot"                               : "Cancel transfer",
    "INSPECT_completedscreenshot"                            : "Screenshot(s) transferred",
    "INSPECT_downloadiso"                                    : "<span class='code'>Edge Inspect CC</span> for <span class='code'>iPad&reg;, iPhone&reg;</span> and <span class='code'>iPod&reg;</span>...",
    "INSPECT_downloadandroid"                                : "<span class='code'>Edge Inspect CC</span> for <span class='code'>Android&trade;</span> devices...",
    "INSPECT_downloadamazon"                                 : "<span class='code'>Edge Inspect CC</span> for <span class='code'>Kindle</span> devices...",
    "INSPECT_emptylog"                                       : "Clear",
    "INSPECT_versioninfo"                                    : "DM Build: ",
    "INSPECT_screenshotsfoldertitle"                         : "Screenshots Folder",
    "INSPECT_change"                                         : "Change",
    "INSPECT_logtitle"                                       : "Log",
    "INSPECT_weinretitle"                                    : "weinre Server",
    "INSPECT_weinredefault"                                  : "Default (Adobe)",
    "INSPECT_weinrecustom"                                   : "Custom",
    "INSPECT_weinreexample"                                  : "e.g., localhost:8080, or 172.18.5.4:8081",
    "INSPECT_save"                                           : "Save",
    "INSPECT_edit"                                           : "Edit",
    "INSPECT_remove_tt"                                      : "Remove",
    "INSPECT_disconnect_tt"                                  : "Disconnect",
    "INSPECT_default_passcode"                               : "Passcode",
    "INSPECT_cancel_tt"                                      : "Cancel",
    "INSPECT_deauthorize_tt"                                 : "De-Authorize",
    "INSPECT_authorize_tt"                                   : "Authorize",
    "INSPECT_remoteinspect_tt"                               : "Remote Inspection",
    "INSPECT_progress_tt"                                    : "Screenshot progress",
    "INSPECT_screenshotfolder_tt"                            : "Open folder containing screenshots",
    "INSPECT_screenshot_tt"                                  : "Request screenshots",
    "INSPECT_forcerefresh_tt"                                : "Refresh all devices",
    "INSPECT_showchrome_tt"                                  : "Exit full screen on devices",
    "INSPECT_fullscreen_tt"                                  : "Show full screen on devices",
    "INSPECT_browsingon_tt"                                  : "Turn Off Synchronized Browsing",
    "INSPECT_browsingtooltipNoDM_tt"                         : "Disabled",
    "INSPECT_browsingoff_tt"                                 : "Turn On Synchronized Browsing",
    "INSPECT_gettingstartedintroheader"                      : "Edge Inspect CC Getting Started Guide",
    "INSPECT_gettingstartedintro"                            : "Edge Inspect CC is for web designers and developers targeting mobile browsers. After installing Edge Inspect, you will be able to pair devices, have them browse in sync with your computer, perform remote inspection/debugging and see HTML/CSS/JavaScript changes instantly on your device. ",
    "INSPECT_gettingstartedsamenetworkheader"                : "1. Ensure Devices are on the Same Network",
    "INSPECT_gettingstartedsamenetwork"                      : "Edge Inspect requires your computer and devices to be on the same network. Computer and devices must be on the same subnet for auto-discovery. If you cannot see your computer, try a Manual Connection.",
    "INSPECT_gettingstartedconnectingheader"                 : "2. Connecting Devices to computer",
    "INSPECT_gettingstartedconnectingautodiscoveryheader"    : "A. Auto-Discovery",
    "INSPECT_gettingstartedconnectingautodiscovery"          : "The device running Edge Inspect will look for computers also running Edge Inspect. Tap the computer you would like to connect to. Enter the passcode into the Chrome Extension. This creates a wireless connection between your computer and device",
    "INSPECT_gettingstartedconnectingmanualconnectionheader" : "B. Manual Connection",
    "INSPECT_gettingstartedconnectingmanualconnectionp1"     : "If you can't find the computer you want to connect to, tap the \"+\" button to perform a Manual Connect. A list of IP Addresses associated with your computer is located at the bottom of the Chrome Extension. Insert the IP Address into the text field on the device.",
    "INSPECT_gettingstartedconnectingmanualconnectionp2"     : "When a device is connected, Edge Inspect CC will prevent the screen from dimming or going to sleep.",
    "INSPECT_gettingstartedremoteinspectionheader"           : "3. Inspecting &amp; debugging the page on your device",
    "INSPECT_gettingstartedremoteinspection"                 : " In the Chrome Extension, click on the \"&lt; &gt;\" button next to the device you'd like to inspect or debug and the Developer Tools window will open; you can use remote inspection on one device at a time.",

    "PRODUCT_NAME"                                           : "Edge Inspect",
    "DIALOG_DONE"                                            : "Done",
    "HOWTO_INTRO"                                            : "Adobe Edge Inspect is for web designers and developers targeting mobile browsers.  Installing Edge Inspect allows you to preview content across multiple mobile devices. Wirelessly pair multiple iOS and Android devices to your computer, grab screenshots from any connected device, and see real-time results from changes to HTML, CSS, and JavaScript.",
    "HOWTO_INSTRUCTIONS_1"                                   : "Install Edge Inspect on your device, and check that your device and computer are on the same network.  Both must be on the same subnet for auto-discovery.",
    "HOWTO_INSTRUCTIONS_2"                                   : "If the device can't find your computer, use manual connection (+ button on the device).  Use your computer's IP Address or Host Name as displayed on the Edge Inspect extension, as shown above.",
    "HOWTO_INSTRUCTIONS_3"                                   : "Once connected, Edge Inspect will preview the page on your device.  It will also keep the screen from dimming or going to sleep during preview.",
    "HOWTO_DIAGRAM_IMAGE"                                    : "img/EdgeInspectInstructionImage.png",
    "HOWTO_DIAGRAM_IMAGE_HIDPI"                              : "img/EdgeInspectInstructionImage@2x.png",
    "INSPECT_showhowto"                                      : "Getting started...",
    "INSPECT_needhelp"                                       : "<a href='http://forums.adobe.com/community/edge_inspect'>Need help? Ask the Adobe Community...</a>"
});
