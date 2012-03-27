AJS.toInit(function ($) {
    // Check and clear all links
    //
    $("a[class=checkAllLink]").click(function () {
        $(".exportContentTreeCheckbox").attr("checked", "checked");
        return false;
    });
    $("a[class=clearAllLink]").click(function () {
        if ($(".exportContentTreeCheckbox").first().attr("disabled") == false) {
            $(".exportContentTreeCheckbox").attr("checked", "");
        }
        return false;
    });

    // Include comments and backup attachments checkboxes
    //
    $("#includeComments").click(function () {
        $("#includeCommentsCopy").attr("checked", this.checked);
    });
    $("#includeCommentsCopy").click(function () {
        $("#includeComments").attr("checked", this.checked);
    });
    $("#backupAttachments").click(function () {
        $("#backupAttachmentsCopy").attr("checked", this.checked);
    });
    $("#backupAttachmentsCopy").click(function () {
        $("#backupAttachments").attr("checked", this.checked);
    });

    // Pages to export radio buttons
    //
    $("#contentOptionAll, #contentOptionVisible").click(contentOptionChangeHandler);

    function contentOptionChangeHandler() {
        var isDisabled = !!$("#contentOptionAll:checked").length;
        $(".exportContentTreeCheckbox").each(function () {
            this.checked = "checked";
            this.disabled = isDisabled;
        });
    }    

    function toggleChildren(checkboxElement) {
        var jqCheckbox = $(checkboxElement);
        var checked = jqCheckbox.attr("checked") || "";
        
        jqCheckbox.parent().find("input,.exportContentTreeCheckbox").attr(
            "checked", checked);
    }
    
    $(".exportContentTreeCheckbox").click(function () {
        toggleChildren(this);
    });
    
    // Single node select functionality
    //
    $(".togglemeonlytreenode").click(function (e) {
        var inputCheckbox = $($(this).siblings(".exportContentTreeCheckbox").get(0));
        if (inputCheckbox.attr("checked"))
            inputCheckbox.attr("checked",false);
        else
            inputCheckbox.attr("checked", true);

        event.preventDefault();
    });
});