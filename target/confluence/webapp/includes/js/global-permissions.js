AJS.toInit(function ($) {
    var inlineHelpDisplay = "";
    var objects = {fadeTime:200, width:175, offsetX: -147};
    var content = function(contents, trigger, showPopup) {
        contents.html("<div class='description' id='dialog-content' style='font-size: 11px; padding: 0 5px;'>" + inlineHelpDisplay + "</div>") ;
        showPopup();
    };

    $('.inlineDialog-profileAttachments').click(function() {inlineHelpDisplay = AJS.I18n.getText("attach.files.to.profile.permission.description");});
    $('.inlineDialog-updateStatus').click(function() {inlineHelpDisplay = AJS.I18n.getText("update.user.status.permission.description");});
    $('.inlineDialog-personalSpace').click(function() {inlineHelpDisplay = AJS.I18n.getText("personal.space.permission.description");});
    $('.inlineDialog-createSpace').click(function() {inlineHelpDisplay = AJS.I18n.getText("create.space.permission.description");});
    $('.inlineDialog-adminConfluence').click(function() {inlineHelpDisplay = AJS.I18n.getText("confluence.administrator.permission.description");});
    $('.inlineDialog-adminSystem').click(function() {inlineHelpDisplay = AJS.I18n.getText("system.administrator.permission.description");});
    $('.inlineDialog-useConfluence').click(function() {inlineHelpDisplay = AJS.I18n.getText("use.confluence.permission.description");});
    $('.inlineDialog-viewProfiles').click(function() {inlineHelpDisplay = AJS.I18n.getText("view.user.profiles.permission.description");});

    AJS.InlineDialog(AJS.$(".inlineDialog-profileAttachments"), 1, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-updateStatus"), 2, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-personalSpace"), 3, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-createSpace"), 4, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-adminConfluence"), 5, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-adminSystem"), 6, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-useConfluence"), 7, content, objects);
    AJS.InlineDialog(AJS.$(".inlineDialog-viewProfiles"), 8, content, objects);
});