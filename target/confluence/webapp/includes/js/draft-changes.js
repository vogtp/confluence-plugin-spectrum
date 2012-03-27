AJS.toInit(function($) {
    AJS.log("draft-changes initialising");

    var popup;

    var buildPopup = function(showMenu) {
        popup = new AJS.Dialog(860, 530, "view-diff-draft-dialog");
            var heading = AJS.I18n.getText("draft.heading");
            popup.addHeader(heading.replace(/\{0\}/, ""));
            var draftDialog = $(Confluence.Templates.DraftChanges.dialogContent());
            popup.addPanel("Diff", draftDialog);
            if (showMenu) {
                popup.addButton(AJS.I18n.getText("edit.name"), function (e) {
                    popup.hide();
                    if (Confluence.Editor && Confluence.Editor.Drafts) {
                        Confluence.Editor.Drafts.useDraft();
                    } else {
                        window.location = $(this).attr("data-href");
                    }
                }, "resume-diff-link");
                popup.addButton(AJS.I18n.getText("discard.name"), function (e) {
                    popup.hide();
                    if (Confluence.Editor && Confluence.Editor.Drafts) {
                        Confluence.Editor.Drafts.discardDraft();
                    } else {
                        window.location = $(this).attr("data-href");
                    }
                }, "discard-diff-link");
            }
            popup.addCancel(AJS.I18n.getText("close.name"), function () {
                popup.hide();
                return false;
            });
            draftDialog.removeClass("hidden");
    };

      var loadDiffInDialog = function(data, draftId) {

        $("#diff-view").html(data.htmlDiff);
        var heading = AJS.I18n.getText("draft.heading");
        popup.addHeader(heading.replace(/\{0\}/, data.title));
        popup.popup.element.find(".dialog-title").append(Confluence.Templates.DraftChanges.helpLink());

        var atl_token = $("#atlassian-token").attr("content");

        // Change the link url
        var contextPath = Confluence.getContextPath();
        $(".resume-diff-link").attr("data-href", contextPath + "/pages/resumedraft.action?draftId=" + draftId);
        $(".discard-diff-link").attr("data-href", contextPath + "/users/deletedraft.action?draftId=" + draftId + "&atl_token=" + atl_token);

        AJS.setVisible("#merge-warning", data.isMergeRequired);
    };

    var getDiffForLink = function(difflink) {
        var pageId, username, draftId;
        var loadDiffParamsFromLink = function(difflinkClass) {
            var matched = /draftPageId:([^ ]*)/.exec(difflinkClass);
            pageId = matched ? matched[1] : AJS.Meta.get('page-id');


            matched = /username:([^ ]*)/.exec(difflinkClass);
            username = matched ? matched[1] : AJS.Meta.get('remote-user');

            matched = /draftId:([^ ]*)/.exec(difflinkClass);
            draftId = matched ? matched[1] : null;
        };

        loadDiffParamsFromLink(difflink.attr("class"));

        AJS.safeAjax({
            url: Confluence.getContextPath() + "/draftchanges/viewdraftchanges.action",
            type: "GET",
            dataType: "json",
            data: {
                "pageId": pageId,
                "username": username
            },
            success: function(data) {
                if (data.actionErrors) {  // TODO - make nicer
                    var errorHtml = "";
                    var errors = data.actionErrors;
                    for (var i = 0; i < errors.length; i++)
                    {
                        AJS.log("error: " + (errors[i]));
                        errorHtml = errorHtml + "<div>" + errors[i] + "</div>";
                    }
                    $("#diff-view").html(errorHtml);
                } else {
                    loadDiffInDialog(data, draftId);
                }
            },
            error: function(data) {
                var msg = data["errors"] || "An unknown error has occurred. Please check your logs";
                $("#diff-view").html(msg);
            }
        });
    };

    var openDiffDialog = function(difflink, showMenu) {

        Confluence.Editor && Confluence.Editor.Drafts.save();

        if (!popup) {
            buildPopup(showMenu);
        }
        popup.addHeader(AJS.I18n.getText("loading.name"));
        $("#diff-view").html("<tr><td id='draft-changes-waiting-icon'>Loading...</td></tr>");
        getDiffForLink(difflink);
        popup.show();
    };

    // For edit page
    $("#draft-status").click(function (e) {
        var target = $(e.target);
        if (target.hasClass("view-diff-link")) {
            openDiffDialog(target, false);
        }
        return AJS.stopEvent(e);
    });

    // For "View my drafts" page and banner
    $(".view-diff-link").click(function (e) {
        var difflink = $(this);

        openDiffDialog(difflink, true);
        return AJS.stopEvent(e);
    });
});
