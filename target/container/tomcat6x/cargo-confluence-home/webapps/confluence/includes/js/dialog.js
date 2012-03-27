/**
 * Provides Confluence-specific overrides of AJS.Dialog defaults
 */
AJS.ConfluenceDialog = function(options) {
    var dialog;
    options = options || {};
    options = jQuery.extend({}, {
        // This is actually on keydown in AJS.popup.
        keypressListener: function(e) {
            if (e.keyCode === 27) {
                AJS.debug("dialog.js: escape keydown caught");
                // if dropdown is currently showing, leave the dialog and let the dropdown close itself
                if (!jQuery(".aui-dropdown", dialog.popup.element).is(":visible")) {
                    if (typeof options.onCancel == "function") {
                        options.onCancel();
                    } else {
                        dialog.hide();
                    }
                }
            }
            else if (e.keyCode === 13) {
                // Enter key pressed
                AJS.debug("dialog.js: enter keydown caught");
                if (!jQuery(".aui-dropdown", dialog.popup.element).is(":visible")) {
                    // No dropdown showing - enter is on dialog.
                    var nodeName = e.target.nodeName && e.target.nodeName.toLowerCase();
                    if (nodeName != "textarea" && typeof options.onSubmit == "function") {
                        // Run the submit after waiting for the current event thread to complete.
                        // This ensures that keypress and keyup events for the Enter key are handled before onSubmit
                        // is run.
                        setTimeout(options.onSubmit);
                    }
                }
            }
        },
        width: 865,  // this is the standard large size dialog width TODO - ask Richard.
        height: 530
    }, options);
    dialog = new AJS.Dialog(options);

    jQuery.aop.around({ target: dialog, method: "addButton" },
        function (invocation) {
            if (invocation.arguments[0]) {
                invocation.arguments[0] = AJS.I18n.getText(invocation.arguments[0]);
            }
            return invocation.proceed();
        }
    );

    return dialog;
};

// Automatically bind our components when a dialog is shown
AJS.toInit(function($){
    // Sends events to the server for all dialogs we show
    AJS.bind("show.dialog", function(e, data) {
        var pageid = AJS.Meta.get('page-id'),
            spacekey = AJS.Meta.get('space-key'),
            editormode = AJS.Meta.get('editor-mode'),
            newpage = AJS.Meta.get('new-page'),
            /**
             * Gets interesting AJS.Meta values, if they're set.
             * @return properties the properties to send.
             */
             getMetadata = function() {
                var properties = {};
                if (pageid) properties.pageid = pageid;
                if (spacekey) properties.spacekey = spacekey;
                if (editormode) properties.editormode = editormode;
                if (newpage) properties.newpage = newpage;
                return properties;
            };

        AJS.EventQueue = AJS.EventQueue || [];
        AJS.EventQueue.push({name: data.dialog.id, properties: getMetadata()});
    });

    var rememberLastDialogTab = function(dialogElement) {
        var $dialog = $(dialogElement),
            defaultTab;


        if ($dialog.attr("data-lasttab-override")) {
            return; // skip last tab cause it wants to be special
        }

        if ($dialog.attr("data-tab-default")) {
            defaultTab = $dialog.attr("data-tab-default");
        }

        // get the last clicked tab, if any
        var storage = Confluence.storageManager($dialog.attr("id")),
            lastTab = storage.getItem("last-tab"),
            selectedTab = lastTab != null ? lastTab : defaultTab;

        if (selectedTab)
            $(".page-menu-item:visible:eq(" + selectedTab + ") button", $dialog).click();

        if (!$dialog.attr("data-lasttab-bound")) {
            $(".page-menu-item", $dialog).each(function(i, element) {
                $(element).click(function(){
                    storage.setItem("last-tab", i);
                });
            });
            $dialog.attr("data-lasttab-bound", "true");
        }
    };

    $(document).bind("showLayer", function(e, name, dialog) {
        Confluence.runBinderComponents();
        if (name == "popup" && dialog ) {
            rememberLastDialogTab(dialog.element);
        }
    });

    /**
     * Prevent the dialog from opening in the last tab the user cliked on.
     * This method should be called before the dialog is shown and a
     * particular dialog tab needs to be selected/displayed.
     */
    AJS.Dialog.prototype.overrideLastTab = function() {
        $(this.popup.element).attr("data-lasttab-override", "true");
    };

    // 3.5 - Move this into AUI if it proves useful
    AJS.Dialog.prototype.addHelpText = function(template, args) {
        if (!template) {
            // Don't do anything if there is no text to add.
            // This stops us printing 'undefined'.
            return;
        }

        var text = template;
        if (args) {
            text = AJS.template(template).fill(args).toString();
        }

        var page = this.page[this.curpage];
        if (!page.buttonpanel) {
            page.addButtonPanel();
        }

        // The text may include html i.e. links or strongs 
        var tip = $("<div class='dialog-tip'></div>").html(text);
        page.buttonpanel.append(tip);
        $("a", tip).click(function() {
            window.open(this.href, '_blank').focus();
            return false;
        });
    }

    /**
     * Returns the current title of this Dialog.
     */
    AJS.Dialog.prototype.getTitle = function() {
        return $('#' + this.id + ' .dialog-components:visible h2').text();
    };

    AJS.Dialog.prototype.isVisible = function () {
        return $('#' + this.id).is(':visible');
    }
});
