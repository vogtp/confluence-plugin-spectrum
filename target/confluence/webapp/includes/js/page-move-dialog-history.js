/**
 * The history (or 'Recently Viewed' in the new vernacular) panel of the move page dialog.
 *
 * @param controls should contain:
 * - an 'error' function for passing errors back to the caller
 * - a 'clearErrors' function to indicate no problems occurred
 * - a 'select' function to handle selection of a new parent page
 */
jQuery.fn.movePageHistory = function (controls) {
    var $ = jQuery;
    var contextPath = $("#confluence-context-path").attr("content");
    var container = this;
    var results = $(".search-results", container);

    // arrows in results should move selection up or down
    $(results).keydown(function (e) {
        function moveSelection(delta) {
            var results = $(".search-result", container);
            var selected = $(".search-result.selected", container);
            var index = results.index(selected) + delta;
            if (index < 0) index = results.length - 1;
            if (index >= results.length) index = 0;
            results.eq(index).click();
        }

        if (e.which == 38) {
            moveSelection(-1);
        } else if (e.which == 40) {
            moveSelection(1);
        }
    });

    results.html(Confluence.Templates.MovePage.pageHistoryLoading());

    $.ajax({
        type: "GET",
        dataType: "json",
        data: {
            types: ["spacedesc", "personalspacedesc", "page"]
        },
        url: contextPath + "/json/history.action",
        error: function () {
            controls.error(AJS.params.movePageDialogHistoryError);
        },
        success: function(data, status) {
            if (status != "success") {
                controls.error(AJS.params.movePageDialogHistoryError);
                return;
            }
            if (!data.history || data.history.length == 0) {
                results.html("<div class='no-results'>" + AJS.I18n.getText("move.page.dialog.history.no.results") + "</div>");
                return;
            }

            results.html(AJS.getTemplate("searchResultsGrid").toString());
            $.each(data.history, function () {
                var item = this;
                if (item.id == AJS.params.pageId) { // skip current page
                    return;
                }
                var el = AJS.$(AJS.renderTemplate("searchResultsGridRow", [
                    item.title,
                    contextPath + item.url,
                    item.type,
                    item.spaceName,
                    item.spaceKey,
                    item.friendlyDate,
                    item.date
                ]));
                $(el).click(function (e) {
                    if (item.type == "page") {
                        controls.select(item.spaceKey, item.spaceName, item.title, item.id);
                    } else {
                        controls.select(item.spaceKey, item.spaceName);
                    }
                    results.find(".selected").removeClass("selected");
                    $(this).addClass("selected");
                    return AJS.stopEvent(e);
                });
                $(el).hover(function () {
                    $(this).addClass("hover");
                }, function () {
                    $(this).removeClass("hover");
                });
                results.find("table").append(el);
            });
            if ($(".search-result", results).length == 0) {
                results.html("<div class='no-results'>" + AJS.I18n.getText("move.page.dialog.history.no.results") + "</div>");
            }
        }
    });
};