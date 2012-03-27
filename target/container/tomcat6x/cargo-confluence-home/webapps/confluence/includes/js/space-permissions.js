AJS.Confluence.SpacePermissions = {
    updateField: function(id, valueToAdd) {
        var input = AJS.$("#" + id);
        if (valueToAdd != ""){
            var val = input.val();
            input.val(val == "" ? valueToAdd : val + ", " + valueToAdd);
        }
    },
    updateGroupsField: function(groups) {
        AJS.Confluence.SpacePermissions.updateField("groups-to-add", groups);
    },
    updateUsersField: function(users) {
        AJS.Confluence.SpacePermissions.updateField("users-to-add-autocomplete", users);
    },
    setPermissionsState: function(entity, identifier, state) {
        AJS.$("table#" + entity + "PermissionsTable input:checkbox[name$='_" + identifier + "']").each(function () {
            this.checked = state;
        });
    }
};
AJS.$(document).ready(function () {
    AJS.$(".dropdown-perm-actions").dropDown("Standard");
    AJS.$("a.select-all, a.deselect-all").click(function (e) {
        var state = "";
        if (AJS.$(this).attr("class") == "select-all")
            state = "checked";
        AJS.Confluence.SpacePermissions.setPermissionsState(AJS.$(this).attr("data-entity"), AJS.$(this).attr("data-name"), state);
        e.preventDefault();
    });
});