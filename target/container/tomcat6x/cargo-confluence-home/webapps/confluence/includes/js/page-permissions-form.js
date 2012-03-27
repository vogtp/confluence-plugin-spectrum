/**
 * Controls the Form component of the Page Permissions dialog.
 */
AJS.PagePermissions.Controls = function (permissionManager) {
    var $ = AJS.$;

    /**
     * Adds validation error messages for unknown or duplicate names.
     */
    var validator = {

        handleNonExistentEntityNames : function (entityNames) {
            if (!entityNames || !entityNames.length)
                return;

            var commaDelimitedNames = entityNames.join(", ");

            var errorMsg = AJS.I18n.getText("page.perms.error.invalid.entity.names") + " " + commaDelimitedNames;
            $("#page-permissions-error-div").find("div").text(errorMsg).end().removeClass("hidden");
            permissionManager.refreshLayout();
        },

        isDuplicateEntityForType : function (entity, permissionType) {
            var matches = $("#page-permissions-table ." + permissionType + "-permission-row .permission-entity-name").filter(function() {
                return $(this).text() == entity.name;
            });

            return matches.length > 0;
        },

        resetValidationErrors : function () {
            $("#page-permissions-error-div").addClass("hidden");
            permissionManager.refreshLayout();
        }
    };

    /**
     * Handles typing of user/names and groups with autocomplete and placeholder text.
     */
    var nameField = (function() {
        var input = $("#page-permissions-names-input");
        var autocompleted = $("#page-permissions-names-hidden");

        // The placeholder will be set as the initial value of the input.
        var placeholder = input.val();

        input.keypress(function (e) {
            if (e.keyCode == Event.KEY_RETURN) {
                namesEntered();
                input.focus();
                return false;
            }
            return true;
        });

        input.bind("selected.autocomplete-user", function (e, data) {
            var username = data.content.username;
            autocompleted.val(unescape(username.replace(/\+/g, " ")));
            input.val("");
            namesEntered();
            e.preventDefault();
        });

        input.focus(function() {
            var ol = input.next(".aui-dd-parent");
            if (!ol.length) {
                return;
            }
            // Reset the position of the autocomplete list each time the input gets focus. This allows for the window
            // being resized (and for the input being hidden when the position is originally calculated).            
            ol.show();
            var expectedLeftOffset = input.offset().left;
            if (ol.offset().left != expectedLeftOffset) {
                ol.css("margin-left", 0);       // "reset" the offset.
                var olMarginLeft = expectedLeftOffset - ol.offset().left;
                ol.css("margin-left", olMarginLeft + "px");
            }
            var expectedTopOffset = input.offset().top + input.outerHeight();
            if (ol.offset().top != expectedTopOffset) {
                ol.css("margin-top", 0);       // "reset" the offset.
                var olMarginTop = expectedTopOffset - ol.offset().top;
                ol.css("margin-top", olMarginTop + "px");
            }
            ol.css({
                "width" : input.outerWidth()
            });
            ol.hide();
        });
        return {
            getValue : function() {
                var names = autocompleted.val();
                if (names) {
                    autocompleted.val("");
                } else {
                    names = input.val();
                    if (names == placeholder) {
                        names = "";
                    }
                }
                return names;
            },

            /**
             * Removes a name from the input field (called after the name is found at the back end)
             */
            removeFromNameInput : function (nameToRemove) {
                if (!nameToRemove)
                    return;

                var value = input.val();
                if (!value)
                    return;

                var entityNames = value.split(",");
                for (var i = 0; i < entityNames.length; i++) {
                    entityNames[i] = $.trim(entityNames[i]);
                }

                // remove all empty strings and the entity name that's just been added
                entityNames = $.grep(entityNames, function (name) {
                    return name != "" && name != nameToRemove;
                });

                if (entityNames.length) {
                    input.val(entityNames.join(", "));
                } else {
                    if (document.activeElement == input[0]) {
                        input.val("");
                    }
                }
            }
        };
    })();

    /**
     * Called when the user hits Enter or clicks the Add button.
     */
    var namesEntered = function () {
        validator.resetValidationErrors();
        permissionManager.table.clearHighlight();
        var names = nameField.getValue();
        if (!names)
            return;

        permissionManager.addNames(names);
    };

    // Choose Me button (User and Group button are wired with VM component
    $("#page-permissions-choose-me").click(function(e) {
        validator.resetValidationErrors();
        permissionManager.addNames($(this).find(".remote-user-name").text());
        return AJS.stopEvent(e);
    });

    $("#permissions-error-div-close").click(function(e) {
        validator.resetValidationErrors();
        return AJS.stopEvent(e);
    });

    // Typed user list submit
    $("#add-typed-names").click(namesEntered);

    return {
        validator: validator,
        
        nameField: nameField,

        setVisible : function (show) {
            AJS.setVisible("#page-permissions-editor-form", show);
            AJS.setVisible(".remove-permission-link", show);
        },

        isShowing : function() {
            return !$("#page-permissions-editor-form").hasClass("hidden");
        },

        getPermissionType : function() {
            return !!$("#restrictViewRadio:checked").length ? "view" : "edit";
        }
    };
};

