AJS.Rte.BootstrapManager.addOnInitCallback(function() {

    var containerId = "editor-notification-container";

    // create container
    var container = AJS.$("<div class=\"editor-notifications-container\"></div>").attr("id", containerId);
    AJS.$("#rte-savebar").offsetParent().prepend(container);

    /**
     * Displays a notification.
     * At the moment this is simplistic to the point of being incomplete. It is implemented only
     * to fulfil CONFDEV-6608. However it should ultimately be extended to become a standard
     * mechanism for displaying user feedback in The Editor.
     *
     * @static
     * @class EditorNotification
     * @namespace AJS.Confluence
     */
    AJS.Confluence.EditorNotification = {
        /**
         * Display a notification.
         *
         * @param type the type of message. Can be one of error, warning, info or success.
         * @param message the message that will be notified (without any encoding so ensure the message is HTML safe).
         */
        notify: function(type, message) {
            AJS.messages[type]("#" + containerId, {
                body: message,
                closeable: true,
                shadowed: true
            });

            var messageBox = AJS.$(".aui-message", container).last();

            setTimeout(function() {
                // message box may have been manually closed already but calling
                // closeMessage twice is fine.
                messageBox.fadeOut('fast', function() {
                    messageBox.closeMessage();
                    messageBox = null;
                });
            },5000);
        }
    };
});//(AJS.$);
