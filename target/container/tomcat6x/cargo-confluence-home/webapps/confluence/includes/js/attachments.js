// Make this binding available to the attachments macro
// which dynamically loads the table.
AJS.Attachments = {
    showOlderVersions: function($) {
    $(".attachment-history a").click(function (e) {
        var attachmentTable = $(this).parents("table.tableview");
        var attachmentId = $(this).parents("tr:first")[0].id.substr(11);      // "attachment-".length;
        // Use the parent container since there can be multiple macros on the same page
        var historyRows = $(".history-" + attachmentId, attachmentTable);
        $(this).toggleClass("icon-section-opened");
        $(this).toggleClass("icon-section-closed");
        historyRows.toggleClass("hidden");

        return AJS.stopEvent(e);
    });}
};

AJS.toInit(function ($) {

    // Show more attach more attachment fields.
    var moreAttachmentsLink = $("#more-attachments-link");
    moreAttachmentsLink.click(function (e) {
        $(".more-attachments").removeClass("hidden");
        moreAttachmentsLink.addClass("hidden");
        return AJS.stopEvent(e);
    });

    AJS.Attachments.showOlderVersions($);

    $(".removeAttachmentLink").click(function (e) {
        var filename = $.trim($(".filename", $(this).parents("tr")).attr("data-filename"));
        if (confirm(AJS.I18n.getText("remove.attachment.confirmation.message", filename)))
            return true;
        else
            return AJS.stopEvent(e);
    });
});
