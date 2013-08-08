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
	"INSPECT_BUTTON": "Aperçu sur des terminaux à l’aide d’Edge Inspect CC",
	"INSPECT_waiting": "En attente d’une connexion...",
	"INSPECT_syncbrowseoff": "La navigation synchronisée n’est pas activée.",
	"INSPECT_dmerror": "Veuillez lancer l’application Edge Inspect CC...",
	"INSPECT_getedgeinspect": "Obtenir Edge Inspect CC.",
	"INSPECT_dmexpired": "<span class='code'>Edge Inspect CC</span> a expiré. Veuillez télécharger une version plus récente.",
	"INSPECT_subscriptionexpiredPrefix": "Vous n’avez plus accès aux fonctionnalités de la version complète d’Edge Inspect CC.",
	"INSPECT_subscriptionexpiredSuffix": " ou continuer avec des fonctionnalités limitées.",
	"INSPECT_screenshotsarepremiumPrefix": "Les captures d’écran sont une fonctionnalité disponible avec la version complète d’Edge Inspect CC.",
	"INSPECT_seconddeviceispremiumPrefix": "L’utilisation de plusieurs périphériques est une fonctionnalité disponible avec la version complète d’Edge Inspect CC.",
	"INSPECT_renewlink": "Renouveler maintenant",
	"INSPECT_upgradelink": "Procédez à une mise à niveau maintenant pour connecter plusieurs appareils en même temps.",
	"INSPECT_buyitnowPrefix": "Vous utilisez actuellement Edge Inspect CC Free. Veuillez vous connecter ou ",
	"INSPECT_upgrade": "Mettre à niveau",
	"INSPECT_buyitnowSuffix": " pour utiliser la version complète.",
	"INSPECT_shadmessagePrefix": "Aidez-nous à améliorer ce logiciel en répondant à",
	"INSPECT_shadmessageSuffix": "ces deux questions",
	"INSPECT_welcomemessage": "Nous vous rappelons qu’une mise à jour importante sera bientôt disponible. Toutes les applications <span class='code'>$arg1$</span> doivent être mises à jour pour continuer à fonctionner.",
	"INSPECT_welcomeaction": "Continuer",
	"INSPECT_feedback": "Vous êtes satisfait d’<span class='code'>Edge Inspect CC</span> ?",
	"INSPECT_remove": "Appareils autorisés",
	"INSPECT_problems": "Vous avez besoin d’aide ?",
	"INSPECT_removetext": "Annuler l’autorisation d’un périphérique pour éviter toute reconnexion automatique",
	"INSPECT_cancelscreenshot": "Annuler le transfert",
	"INSPECT_completedscreenshot": "Capture(s) transférée(s)",
	"INSPECT_downloadiso": "<span class='code'>Edge Inspect CC</span> pour <span class='code'>iPad&reg;, iPhone&reg;</span> et <span class='code'>iPod&reg;</span>...",
	"INSPECT_downloadandroid": "<span class='code'>Edge Inspect CC</span> pour appareils <span class='code'>Android&trade;</span>...",
	"INSPECT_downloadamazon": "<span class='code'>Edge Inspect CC</span> pour appareils <span class='code'>Kindle</span>...",
	"INSPECT_emptylog": "Effacer",
	"INSPECT_versioninfo": "Version DM : ",
	"INSPECT_screenshotsfoldertitle": "Dossier de captures d’écran",
	"INSPECT_change": "Changer",
	"INSPECT_logtitle": "Journal",
	"INSPECT_weinretitle": "Serveur weinre",
	"INSPECT_weinredefault": "Défaut (Adobe)",
	"INSPECT_weinrecustom": "Personnalisation",
	"INSPECT_weinreexample": "par exemple localhost:8080 ou 172.18.5.4:8081",
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
	"INSPECT_forcerefresh_tt": "Actualiser tous les périphériques",
	"INSPECT_showchrome_tt": "Quitter le mode plein écran sur les périphériques",
	"INSPECT_fullscreen_tt": "Mode plein écran sur les périphériques",
	"INSPECT_browsingon_tt": "Désactiver la navigation synchronisée",
	"INSPECT_browsingtooltipNoDM_tt": "Désactivé",
	"INSPECT_browsingoff_tt": "Activer la navigation synchronisée",
	"INSPECT_gettingstartedintroheader": "Guide de prise en main d’Edge Inspect CC",
	"INSPECT_gettingstartedintro": "Edge Inspect CC est destiné aux webdesigners et aux développeurs spécialisés en navigateurs mobiles. Après avoir installé Edge Inspect, vous pourrez coupler des périphériques, naviguer dessus de manière synchronisée avec votre ordinateur, effectuer des opérations de contrôle et de débogage à distance ou encore visualiser les changements HTML/CSS/JavaScript instantanément sur votre appareil. ",
	"INSPECT_gettingstartedsamenetworkheader": "1. S’assurer que les appareils sont sur le même réseau",
	"INSPECT_gettingstartedsamenetwork": "Pour qu’Edge Inspect fonctionne, il est nécessaire que votre ordinateur et votre périphérique se trouvent sur le même réseau. Pour la détection automatique, l’ordinateur et les périphériques doivent se trouver sur le même sous-réseau. Si votre ordinateur n’apparaît pas, tentez une connexion manuelle.",
	"INSPECT_gettingstartedconnectingheader": "2. Connecter des périphériques à l’ordinateur",
	"INSPECT_gettingstartedconnectingautodiscoveryheader": "A. Détection automatique",
	"INSPECT_gettingstartedconnectingautodiscovery": "L’appareil exécutant Edge Inspect va rechercher des ordinateurs utilisant également Edge Inspect. Cliquez sur l’ordinateur auquel vous souhaitez vous connecter. Saisissez le code secret dans l’extension Chrome pour établir une connexion sans fil entre l’ordinateur et le périphérique.",
	"INSPECT_gettingstartedconnectingmanualconnectionheader": "B. Connexion manuelle",
	"INSPECT_gettingstartedconnectingmanualconnectionp1": "Si vous ne trouvez pas l’ordinateur auquel vous souhaitez vous connecter, appuyez sur le bouton \"+\" pour procéder à une connexion manuelle. La liste des adresses IP associées à votre ordinateur se trouve au bas de l’extension Chrome. Saisissez l’adresse IP dans le champ de texte du périphérique.",
	"INSPECT_gettingstartedconnectingmanualconnectionp2": "Lorsqu’un appareil est connecté, Edge Inspect CC empêche toute mise en veille ou réduction de luminosité de l’écran.",
	"INSPECT_gettingstartedremoteinspectionheader": "3. Inspecter et déboguer la page sur le périphérique",
	"INSPECT_gettingstartedremoteinspection": " Dans l’extension Chrome, cliquez sur le bouton \"&lt; &gt;\" figurant à côté de l’appareil que vous souhaitez inspecter ou déboguer. La fenêtre d’outils de développement s’affiche. Vous ne pouvez utiliser l’inspection à distance que sur un périphérique à la fois.",

	"PRODUCT_NAME": "Edge Inspect",
	"DIALOG_DONE": "Terminé",
	"HOWTO_INTRO": "Adobe® Edge Inspect est destiné aux designers et développeurs web spécialisés dans les navigateurs mobiles. Avec Edge Inspect installé, vous pouvez afficher des aperçus de vos contenus sur différents appareils mobiles. Établissez une connexion sans fil entre des terminaux iOS et Android et votre ordinateur, réalisez des captures d’écran sur les terminaux connectés et découvrez en temps réel le résultat des modifications apportées aux codes HTML, CSS et JavaScript.",
	"HOWTO_INSTRUCTIONS_1": "Installez Edge Inspect sur votre périphérique et vérifiez que celui-ci et votre ordinateur sont connectés au même réseau. Pour permettre l’identification automatique, les deux appareils doivent se trouver sur le même sous-réseau.",
	"HOWTO_INSTRUCTIONS_2": "Si le périphérique ne détecte pas votre ordinateur, utilisez la connexion manuelle (bouton + sur le périphérique). Indiquez l’adresse IP ou le nom d’hôte de votre ordinateur tels qu’ils s’affichent dans l’extension Edge Inspect, illustrée ci-dessus.",
	"HOWTO_INSTRUCTIONS_3": "Une fois la connexion établie, Edge Inspect affiche un aperçu de la page sur votre périphérique. L’application empêche également toute mise en veille ou réduction de luminosité de l’écran pendant l’aperçu.",
	"HOWTO_DIAGRAM_IMAGE": "img/EdgeInspectInstructionImage_FR.png",
	"HOWTO_DIAGRAM_IMAGE_HIDPI": "img/EdgeInspectInstructionImage@2x_FR.png",
	"INSPECT_showhowto": "Mise en route...",
	"INSPECT_needhelp": "<a class=\"clickable-link\" data-href=\"http://forums.adobe.com/community/edge_inspect/report_a_problem\">Besoin d’aide ? Posez une question sur Adobe Community...</a>"
});
