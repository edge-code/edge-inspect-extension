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
    
   // for inspect
	"INSPECT_BUTTON": "Adobe Edge Inspect CC",
	"INSPECT_waiting": "En attente d’une connexion...",
	"INSPECT_syncbrowseoff": "La navigation synchronisée n’est pas activée.",
	"INSPECT_dmerror": "[6962795] !é=Please start the Edge Inspect CC Application...=!",
	"INSPECT_getedgeinspect": "[6962805] !é=Get Edge Inspect CC.=!",
	"INSPECT_dmexpired": "[6962796] !é=<span class='code'>Edge Inspect CC</span> Has Expired. Please Download a new version.=!",
	"INSPECT_subscriptionexpiredPrefix": "[6962835] !é=You no longer have access to Edge Inspect CC full version features.=!",
	"INSPECT_subscriptionexpiredSuffix": " ou continuer avec des fonctionnalités limitées.",
	"INSPECT_screenshotsarepremiumPrefix": "[6962829] !é=Screenshots are an Edge Inspect CC full version feature.=!",
	"INSPECT_seconddeviceispremiumPrefix": "[6962831] !é=Use of multiple devices is an Edge Inspect CC full version feature.=!",
	"INSPECT_renewlink": "Renouveler maintenant",
	"INSPECT_upgradelink": "Mettre à niveau maintenant pour connecter plusieurs terminaux en même temps.",
	"INSPECT_buyitnowPrefix": "[6962786] !é=You are currently using Edge Inspect CC Free. Login or =!",
	"INSPECT_upgrade": "Mettre à niveau",
	"INSPECT_buyitnowSuffix": " pour utiliser la version complète.",
	"INSPECT_shadmessagePrefix": "Aidez-nous à améliorer ce logiciel en répondant à",
	"INSPECT_shadmessageSuffix": "ces deux questions",
	"INSPECT_welcomemessage": "Nous vous rappelons qu’une mise à jour importante sera bientôt disponible. Toutes les applications <span class='code'>$arg1$</span> doivent être mises à jour pour continuer à fonctionner.",
	"INSPECT_welcomeaction": "Continuer",
	"INSPECT_feedback": "[6962802] !é=Satisfied with <span class='code'>Edge Inspect CC</span>?=!",
	"INSPECT_remove": "Terminaux autorisés",
	"INSPECT_problems": "Vous avez besoin d’aide ?",
	"INSPECT_removetext": "Annuler l’autorisation d’un terminal pour éviter toute reconnexion automatique",
	"INSPECT_cancelscreenshot": "Annuler le transfert",
	"INSPECT_completedscreenshot": "Capture(s) transférée(s)",
	"INSPECT_downloadiso": "[6962799] !é=<span class='code'>Edge Inspect CC</span> for <span class='code'>iPad&reg;, iPhone&reg;</span> and <span class='code'>iPod&reg;</span>...=!",
	"INSPECT_downloadandroid": "[6962798] !é=<span class='code'>Edge Inspect CC</span> for <span class='code'>Android&trade;</span> devices...=!",
	"INSPECT_downloadamazon": "[6962797] !é=<span class='code'>Edge Inspect CC</span> for <span class='code'>Kindle</span> devices...=!",
	"INSPECT_emptylog": "Effacer",
	"INSPECT_versioninfo": "Version DM : ",
	"INSPECT_screenshotsfoldertitle": "Dossier de captures d’écran",
	"INSPECT_change": "Changer",
	"INSPECT_logtitle": "Journal",
	"INSPECT_weinretitle": "Serveur weinre",
	"INSPECT_weinredefault": "Défaut (Adobe)",
	"INSPECT_weinrecustom": "Personnalisation",
	"INSPECT_weinreexample": "par exemple localhost:8080, ou 172.18.5.4:8081",
	"INSPECT_save": "Enregistrer",
	"INSPECT_edit": "Modifier",
	"INSPECT_remove_tt": "Supprimer",
	"INSPECT_disconnect_tt": "Déconnecter",
	"INSPECT_default_passcode": "Code secret",
	"INSPECT_cancel_tt": "Annuler",
	"INSPECT_deauthorize_tt": "Ne plus autoriser",
	"INSPECT_authorize_tt": "Autoriser",
	"INSPECT_remoteinspect_tt": "Inspection à distance",
	"INSPECT_progress_tt": "Progression des captures d’écran",
	"INSPECT_screenshotfolder_tt": "Ouvrir le dossier contenant les captures d’écran",
	"INSPECT_screenshot_tt": "Demander des captures d’écran",
	"INSPECT_forcerefresh_tt": "Actualiser tous les terminaux",
	"INSPECT_showchrome_tt": "Quitter le mode plein écran sur les terminaux",
	"INSPECT_fullscreen_tt": "Mode plein écran sur tous les terminaux",
	"INSPECT_browsingon_tt": "Désactiver la navigation synchronisée",
	"INSPECT_browsingtooltipNoDM_tt": "Désactivé",
	"INSPECT_browsingoff_tt": "Activer la navigation synchronisée",
	"INSPECT_gettingstartedintroheader": "[6962813] !é=Edge Inspect CC Getting Started Guide=!",
	"INSPECT_gettingstartedintro": "[6962812] !é=Edge Inspect CC is for web designers and developers targeting mobile browsers. After installing Edge Inspect, you will be able to pair devices, have them browse in sync with your computer, perform remote inspection/debugging and see HTML/CSS/JavaScript changes instantly on your device. =!",
	"INSPECT_gettingstartedsamenetworkheader": "1. S’assurer que les appareils sont sur le même réseau",
	"INSPECT_gettingstartedsamenetwork": "Pour qu’Edge Inspect fonctionne, il est nécessaire que votre ordinateur et votre terminal se trouvent sur le même réseau. Pour la détection automatique, l’ordinateur et les terminaux doivent se trouver sur le même sous-réseau. Si votre ordinateur n’apparaît pas, tentez une connexion manuelle.",
	"INSPECT_gettingstartedconnectingheader": "2. Connecter des terminaux à l’ordinateur",
	"INSPECT_gettingstartedconnectingautodiscoveryheader": "A. Détection automatique",
	"INSPECT_gettingstartedconnectingautodiscovery": "Le terminal exécutant Edge Inspect va rechercher des ordinateurs utilisant également Edge Inspect. Cliquez sur l’ordinateur auquel vous souhaitez vous connecter. Saisissez le code secret dans l’extension Chrome pour établir une connexion sans fil entre l’ordinateur et le terminal.",
	"INSPECT_gettingstartedconnectingmanualconnectionheader": "B. Connexion manuelle",
	"INSPECT_gettingstartedconnectingmanualconnectionp1": "Si vous ne trouvez pas l’ordinateur auquel vous souhaitez vous connecter, appuyez sur le bouton \"+\" pour procéder à une connexion manuelle. La liste des adresses IP associées à votre ordinateur se trouve au bas de l’extension Chrome. Saisissez l’adresse IP dans le champ de texte du terminal.",
	"INSPECT_gettingstartedconnectingmanualconnectionp2": "[6962811] !é=When a device is connected, Edge Inspect CC will prevent the screen from dimming or going to sleep.=!",
	"INSPECT_gettingstartedremoteinspectionheader": "3. Inspecter et déboguer la page sur le terminal",
	"INSPECT_gettingstartedremoteinspection": " Dans l’extension Chrome, cliquez sur le bouton \"&lt; &gt;\" figurant à côté du terminal que vous souhaitez inspecter ou déboguer. La fenêtre d’outils de développement s’affiche. Vous ne pouvez utiliser l’inspection à distance que sur un terminal la fois."
});
