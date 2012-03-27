AJS.Confluence.SpaceDetails = {
    setUsersToAddTextField: function(entityNames) {
        var element = document.forms.convertspace.usersToAdd;
        if (entityNames != ""){
            if (element.value == "")
                element.value = entityNames;
            else
                element.value = element.value + ", " + entityNames;
        }
    }
};