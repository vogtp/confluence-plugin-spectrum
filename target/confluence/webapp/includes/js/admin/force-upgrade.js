/**
 * Dynamically updates the description of the current selection.
 */
AJS.toInit(function($) {
    var upgradeSelected = function () {
        var selectBox = $(this);
        var description = selectBox.parent().find(".description");
        description.html(AJS.I18n.getText("upgrade.description.loading")).addClass("loading");
        AJS.log("User selected value: " + selectBox.val());
        AJS.safe.ajax({
            url: AJS.Meta.get("context-path") + '/admin/get-upgrade-description.action',
            data: {
                upgradeTaskToRun: selectBox.val()
            },
            method: "GET",
            dataType: "json",
            error: function () {
                // ignore - not important functionality
                description.removeClass("loading").text("");
            },
            success: function (data) {
                if (data.description) {
                    description.text(data.description).removeClass("loading");
                }
            }
        });
    };
    $("#upgradeTaskToRun").change(upgradeSelected);
});
