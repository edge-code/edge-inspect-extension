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
	"GENERATE_INSPECT_CONTROLS": "edgeinspect.handleinspectcontrols",
	"TOGGLE_ON_IMG": "slideswitch_on_localized.png",
	"TOGGLE_ON_IMG_HIDPI": "slideswitch_on_localized@2x.png",
	"TOGGLE_OFF_IMG": "slideswitch_off_localized.png",
	"TOGGLE_OFF_IMG_HIDPI": "slideswitch_off_localized@2x.png",
    
   // for inspect
	"INSPECT_BUTTON": "Edge Inspect CC を使用してデバイス上でプレビューを実行",
	"INSPECT_waiting": "接続を待っています...",
	"INSPECT_syncbrowseoff": "同期ブラウジングはオフになっています。",
	"INSPECT_dmerror": "Edge Inspect CC アプリケーションを起動してください...",
	"INSPECT_getedgeinspect": "Edge Inspect CC を入手しましょう。",
	"INSPECT_dmexpired": "<span class='code'>Edge Inspect CC</span> の有効期限が切れています。新しいバージョンをダウンロードしてください。",
	"INSPECT_subscriptionexpiredPrefix": "Edge Inspect CC フルバージョンの機能を利用できなくなりました。",
	"INSPECT_subscriptionexpiredSuffix": "機能制限付きで引き続きお使いいただくこともできます。",
	"INSPECT_screenshotsarepremiumPrefix": "スクリーンショット機能は、Edge Inspect CC フルバージョンでのみ利用できます。",
	"INSPECT_seconddeviceispremiumPrefix": "複数台のデバイスを使用する機能は、Edge Inspect CC フルバージョンでのみ利用できます。",
	"INSPECT_renewlink": "今すぐ更新",
	"INSPECT_upgradelink": "並行して複数台のデバイスに接続するには、今すぐアップグレードしてください。",
	"INSPECT_buyitnowPrefix": "現在、無償版の Edge Inspect CC を使用しています。フルバージョンを使用するには、ログインまたは",
	"INSPECT_upgrade": "アップグレード",
	"INSPECT_buyitnowSuffix": "してください。",
	"INSPECT_shadmessagePrefix": "製品改良の参考として",
	"INSPECT_shadmessageSuffix": "2 つの質問にお答えください",
	"INSPECT_welcomemessage": "お知らせ : メジャーアップデートの時期が近づいています。すべての <span class='code'>$arg1$</span> アプリはアップデートしないと動作しなくなります。ご注意ください。",
	"INSPECT_welcomeaction": "続行",
	"INSPECT_feedback": "<span class='code'>Edge Inspect CC</span> の使用感はいかがですか？",
	"INSPECT_remove": "認証済みデバイス",
	"INSPECT_problems": "ヘルプが必要な場合",
	"INSPECT_removetext": "デバイスの認証を解除し、自動再接続されないようにします。",
	"INSPECT_cancelscreenshot": "転送をキャンセル",
	"INSPECT_completedscreenshot": "ショットを転送しました",
	"INSPECT_downloadiso": "<span class='code'>iPad&reg;、iPhone&reg;</span> および <span class='code'>iPod&reg;</span> デバイス用 <span class='code'>Edge Inspect CC</span>...",
	"INSPECT_downloadandroid": "<span class='code'>Android&trade;</span> デバイス用 <span class='code'>Edge Inspect CC</span>...",
	"INSPECT_downloadamazon": "<span class='code'>Kindle</span> デバイス用 <span class='code'>Edge Inspect CC</span>...",
	"INSPECT_emptylog": "消去",
	"INSPECT_versioninfo": "DM ビルド : ",
	"INSPECT_screenshotsfoldertitle": "Screenshots フォルダー",
	"INSPECT_change": "変更",
	"INSPECT_logtitle": "ログ",
	"INSPECT_weinretitle": "weinre サーバー",
	"INSPECT_weinredefault": "デフォルト (Adobe)",
	"INSPECT_weinrecustom": "カスタム",
	"INSPECT_weinreexample": "例 : localhost:8080、または 172.18.5.4:8081",
	"INSPECT_save": "保存",
	"INSPECT_edit": "編集",
	"INSPECT_remove_tt": "削除",
	"INSPECT_disconnect_tt": "切断",
	"INSPECT_default_passcode": "パスコード",
	"INSPECT_cancel_tt": "キャンセル",
	"INSPECT_deauthorize_tt": "認証解除",
	"INSPECT_authorize_tt": "認証",
	"INSPECT_remoteinspect_tt": "リモート検査",
	"INSPECT_progress_tt": "スクリーンショットの進行状況",
	"INSPECT_screenshotfolder_tt": "スクリーンショットの保存先フォルダーを開く",
	"INSPECT_screenshot_tt": "スクリーンショットを撮影",
	"INSPECT_forcerefresh_tt": "すべてのデバイスを更新",
	"INSPECT_showchrome_tt": "デバイス上のフルスクリーン表示を終了",
	"INSPECT_fullscreen_tt": "デバイス上でフルスクリーン表示",
	"INSPECT_browsingon_tt": "同期ブラウジングをオフにする",
	"INSPECT_browsingtooltipNoDM_tt": "無効",
	"INSPECT_browsingoff_tt": "同期ブラウジングをオンにする",
	"INSPECT_gettingstartedintroheader": "Edge Inspect CC 入門ガイド",
	"INSPECT_gettingstartedintro": "Edge Inspect CC は、モバイルブラウザー向けに Web デザインおよび開発を行うための製品です。Edge Inspect をインストールすると、デバイスとのペアリングを確立し、コンピューターと同期したブラウズ操作をデバイス上で実行したり、リモート検査 / デバッグを実行したり、HTML/CSS/JavaScript に加えた変更を即座にデバイス上でテストしたりできます。",
	"INSPECT_gettingstartedsamenetworkheader": "1. 接続するデバイスが同じネットワーク上にあることを確認する",
	"INSPECT_gettingstartedsamenetwork": "Edge Inspect で接続するコンピューターとデバイスは同じネットワークに属している必要があります。また、自動検出するにはサブネットも同じである必要があります。接続先コンピューターを検出できない場合は手動接続してください。",
	"INSPECT_gettingstartedconnectingheader": "2. デバイスをコンピューターに接続する",
	"INSPECT_gettingstartedconnectingautodiscoveryheader": "A. 自動検出",
	"INSPECT_gettingstartedconnectingautodiscovery": "Edge Inspect を実行するデバイスは、Edge Inspect を実行しているコンピューターを検出します。接続先とするコンピューターをタップしてください。Chrome 拡張機能にパスコードを入力してください。コンピューターとデバイスの間にワイヤレス接続が作成されます",
	"INSPECT_gettingstartedconnectingmanualconnectionheader": "B. 手動接続",
	"INSPECT_gettingstartedconnectingmanualconnectionp1": "接続したいコンピューターを検出できない場合は、「+」ボタンをタップして手動接続してください。お使いのコンピューターに関連付けられている IP アドレスは、Chrome 拡張機能の画面下部に表示されます。この IP アドレスを、デバイス上のテキストフィールドに入力してください。",
	"INSPECT_gettingstartedconnectingmanualconnectionp2": "デバイスが Edge Inspect CC と接続されている間、減光やスリープ機能はオフになります。",
	"INSPECT_gettingstartedremoteinspectionheader": "3. デバイス上でページの検査およびデバッグを実行する",
	"INSPECT_gettingstartedremoteinspection": "Chrome 拡張機能で、検査またはデバッグを実行したいデバイスの横にある「&lt; &gt;」ボタンをクリックすると、開発者ツールウィンドウが開きます。リモート検査は一度に 1 台のデバイスに対してのみ実行できます。"
});
