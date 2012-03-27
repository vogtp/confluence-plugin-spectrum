AJS.toInit(function ($)
{
    var addMembersSection = $("#add-members-section");
    var listMembersSection = $("#list-members-section");
    var switchButton = $("#switch-button");
    var cancelButton = $("#cancel-button");
    var errorBox = $(".errorBox");

    var open = function()
    {
        addMembersSection.show();
        listMembersSection.hide();
        errorBox.hide();
        switchButton.text($("#i18n-cancel-add").val())
        switchButton.unbind('click', open);
        switchButton.click(cancel);
        return false;
    };

    var cancel = function()
    {
        listMembersSection.show();
        addMembersSection.hide();
        switchButton.show();
        switchButton.text($("#i18n-add-members").val());
        switchButton.unbind('click', cancel);
        switchButton.click(open);
        $(".error").remove();
        return false;
    };


    switchButton.click(open);
    cancelButton.click(cancel);
    cancel();
});

function setPickerField(entityNames)
{
    AJS.$("#usersToAdd").val(entityNames);
}


