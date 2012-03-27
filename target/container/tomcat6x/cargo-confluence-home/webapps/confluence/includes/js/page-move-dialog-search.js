/**
 * The search panel of the move page dialog.
 *
 * @param controls should contain:
 * - an 'error' function for passing errors back to the caller
 * - a 'clearErrors' function to indicate no problems occurred
 * - a 'select' function to handle selection of a new parent page
 */
jQuery.fn.movePageSearch = function (controls) {
    var $ = jQuery;
    var contextPath = $("#confluence-context-path").attr("content");
    var container = this;
    var button = $("input[type=button]", container);
    var query = $("input.search-query", container);
    var space = $(".search-space", container);
    var results = $(".search-results", container);

    // enter keypress on space or query should search
    $([ space[0], query[0] ]).keydown(function (e) {
        if (e.which == 13) {
            button.click();
        }
    });

    // arrows in query or results should move selection up or down
    $([ query[0], results[0] ]).keydown(function (e) {
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

    button.click(function () {
        controls.clearErrors();
        var queryString = query.val();
        if (queryString == "") {
            results.empty();
            return;
        }
        results.html(Confluence.Templates.MovePage.searchResultsLoading());

        $.ajax({
            type: "GET",
            dataType: "json",
            data: {
                queryString: queryString,
                where: space.val(),
                types: ["spacedesc", "personalspacedesc", "page"]
            },
            url: contextPath + "/json/search.action",
            error: function () {
                controls.error(AJS.I18n.getText("move.page.dialog.search.error"));
            },
            success: function(data, status) {
                if (status != "success") {
                    controls.error(AJS.I18n.getText("move.page.dialog.search.error"));
                    return;
                }

                var searchResultsControls = { 
                    // called when a row is selected
                    select: function (rowElement, data) {
                        if (data.type == "page")
                            controls.select(data.spaceKey, data.spaceName, data.title, data.id);
                        else
                            controls.select(data.spaceKey, data.spaceName);
                    }
                };
                
                results.searchResultsGrid(queryString, data, $(controls).extend(searchResultsControls), {
                    "noSearchResults": AJS.I18n.getText("move.page.dialog.search.no.results"),
                    "resultsCount": AJS.I18n.getText("move.page.dialog.search.results.count")
                });
            }
        });
    });
};