/**
 * Controls the Table component of the Page Permissions dialog.
 */
AJS.PagePermissions.Table = function ($table) {

    var $ = AJS.$,
        t = this;

    /**
     * Determines if the user can edit the permissions in the table.
     */
    var canEdit = false;

    /**
     * Called when permissions are added or removed, updates the no view/edit rows, markers, and row highlights.
     */
    this.refresh = function () {

        var directViewRows = $table.find(".view-permission-row");
        var editRows = $table.find(".edit-permission-row");

        var hasViewPermissions = directViewRows.length > 0;
        var hasEditPermissions = editRows.length > 0;

        // Display "No view/edit restrictions" message row if no restrictions.
        AJS.setVisible("#page-permissions-no-views", !hasViewPermissions);
        AJS.setVisible("#page-permissions-no-edits", !hasEditPermissions);

        $table.each(function() {
            // Only display "Viewing restricted to" message on first view/edit row.
            $(".view-permission-row .page-permissions-marker-cell span", this).removeClass("first-of-type").filter(":first").addClass("first-of-type");
            $(".edit-permission-row .page-permissions-marker-cell span", this).removeClass("first-of-type").filter(":first").addClass("first-of-type");
        });

        t.clearHighlight();
    };

    /**
     * Saves a copy of the last-changed table in case the user makes changes and then cancels.
     */
    this.saveBackup = function () {
        this.copy = $table.children().clone(true);
    };

    /**
     * Restores the saved copy
     */
    this.restoreBackup = function() {
        $table.children().remove();
        $table.append(this.copy);
    };

    // Tracks the number of added rows to use as a unique id.
    this.addCount = 0;

    /**
     * Turns the table rows into a map of entity name arrays.
     *
     * @param getDisplayNames if true, the display names of the entities are returned instead of the internal names.
     */
    this.makePermissionMap = function (getDisplayNames) {
        var permissions = {
            user : {
                view: [],
                edit: []
            },
            group : {
                view: [],
                edit: []
            }
        };

        $table.find("tr.view-permission-row, tr.edit-permission-row").each(function () {
            var row = $(this);
            var entityType = row.is(".user-permission") ? "user" : "group";
            var permissionType = row.is(".view-permission-row") ? "view" : "edit";

            // For summary get the "full name", else the "name"
            var nameType = (getDisplayNames && (entityType == "user")) ? "display-name" : "name";
            var entityName = row.find(".permission-entity-" + nameType).text();

            permissions[entityType][permissionType].push(entityName);
        });

        return permissions;
    };

    /** Not used unless we move on to checkboxes again */
    this.makePermissionMapForCheckboxes = function (forSummary) {
        var permissions = {
            user : {
                view: [],
                edit: []
            },
            group : {
                view: [],
                edit: []
            }
        };

        $table.find("tr.view-permission-row").each(function () {
            var row = $(this);
            var viewChecked = !!row.find(".view-permission-cell input").attr("checked");
            var editChecked = !!row.find(".edit-permission-cell input").attr("checked");

            if (viewChecked || editChecked) {
                var entityType = row.hasClass("user-permission") ? "user" : "group";

                // For summary get the "full name", else the "name"
                var nameType = (forSummary && (entityType == "user")) ? "display-name" : "name";
                var entityName = row.find(".permission-entity-" + nameType).text();

                // Don't count inherited views unless for summary
                if (viewChecked && (forSummary || !row.hasClass("readonly-permission"))) {
                    permissions[entityType].view.push(entityName);
                }
                if (editChecked) {
                    permissions[entityType].edit.push(entityName);
                }
            }
        });

        return permissions;
    };

    var setupEntity = function (row, entity) {
        var nameColumn = row.find("td.permission-entity");
        var imgSrc = Confluence.getContextPath() + (entity.profilePictureDownloadPath || "/images/icons/" + entity.type + "_16.gif");
        nameColumn.find("img").attr("src", imgSrc);

        nameColumn.find(".permission-entity-name").text(entity.name);
        if (entity.type == "group") { // || entity.fullName == entity.name || !entity.name) {
            nameColumn.find(".permission-entity-name-wrap").hide();
        }
        nameColumn.find(".permission-entity-display-name").text(entity.fullName || entity.name);

        var userBox = nameColumn.find("span.entity-container");
        if (entity.type == "user") {
            userBox.addClass("content-hover user-hover-trigger").attr("data-username", entity.name);
        }
    };

    this.addRow = function(entry, permissionType) {

        var entity = entry.entity;

        var newRowElement = $(Confluence.Templates.PagePermissions.permissionRow());
        newRowElement.addClass(entity.type + "-permission");
        newRowElement.addClass(permissionType + "-permission-row");

        // Change marker row text to match permission type.
        if (permissionType == "edit") {
            newRowElement.find(".page-permissions-marker-cell span").text(AJS.I18n.getText("page.perms.editing.restricted.to"));
        }

        // 1. User or Group with permission
        setupEntity(newRowElement, entity);

        var readOnlyRow = !canEdit || entry.inherited || entry.readOnly;

        if (readOnlyRow) {
            newRowElement.addClass("readonly-permission");
        }

        // 2. Remove col
        var removeLink = newRowElement.find(".remove-permission-link");
        if (readOnlyRow || !canEdit) {
            removeLink.remove();
        } else {
            removeLink.attr("id", "remove-permission-" + this.addCount++);
            removeLink.click(function (e) {
                $(this).closest("tr").remove();
                t.changedByUser();
                return AJS.stopEvent(e);
            });
        }

        if (entry.inherited) {
            // If there is already a table for the owning content, add this row to that
            var inheritedTable = $(".page-permissions-table[owningTitle='" + AJS.escape(entry.owningTitle) + "']");
            if (!inheritedTable.length) {
                // Else clone a new table
                var newTableDiv= $(Confluence.Templates.PagePermissions.inheritedPermissionsTable());
                inheritedTable = newTableDiv.find("table");
                inheritedTable.attr("owningTitle", AJS.escape(entry.owningTitle));

                var desc = newTableDiv.find(".page-inherited-permissions-table-desc");

                // Title/link for the parent page
                var link = desc.find("a"),
                    href = Confluence.getContextPath() + "/pages/viewpage.action?pageId=" + entry.owningId;
                link.attr("href", href).attr("target", "_blank").text(entry.owningTitle).addClass("page-perms-owningTitle");

                // Title of the current page
                var editorPageTitle = $("#content-title");  // use the title field if page create or edit
                var title = editorPageTitle.length ? editorPageTitle.val() : AJS.Meta.get('page-title');
                desc.find("span").addClass(".page-perms-inherited-this-page").text(title);

                $("#page-inherited-permissions-tables").append(newTableDiv);
            }
            inheritedTable.append(newRowElement);


            $("#page-inherited-permissions-table-div").removeClass("hidden");

        } else {
            // Insert the new row either a) after the last row for the same entity or b) at the end of the table.
            if (permissionType == "view") {
                $("#page-permissions-no-edits").before(newRowElement);
            } else {
                $table.append(newRowElement);
            }
        }
    };

    /**
     * Called when the user interacts with the dialog, adding, removing rows or changing checkboxes.
     */
    this.changedByUser = function () {
        $table.trigger("changed");
        t.clearHighlight();
        t.refresh();
    };

    /**
     * Resets the table when new JSON data populated. Creates a fake "Everyone" row at the top (if enabled).
     */
    this.resetDirect = function () {
        $table.find("tr:not(.marker-row)").remove();
        t.addCount = 0;
    };

    /**
     * Resets the inherited permissions tables when new JSON data populated.
     */
    this.resetInherited = function () {
        $("#page-inherited-permissions-tables div").remove();
    };

    /**
     * Clear any highlighted rows when the user clicks the direct permissions table.
     */
    $table.click(function (e) {
        t.clearHighlight();
    });

    $("#page-inherited-permissions-table-desc").click(function() {
        $(".page-inheritance-togglable").toggleClass("hidden");
        $(".icon", this).toggleClass("twisty-open").toggleClass("twisty-closed");
    });
    /**
     * Finds the uninherited table row for the given entity and highlights it, e.g. if the user tries to reenter the
     * entity name.
     */
    this.highlightEntityRow = function(entity, permissionType) {
        var highlightedRow = $table.find("." + permissionType + "-permission-row").filter(function() {
            return $(".permission-entity-name", this).text() == entity.name;
        });
        $("#page-permissions-tables").simpleScrollTo(highlightedRow);
        highlightedRow.addClass("highlighted-permission");
    };

    this.clearHighlight = function() {
        $("tr.highlighted-permission").removeClass("highlighted-permission");
    };

    this.allowEditing = function(allowEditing) {
        canEdit = allowEditing;
    };

    return this;
};
