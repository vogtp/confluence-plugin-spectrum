AJS.toInit(function($) {

    if(!Confluence.Templates.Labels) {
        return;
    }

    var dialog = null;

    var close = function () {
        $("#"+dialog.id).find(".label-list").removeClass("editable");
        dialog.hide();
        return false;
    };

    var initDialog = function () {
        dialog = AJS.ConfluenceDialog({
            width : 550,
            height: 233,
            id: "edit-labels-dialog",
            onCancel: close
        });

        dialog.addHeader(AJS.I18n.getText("labels.name"));
        dialog.addPanel("Label Editor", AJS.renderTemplate("labels-dialog-div"));
        dialog.addCancel(AJS.I18n.getText("close.name"), close);
        dialog.addHelpText(AJS.I18n.getText("labels.dialog.shortcut.tip"), {shortcut: "l"});
        dialog.popup.element.find(".dialog-title").append(Confluence.Templates.Labels.helpLink());
        $("#add-labels-form").submit(function(e) {
            var input = $("#labelsString");
            e.preventDefault();
            AJS.Labels.addLabel(input.val());
            input.focus();
        });

        // add return key handling to the label field
        $("#labelsString").keydown(function (e) {
            if (e.keyCode == 13) {
                if (!AJS.dropDown.current) {
                    $("#add-labels-form").submit(e);
                }
            }
        });
        AJS.Labels.bindAutocomplete();
    };

    $('#rte-button-labels').click(function (e) {
        AJS.Labels.openDialog();
    });

    $(".show-labels-editor").click(function (e) {
        e.preventDefault();
        AJS.Labels.openDialog();
    });

    AJS.Labels.openDialog = function() {
        if (!dialog) {
            initDialog();
        }
        dialog.show();
        $("#"+dialog.id).find(".label-list").addClass("editable");
        $("#labelsString").val("").focus();
    };
});
