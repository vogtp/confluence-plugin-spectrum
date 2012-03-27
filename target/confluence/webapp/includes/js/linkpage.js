AJS.toInit(function($) {
    // superbatching means that this script could be on every page
    if (!$("link[rel=canonical]").length) {
        return;
    }

    var dialog = null;

    var initDialog = function () {
        dialog = new AJS.Dialog(600, 210, "link-page-popup")
            .addHeader(AJS.I18n.getText("dialog.linktothispage.heading"))
            .addPanel(AJS.I18n.getText("dialog.linktothispage.heading"), "<form id='link-page-popup-form' class='aui'>" +
                                   "<fieldset>" +
                                   "</fieldset>" +
                                   "</form>")
            .addCancel(AJS.I18n.getText("close.name"), function(e) { dialog.hide(); return false;});

        // add shortcut tip
        if (Confluence.KeyboardShortcuts && Confluence.KeyboardShortcuts.enabled) {
            dialog.addHelpText(AJS.I18n.getText("keyboard.shortcuts.dialog.tip", "k"));
        }

        var links = [
        {
            label: AJS.I18n.getText("insert.link.popup.destination"),
            id: "link",
            value: $("link[rel=canonical]").attr("href")
        },
        {
            label: AJS.I18n.getText("tiny.link"),
            id: "tiny-link",
            value: $("link[rel=shortlink]").attr("href")
        }
        ];

        $.each(links, function() {
            $("#link-page-popup-form fieldset").append(AJS.format(
                    "<div class='field-group'>" +
                        "<label for=''link-popup-field-{0}''>{1}:</label>" +
                        "<input id=''link-popup-field-{0}'' readonly=''readonly'' value='''' class=''text'' type=''text''>" +
                    "</div>", this.id, this.label)).find("input:last").val(this.value);
        });

        var linkText = $("#link-page-popup-form fieldset input.text");
        linkText.focus(function() {
            $(this).select();
        });

        // On Safari the mouse up event deselects the text
        linkText.mouseup(function(e){
            e.preventDefault();
        });
    };

    $("#link-to-page-link").click(function(e) {
        if (!dialog) {
            initDialog();
        }
        $(this).parents(".ajs-drop-down")[0].hide();
        dialog.show();
        $("#link-page-popup-form #link-popup-field-tiny-link").select();
        return AJS.stopEvent(e);
    });
});
