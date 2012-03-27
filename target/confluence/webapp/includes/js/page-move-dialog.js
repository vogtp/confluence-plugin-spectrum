AJS.toInit(function ($) {
    Confluence.MovePageDialog = function (options) {
        var pageTitle = AJS.Meta.get('page-title');
        options = $.extend({
            spaceKey: AJS.Meta.get('space-key'),
            spaceName: AJS.Meta.get('space-name'),
            pageTitle: pageTitle,
            parentPageTitle: AJS.Meta.get('parent-page-title'),
            title: AJS.I18n.getText("move.page.dialog.title.view", pageTitle), // "Move Page - 'Title'
            buttonName: AJS.I18n.getText("move.name"),
            openedPanel: AJS.I18n.getText("move.page.dialog.panel.location"), // Ideally this would be the Browse panel, however due to performance reasons we can't do this
            moveHandler: function (dialog) {
                AJS.log("No move handler defined. Closing dialog.");
                dialog.remove();
            },
            cancelHandler: function (dialog) {
                dialog.remove();
                return false;
            }
        }, options);

        var newLocation = {
            spaceKey : options.spaceKey,
            spaceName : options.spaceName,
            parentPageTitle : options.parentPageTitle
        };
        var newSpaceKey = options.spaceKey;
        var newSpaceName = options.spaceName;
        var newParentPage = options.parentPageTitle;

        var reorderTargetId = "";
        var reorderTargetPosition = "";

        // called when the ordering of a page is set beneath a parent.
        var reorder = function (targetId, positionIndicator) {
            reorderTargetId = targetId;
            reorderTargetPosition = positionIndicator;
        };

        var structure = AJS.ConfluenceDialog({
            width : 800,
            height: 590,
            id: "move-page-dialog"
        });
        structure.addHeader(options.title);
        structure.addPanel(AJS.I18n.getText("move.page.dialog.panel.location"), AJS.renderTemplate("movePageDialog"), "location-panel", "location-panel-id");
        structure.addPanel(AJS.I18n.getText("move.page.dialog.search.title"), AJS.renderTemplate("movePageSearchPanel"), "search-panel", "search-panel-id");
        structure.addPanel(AJS.I18n.getText("move.page.dialog.history.title"), Confluence.Templates.MovePage.historyPanel({pageTitle: AJS.Meta.get("page-title")}), "history-panel", "history-panel-id");
        structure.addPanel(AJS.I18n.getText("move.page.dialog.browse.title"), Confluence.Templates.MovePage.browsePanel({pageTitle: AJS.Meta.get("page-title")}), "browse-panel", "browse-panel-id");

        // panel switching logic

        structure.get('#"'+ AJS.I18n.getText("move.page.dialog.panel.location") + '"')[0].onselect = function () {
            $("#new-space-key").val(newSpaceKey);
            $("#new-space").val(newSpaceName);
            $("#new-parent-page").val(newParentPage).select();
        };
        structure.get('#"'+AJS.I18n.getText("move.page.dialog.search.title")+ '"')[0].onselect = function () {
            // always clear out the previous selection
            $("#move-page-dialog .search-panel .search-results .selected").removeClass("selected");
            $("#move-page-dialog input.search-query").focus();
        };
        structure.get('#"'+AJS.I18n.getText("move.page.dialog.history.title")+ '"')[0].onselect = function () {
            // refresh the history panel every time it loads, in case the user has navigated elsewhere in another tab
            $(".history-panel", dialog).movePageHistory(controls);
        };
        structure.get('#"'+AJS.I18n.getText("move.page.dialog.browse.title")+ '"')[0].onselect = function () {
            // always refresh the tree when loading the Browse tab, don't load it initially
            AJS.log("browse: " +[newSpaceKey, newSpaceName, newParentPage].join());
            $(".browse-panel", dialog).movePageBrowse(controls, newSpaceKey, newSpaceName, newParentPage, originalParent, options.pageTitle);
        };

        var gotoReorderPage = function (dialog) {
            dialog.nextPage();
            var dialogDom = $("#move-page-dialog");
            $(".ordering-panel", dialogDom).movePageOrdering(newSpaceKey, newParentPage, options.pageTitle, reorder);
        };

        var moveFunction = function (dialog) {
            var space = $("#new-space:visible").val();
            var spaceKey = $("#new-space-key").val();
            var parentPage = $("#new-parent-page:visible").val();
            if (space && (space != newSpaceName || spaceKey != newSpaceKey || parentPage != newParentPage)) {
                AJS.MoveDialog.getBreadcrumbs({spaceKey:spaceKey, pageTitle:parentPage}, function () {
                    Confluence.PageLocation.set({
                        spaceKey: spaceKey,
                        spaceName: space,
                        parentPageTitle: parentPage
                    });
                    options.moveHandler(dialog, spaceKey, space, parentPage, reorderTargetId, reorderTargetPosition, setErrors);
                }, function (xhr) {
                        $('#new-parent-breadcrumbs').html(Confluence.Templates.MovePage.breadcrumbError());
                        if (xhr.status == 404) {
                            controls.error(AJS.I18n.getText("move.page.dialog.location.not.found"));
                        }
                    });
            } else {
                Confluence.PageLocation.set({
                    spaceKey: newSpaceKey,
                    spaceName: newSpaceName,
                    parentPageTitle: newParentPage
                });
                options.moveHandler(dialog, newSpaceKey, newSpaceName, newParentPage, reorderTargetId, reorderTargetPosition, setErrors);
            }
        };

        // Decide whether to execute the move or goto the re-order page instead.
        var executeMove = function (dialog) {
            if ($("#reorderCheck")[0].checked) {
                gotoReorderPage(dialog);
            } else {
                moveFunction(dialog);
            }
        };

        structure.addButton(options.buttonName, executeMove, "move-button");
        structure.addCancel(AJS.I18n.getText("cancel.name"), options.cancelHandler);
        structure.popup.element.find(".dialog-title").append(Confluence.Templates.MovePage.helpLink());

        // Add the ordering page
        structure.addPage()
        .addHeader(options.title)
        .addPanel(AJS.I18n.getText("move.page.dialog.ordering.title"), Confluence.Templates.MovePage.orderingPagePanel(), "ordering-panel", "ordering-panel-id")
        .addLink(AJS.I18n.getText("move.page.dialog.back.button"), function(dialog) { dialog.prevPage(); }, "dialog-back-link")
        .addButton(AJS.I18n.getText("move.page.dialog.order.button"), moveFunction, "reorder-button")
        .addCancel(AJS.I18n.getText("cancel.name"), options.cancelHandler);

        var moveButton = structure.get("button#" + options.buttonName)[0].item;
        $("button.move-button").before(Confluence.Templates.MovePage.reorderCheckbox());

        structure.gotoPage(0);
        structure.show();

        var dialog = $("#move-page-dialog");

        // move breadcrumbs to the bottom of all pages on the first page of the dialog (location selection page)
        $(".location-panel .location-info", dialog).appendTo($(".dialog-page-body:first", dialog));

        // error messages next to the buttons
        $(".dialog-button-panel:visible", dialog).prepend(Confluence.Templates.MovePage.errorMessage());

        var breadcrumbs = new AJS.MoveDialog.Breadcrumbs($('#new-parent-breadcrumbs'));

        function setErrors(errors) {
            if (!errors || errors.length == 0) {
                $("#move-errors").addClass("hidden");
                $(moveButton).attr("disabled", "");
                return;
            }
            if (!$.isArray(errors)) errors = [ errors ];
            $("#move-errors").text(errors[0]).attr("title", errors.join("\n")).removeClass("hidden");
            structure.gotoPage(0); // errors all show on the first page, where you can correct them
        }

        var controls = {
            moveButton: moveButton,
            clearErrors: function () {
                setErrors([]);
            },
            error: setErrors,

            // called when a destination is selected on one of the panels
            select: function (spaceKey, spaceName, parentPageTitle) {
                AJS.log("select: " +[spaceKey, spaceName, parentPageTitle].join());
                newSpaceKey = spaceKey;
                newSpaceName = spaceName;
                newParentPage = parentPageTitle || "";
                $(moveButton).attr("disabled", "disabled"); // disable submission until the location is validated
                breadcrumbs.update({spaceKey:newSpaceKey, title:newParentPage}, controls);

            }
        };
        structure.overrideLastTab();
        structure.get('#"'+ options.openedPanel + '"').select();

        // render the current breadcrumbs immediately
        var originalParent = AJS.Meta.get('parent-page-title') || AJS.Meta.get('from-page-title');
        var currentBreadcrumbs = new AJS.MoveDialog.Breadcrumbs($('#current-parent-breadcrumbs'));
        currentBreadcrumbs.update({spaceKey:AJS.Meta.get('space-key'), title:originalParent}, controls);

        $(".location-panel", dialog).movePageLocation(controls);
        $(".search-panel", dialog).movePageSearch(controls);
        $(".history-panel", dialog).movePageHistory(controls);


        $("#new-parent-page").select(); // focus the new parent page input
        if(options.hint) {
            structure.addHelpText(options.hint.template || options.hint.text,options.hint.arguments);
        }
        return dialog;
    };

    var MovePageParams = function (spaceKey, pageTitle, siblingId, siblingRelativePosition) {
        var params = {
            pageId: AJS.params.pageId,
            spaceKey: spaceKey
        };

        if (siblingId) {
            params.position = siblingRelativePosition; // may be above or below
            params.targetId = siblingId;
        }
        else if (pageTitle != "") {
            params.targetTitle = pageTitle;
            params.position = "append";
        } else {
            params.position = "topLevel";
        }
        return params;
    };

    function viewPageMoveHandler(dialog, newSpaceKey, newSpaceName, newParentPage, newSiblingId, newSiblingPosition, setErrors) {
        dialog = dialog.popup.element;
        dialog.addClass("waiting");
        $("button", dialog).attr("disabled", "disabled");
        var throbber = $("<div class='throbber'></div>");
        dialog.append(throbber);
        var killSpinner = Raphael.spinner(throbber[0], 100, "#666");

        function error(messages) {
            setErrors(messages);
            dialog.removeClass("waiting");
            killSpinner();
            $("button", dialog).attr("disabled", "");
        }

        $.ajax({
            url: contextPath + "/pages/movepage.action",
            type: "GET",
            dataType: "json",
            data: new MovePageParams(newSpaceKey, newParentPage, newSiblingId, newSiblingPosition),
            error: function () {
                error(AJS.I18n.getText("move.page.dialog.move.failed"));
            },
            success: function (data) {
                var errors = [].concat(data.validationErrors || []).concat(data.actionErrors || []).concat(data.errorMessage || []);
                if (errors.length > 0) {
                    error(errors);
                    return;
                }
                window.location.href = contextPath + data.page.url + (data.page.url.indexOf("?") >= 0 ? "&" : "?") + "moved=true";
            }
        });
    }

    $("#action-move-page-dialog-link").click(function (e) {
        e.preventDefault();

        if ($("#move-page-dialog").length > 0) {
            $("#move-page-dialog, body > .shadow, body > .aui-blanket").remove();
        }

        new Confluence.MovePageDialog({
            moveHandler: viewPageMoveHandler
        });

        return false;
    });

    var currentSpaceName; // space names aren't stored in hidden fields, so store it in a variable

    $("#rte-button-location").click(function (e) {
        e.preventDefault();

        if ($("#move-page-dialog").length > 0) {
            $("#move-page-dialog, body > .shadow, body > .aui-blanket").remove();
        }
        new Confluence.MovePageDialog({
            spaceName: currentSpaceName,
            spaceKey: $("#newSpaceKey").val(),
            pageTitle: $("#content-title").val(),
            parentPageTitle: $("#parentPageString").val(),
            buttonName: AJS.I18n.getText("move.name"),
            title: AJS.I18n.getText("move.page.dialog.title.edit"),
            moveHandler: function (dialog, newSpaceKey, newSpaceName, newParentPage, targetId, newPositionIndicator, setErrors) {
                // TODO: AJAX validation, should use setErrors
                currentSpaceName = newSpaceName;
                $("#newSpaceKey").val(newSpaceKey);
                $("#parentPageString").val(newParentPage);
                if (newParentPage != "") {
                    $("#position").val("append");
                } else {
                    $("#position").val("topLevel");
                }

                // If explicit position has been set then override the positions that may have been set up
                if (targetId) {
                    $("#targetId").val(targetId);
                    $("#position").val(newPositionIndicator);
                }

                dialog.remove();
            }
        });

        return false;
    });

    /**
     * Makes the current location of the viewed/edited page available to other scripts.
     */
    var location = null;
    Confluence.PageLocation = {
        get: function () {
            if (location)
                return location;  // location has been changed since page load by the Move Page Dialog

            return {
                spaceName: AJS.Meta.get('space-name'),
                spaceKey: AJS.Meta.get('space-key'),
                parentPageTitle: AJS.Meta.get('parent-page-title')
            };
        },

        set: function (loc) {
            location = loc;
        }
    };
});
