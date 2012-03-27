/**
 * Displays the search results from search.action in a grid display of the current element.
 *
 * @param queryString the query string which the search was performed on
 * @param data JSON format of the results returned by search.action
 * @param controls an object with controls defined.
 * It should have a 'select' function to handle onclick events in the grid.
 * @param messages i18n messages required for the grid.
 */
(function () {
    var convertFromRestToSearchActionFormat = function (result) {
        return {
            id: result.id,
            title: result.title,
            url: AJS.REST.findLink(result.link),
            type: result.type,
            spaceName: result.space ? result.space.title : "",
            spaceKey: result.space ? result.space.key : "",
            friendlyDate: result.lastModifiedDate ? result.lastModifiedDate.friendly : "",
            date: result.lastModifiedDate ? result.lastModifiedDate.date : ""
        }
    };

    jQuery.fn.searchResultsGrid = function(queryString, data, controls, messages) {
        var $ = jQuery, resultsContainer = this;

        var results = data.results;
        if (!results || !results.length) {
            // Display a no result message like "No search results found matching 'cheese'"
            var message = AJS.format(messages.noSearchResults, AJS.escapeEntities(queryString));
            resultsContainer.html("<div class='no-results'>" + message + "</div>");
            return;
        }

        resultsContainer.html(AJS.getTemplate("searchResultsGrid").toString());

        if (!data.skipResultCount) {
            // Display a pagination message like "Showing results 21 to 30 of 50 for 'cheese'"
            var startIndex = data.startIndex + 1,
                endIndex = data.startIndex + results.length,
                resultsCount = AJS.format(messages.resultsCount, startIndex, endIndex, data.total, AJS.escapeEntities(queryString));

            resultsContainer.prepend(AJS.renderTemplate("searchResultsGridCount", AJS.html(resultsCount)));
        }

        for (var i = 0; i < results.length; i++) {
            // Convert each search result into a result row.
            var item = results[i];
            item = data.convertFromRest ? convertFromRestToSearchActionFormat(item) : item;
            var el = $(AJS.renderTemplate("searchResultsGridRow", [
                item.title,
                item.url,
                item.type,
                item.spaceName,
                item.spaceKey,
                item.friendlyDate,
                item.date
            ]));
            if (item.type == 'attachment' && item.id) {
                el.attr('data-attachment-id', item.id);
            }

            // Attach controls for highlighting and selection handling
            el.selectableEffects(resultsContainer, controls.select, results[i]);

            // Finally, add to the table
            resultsContainer.find("table").append(el);
        }

        // Prime the table by selecting the first row.
        $(".search-result:first", resultsContainer).click();
    };
})();
