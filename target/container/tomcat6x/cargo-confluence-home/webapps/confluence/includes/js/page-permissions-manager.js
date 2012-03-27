///*--------------------------------------------------------------------------
// Behaviour for page-permissions.vm
// --------------------------------------------------------------------------*/
AJS.PagePermissions = AJS.PagePermissions || {};

AJS.toInit(function($) {

    var USER = "user",
        GROUP = "group";

    var contextPath = Confluence.getContextPath();
    var isEditPage = !!$("#rte-button-restrictions").length;

    var popup = null;
    var controls = null;
    var table = null;

    /**
     * Handles the AJAX calls to check for added users and groups, calling PermissionsTable.addEntry if found.
     */
    var permissionManager = {

        // Queries the server for whether an entityName represents a user or group
        // perform subsequent group check inside the callback of the user check so it occurs after the user check completes
        addNames : function (entityNames, entityType) {
            var pm = this;
            var entityNamesArray = entityNames.replace(/\s*,\s*/g, ",").split(",");
            var throbber = $("#waitImage");
            throbber.show();
            var params = {
                name: entityNamesArray,
                type: entityType || "",
                pageId: AJS.Meta.get('parent-page-id'),
                spaceKey: AJS.Meta.get('space-key')
            };
            $.getJSON(contextPath + "/pages/getentities.action", params, function(results) {
                throbber.hide();
                for (var i = 0, len = results.length; i < len; i++) {
                    var entity = results[i].entity;
                    // 1. Add permission row for entity
                    pm.addEntity(results[i]);

                    // 2. Remove from submitted names list
                    var index = $.inArray(entity.name, entityNamesArray);
                    entityNamesArray.splice(index, 1);
                }
                // 3. Didn't find anything for names - should only occur for names via the form
                controls.validator.handleNonExistentEntityNames(entityNamesArray);
            });
        },

        // Note - dupe validation can't be done before looking up the entity from a name because it depends on the entity type.
        addEntity : function(entityResult) {
            if (!entityResult)
                return;

            var entity = entityResult.entity;
            var report = entityResult.report;

            var currentPermissionType = controls.getPermissionType();
            if (controls.validator.isDuplicateEntityForType(entity, currentPermissionType)) {
                table.highlightEntityRow(entity, currentPermissionType);
                return;
            }

            var entry = {
                entity : entity,
                view : true,     // always give added users/groups both permissions
                edit : true,
                report : report
            };
            table.addRow(entry, currentPermissionType);
            Confluence.Binder.userHover(); // user hover bindings
            table.changedByUser();
            table.highlightEntityRow(entity, currentPermissionType);
            controls.nameField.removeFromNameInput(entity.name);
        },

        makePermissionStrings : function () {
            var permissions = table.makePermissionMap(false);
            return {
                viewPermissionsUsers : permissions.user.view.join(","),
                editPermissionsUsers : permissions.user.edit.join(","),
                viewPermissionsGroups : permissions.group.view.join(","),
                editPermissionsGroups : permissions.group.edit.join(",")
            };
        },

        /**
         * Calculates the correct height for the dialog divs, needed for the scroll bar.
         * TODO - remove this when DB writes AJS.Dialog2.
         */
        refreshLayout : function() {
            var tablesDiv = $("#page-permissions-tables");
            var dialog = $("#update-page-restrictions-dialog");

            var dialogHeight = dialog.outerHeight();
            var headerHeight = dialog.find("h2").outerHeight();
            var buttonBarHeight = dialog.find(".dialog-button-panel").outerHeight();
            var panelHeight = dialogHeight - (headerHeight + buttonBarHeight);
            var formHeight = $("#page-permissions-editor-form").outerHeight();
            var tablesHeight = panelHeight - formHeight;

            $("#update-page-restrictions-dialog .dialog-panel-body").height(panelHeight);
            tablesDiv.height(tablesHeight);
        }
    };

    /*--------------------------------------------------------------------------
        Public methods called by pop ups and page-editor.js
    --------------------------------------------------------------------------*/
    $.extend(AJS.PagePermissions, {
        // Callback from Choose Users popup
        addUserPermissions : function (commaDelimitedUserNames) {
            permissionManager.addNames(commaDelimitedUserNames, USER);
        },

        // Callback from Choose Groups popup
        addGroupPermissions : function (commaDelimitedGroupNames) {
            permissionManager.addNames(commaDelimitedGroupNames, GROUP);
        },

        makePermissionStrings : permissionManager.makePermissionStrings
    });

    /**
     * Adds rows to the permission table based on JSON data received from the back end. The data should have three
     * parts :
     *      1. permissions - An array of permission arrays, containing :
     *          a. permissionType
     *          b. entityType
     *          c. entity name (username or groupname)
     *          d. owning content name, if not the current page
     *      2. users - A map of usernames to User objects
     *      3. groups - A map of groupnames to Group objects
     */
    function loadTableFromJson (data) {
        table.allowEditing(data.userCanEditRestrictions);
        table.resetInherited();
        if (!permissionManager.permissionsEdited)
            table.resetDirect();

        if (!data) return;

        // 1. First, build up map of permissions for entity. // UI-973
        // TODO - If this design stays, build the map at the back-end. dT
        for (var i = 0, len = data.permissions.length; i < len; i++) {
            var permission = data.permissions[i];
            var permissionType = permission[0].toLowerCase();   // will come in as "View", "Edit"
            var entityType = permission[1];
            var entityName = permission[2];
            var wrappedEntity = (entityType == USER) ? data.users[entityName] : data.groups[entityName];
            var owningContentId = permission[3];
            var owningContentTitle = permission[4];

            var inherited = +owningContentId && owningContentId != AJS.params.pageId;
            if (permissionManager.permissionsEdited && !inherited)
                continue;

            var entryForEntityForPage = {
                owningId: owningContentId,
                entity: wrappedEntity.entity,
                report: wrappedEntity.report
            };
            entryForEntityForPage[permissionType] = true;
            entryForEntityForPage.owningTitle = owningContentTitle;
            entryForEntityForPage.inherited = inherited;

            table.addRow(entryForEntityForPage, permissionType);
        }
        if(data.permissions.length > 0)
        	Confluence.Binder.userHover(); // user hover bindings

        table.saveBackup();
        table.refresh();
    }

    /**
     * Updates the restrictions button on the edit page.
     *
     * Also synchronizes the hidden permission fields from the permissions table and notifies the user if they are
     * changed from the originals.
     */
    function updateEditPage () {

        var nameMap = table.makePermissionMap(false),
            icon = $("#rte-button-restrictions .icon"),
            text = $("#rte-button-restrictions .trigger-text"),
            restrictions = [].concat(nameMap.group.view).concat(nameMap.user.view).concat(nameMap.group.edit).concat(nameMap.user.edit);

        if (restrictions.length) {
            icon.removeClass("icon-unlocked").addClass("icon-locked");
            text.text(AJS.I18n.getText("page.restrictions.restricted"));
        }
        else {
            icon.removeClass("icon-locked").addClass("icon-unlocked");
            text.text(AJS.I18n.getText("page.restrictions.none"));
        }
        /**
         * Updates the hidden fields that submit the edited permissions in the form. The fields are updated with the
         * data in the Permissions table.
         */
        permissionManager.permissionsEdited = false;
        var permissionStrs = permissionManager.makePermissionStrings();
        for (var key in permissionStrs) {
            var updatedPermStr = permissionStrs[key];
            $("#" + key).val(updatedPermStr);

            if (permissionManager.originalPermissions[key] != updatedPermStr) {
                permissionManager.permissionsEdited = true;
            }
        }
        
    }

    /**
     * Closes the dialog after saving or cancelling, scrolling the web page to where it was prior to opening.
     */
    function closeDialog () {
        controls.validator.resetValidationErrors();
        table.clearHighlight();
        popup.hide();
        window.scrollTo(permissionManager.bookmark.scrollX, permissionManager.bookmark.scrollY);
    }

    /**
     * Called when the user saves the permissions. If creating/editing a page, just updates the hidden permission inputs.
     * If on any other screen, saves the permissions to the backend.
     */
    function saveClicked () {
        // TODO - the disabling of the submit button should be in AJS.Dialog.
        var submitButton = $(".permissions-update-button").disable();
        if (isEditPage) {
            updateEditPage();

            // Notify the user that the changes are not yet saved to the back-end.
            AJS.setVisible("#page-permissions-unsaved-changes-msg", permissionManager.permissionsEdited);
            submitButton.enable();
            closeDialog();
        } else {
            var post = permissionManager.makePermissionStrings();
            post.pageId = AJS.params.pageId;
            $("#waitImage").show();

            AJS.safe.post(contextPath + "/pages/setpagepermissions.action", post, function(data) {
                $("#waitImage").hide();

                // If any permissions set, show padlock
                AJS.setVisible("#content-metadata-page-restrictions", data.hasPermissions);
                submitButton.enable();
                closeDialog();
            }, "json");
        }
    }

    /**
     * Called when the user cancels the dialog via Cancel button or escape.
     */
    function cancel () {
        closeDialog();
        if (isEditPage) {
            table.restoreBackup();
        }
        return false;
    }

    /**
     * Creates the permissions dialog with the main panel coming from a template, then initializes the Controls and Table
     * handlers.
     */
    function initPopup () {
        popup = AJS.ConfluenceDialog({
            width : 865,
            height: 530,
            id: "update-page-restrictions-dialog",
            onCancel: cancel
        });

        popup.addHeader(AJS.I18n.getText("page.perms.dialog.heading"));
        popup.addPanel("Page Permissions Editor", AJS.renderTemplate("page-permissions-div"));
        popup.addButton(AJS.I18n.getText("update.name"), saveClicked, "permissions-update-button");
        popup.addCancel(AJS.I18n.getText("close.name"), cancel);
        popup.popup.element.find(".dialog-title").append(Confluence.Templates.PagePermissions.helpLink());

        controls = AJS.PagePermissions.Controls(permissionManager);
        var $table = $("#page-permissions-table").bind("changed", updateButtonsUnsavedChanges);
        table = AJS.PagePermissions.Table($table);
        permissionManager.table = table;
    }

    /**
     * Makes final changes to the popup and then displays it.
     */
    function showPopup (data) {
        permissionManager.bookmark = {
            scrollX : document.documentElement.scrollLeft,
            scrollY : document.documentElement.scrollTop
        };

        updateButtonsNoUnsavedChanges();

        controls.setVisible(data.userCanEditRestrictions);

        AJS.setVisible(".permissions-update-button", data.userCanEditRestrictions);

        popup.show();
        permissionManager.refreshLayout();
    }

    /**
     * Gets page restrictions (direct and inherited), plus group/user details from the server (view) or dom (edit).
     * Also gets a flag if the user has permission to change restrictions or not from the server.
     */
    function loadPermissions(callback, editingPage) {
        // If editingPage, Space and Parent Page may have changed due to the Location editor on the edit screen.
        var spaceKey = (editingPage && $("#newSpaceKey").val()) || AJS.Meta.get('space-key');
        var parentPageTitle = (editingPage && $("#parentPageString").val()) || "";
        var params = {
            pageId: AJS.Meta.get('page-id'),
            parentPageId: AJS.Meta.get('parent-page-id'),
            parentPageTitle: parentPageTitle,
            spaceKey: spaceKey
        };
        var url;
        if (AJS.params.newPage) {
            params.draftId = AJS.Meta.get('content-id');
        }

        $("#waitImage").show();

        if(isEditPage) {
            url = contextPath + "/pages/geteditpagepermissions.action";
            $.extend(params, {
                viewPermissionsUsers : $("#viewPermissionsUsers").val(),
                editPermissionsUsers : $("#editPermissionsUsers").val(),
                viewPermissionsGroups : $("#viewPermissionsGroups").val(),
                editPermissionsGroups : $("#editPermissionsGroups").val()
            });
        } else {
            url = contextPath + "/pages/getpagepermissions.action";
        }

        $.getJSON(url, params, function(data) {
            $("#waitImage").hide();
            loadTableFromJson(data);
            callback(data);
        });
    }

    /**
     * Called when the user opens the popup from the view or edit screens.
     *
     * @param isEditingAPage true if the popup is being called from a create/edit page screen, false otherwise
     */
    function openPopup (isEditingAPage) {
        popup || initPopup();
        loadPermissions(showPopup, isEditingAPage);
    }

    function updateButtonsUnsavedChanges() {
        $(".permissions-update-button").enable();
        $(".button-panel-cancel-link").text(AJS.I18n.getText("cancel.name"));
    }

    function updateButtonsNoUnsavedChanges() {
        $(".permissions-update-button").disable();
        $(".button-panel-cancel-link").text(AJS.I18n.getText("close.name"));
    }

    $("#content-metadata-page-restrictions, #action-page-permissions-link").click(function (e) {
        openPopup(false);
        e.preventDefault();
    });

    /**
     * Show dialog link for the Create/Edit page screen.
     */
    $("#rte-button-restrictions").click(function (e) {
        openPopup(true);
        e.preventDefault();
    });

    if (isEditPage) {
        // Store original values of hidden permission fields for comparison on dialog save, to show "Unsaved changes"
        permissionManager.originalPermissions = {
            viewPermissionsUsers : $("#viewPermissionsUsers").val(),
            editPermissionsUsers : $("#editPermissionsUsers").val(),
            viewPermissionsGroups : $("#viewPermissionsGroups").val(),
            editPermissionsGroups : $("#editPermissionsGroups").val()
        };
    }
});
