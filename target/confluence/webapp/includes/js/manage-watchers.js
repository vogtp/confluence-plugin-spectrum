/**
 * Includes dialogs and functionality related to notifications and watches.
 */
jQuery(function ($) {
    $("#manage-watchers-menu-item").click(function (e) {
        e.preventDefault(); // just in case something fails :-)
        var id = "manage-watchers-dialog";

        var dialog = new AJS.ConfluenceDialog({
            width: 865,
            height: 530,
            id: id,
            onCancel: function () {
                dialog.hide().remove();
            }
        });
        dialog.addHeader(AJS.I18n.getText("manage.watchers.dialog.title"));
        dialog.addPanel("default", Confluence.Templates.ManageWatchers.dialogContent({
            pageId: AJS.Meta.get("page-id"),
            xsrfToken: AJS.Meta.get("atl-token")
        }));
        dialog.addCancel(AJS.I18n.getText("close.name"), function () {
            dialog.hide().remove();
            return false;
        });
        dialog.show();
        var $dialog = $("#" + id);

        // add help link
        $dialog.find(".dialog-title").append(Confluence.Templates.ManageWatchers.helpLink());

        // add shortcut tip
        if (Confluence.KeyboardShortcuts && Confluence.KeyboardShortcuts.enabled) {
            dialog.addHelpText(AJS.I18n.getText("keyboard.shortcuts.dialog.tip", "w"));
        }

        // put tabindex in place programmatically
        $dialog.find("input:visible, button:visible").each(function (i) {
            $(this).attr("tabindex", i + 1);
        });

        AJS.applySearchPlaceholders($dialog);

        // remove watch handler -- called when remove buttons in page watch list are clicked
        $dialog.bind("remove-list-item.manage-watchers", function (e, data) {
            var item = data.item,
                list = data.list,
                username = data.username;
            item.addClass("removing");
            AJS.safe.ajax({
                dataType: 'json',
                type: 'POST',
                url: AJS.params.contextPath + '/json/removewatch.action',
                data: {
                    pageId: AJS.params.pageId,
                    username: username
                },
                error: function () {
                    alert(AJS.I18n.getText("manage.watchers.unable.to.remove.error"));
                    item.removeClass("removing");
                },
                success: function () {
                    item.slideUp().remove();
                    $dialog.trigger("list-updated.manage-watchers", { list: list });
                }
            });
        });

        // watchers updated handler -- called whenever items are added or removed from the list of watchers
        $dialog.bind("list-updated.manage-watchers", function (e, data) {
            var list = data.list;

            var hasUsers = $("li.watch-user", list).length > 0;
            if (!hasUsers) {
                list.find(".no-users").removeClass("hidden");
                return;
            }

            list.find(".no-users").addClass("hidden");

            // apply user hover
            Confluence.Binder.userHover();

            // ignore clicks on user links
            list.find(".confluence-userlink").each(function () {
                $(this).click(function (e) {
                    e.preventDefault();
                });
            });
        });

        // list data handler -- called when a list of watchers is retrieved via AJAX
        $dialog.bind("list-data-retrieved.manage-watchers", function (e, data) {
            var list = data.list,
                watchers = data.watchers;

            list.find(".watch-user").remove();
            if (watchers && watchers.length) {
                $.each(watchers, function () {
                    var username = this.name;
                    var params = {
                        username: username,
                        fullName: this.fullName,
                        url: AJS.params.contextPath + "/display/~" + this.name,
                        iconUrl: AJS.params.contextPath + this.profilePictureDownloadPath
                    };
                    var $item = $(Confluence.Templates.ManageWatchers.userItem(params));

                    list.append($item);

                    // enable "remove watch" button
                    $item.find(".remove-watch").click(function () {
                        $dialog.trigger("remove-list-item.manage-watchers", {
                            username: username,
                            item: $item,
                            list: list
                        });
                    });
                });
            }

            list.find(".loading").hide();
            $dialog.trigger("list-updated.manage-watchers", { list: list });
        });

        // populate lists with initial data
        var pageList = $dialog.find(".page-watchers .user-list");
        var spaceList = $dialog.find(".space-watchers .user-list");
        AJS.safe.ajax({
            url: AJS.params.contextPath + '/json/listwatchers.action',
            dataType: 'json',
            data: {
                pageId: AJS.params.pageId
            },
            error: function () {
                alert("Failed to retrieve watchers.");
            },
            success: function (data) {
                $dialog.trigger("list-data-retrieved.manage-watchers", { list: pageList, watchers: data.pageWatchers });
                $dialog.trigger("list-data-retrieved.manage-watchers", { list: spaceList, watchers: data.spaceWatchers });
            }
        });

        var $form = $dialog.find("form");
        var $input = $form.find("#add-watcher-user");
        var $hiddenField = $form.find("#add-watcher-username");
        var status = (function () {
            var $status = $form.find("> .status");
            return {
                clear: function () {
                    $status.addClass("hidden").removeClass("loading error").text("");
                },
                loading: function (message) {
                    $status.addClass("loading").removeClass("hidden error").html(message);
                },
                error: function(message) {
                    $status.addClass("error").removeClass("hidden loading").text(message);
                }
            };
        })();

        // enable AJAX form submission for add page watcher
        $form.ajaxForm({
            beforeSerialize: function () {
                if ($hiddenField.val() == "") {
                    // if the autocomplete wasn't used, submit whatever the user typed in the field
                    $hiddenField.val($input.val());
                }
            },
            beforeSubmit: function () {
                $input.blur().attr("disabled", "disabled");
                pageList.addClass("updating");
                status.loading(AJS.I18n.getText("manage.watchers.status.adding.watcher"));
            },
            dataType: 'json',
            error: function (xhr, message) {
                alert("Failed to add watcher: " + message);
            },
            success: function (data) {
                $hiddenField.val("");
                $input.attr("disabled", "").val("").focus();
                pageList.removeClass("updating");
                if (data.actionErrors && data.actionErrors.length) {
                    status.error(data.actionErrors[0]);
                    return;
                }
                $dialog.trigger("list-data-retrieved.manage-watchers", { list: pageList, watchers: data.pageWatchers });
                status.clear();
            }
        });

        Confluence.Binder.autocompleteUser();
        $input.bind("selected.autocomplete-user", function(e, data) {
            $form.submit();
        });

        $input.focus();
    });
});