Confluence.QuickNav = (function($) {
    var dropDownPostProcess, makeParams;

    var addSpaceName = function(dd) {
        $("a", dd).each(function () {
            var $a = $(this);
            var $span = $a.find("span");
            // get the hidden space name property from the span
            var spaceName = AJS.dropDown.getAdditionalPropertyValue($span, "spaceName");
            if (spaceName && !$a.is(".content-type-spacedesc")) {
                // clone the original link for now. This could potentially link to the space?
                $a.after($a.clone().attr("class", "space-name").html(spaceName));
                // add another class so we can restyle to make room for the space name
                $a.parent().addClass("with-space-name");
            }
        });
    }

    return {
        setDropDownPostProcess: function(dp) {
            dropDownPostProcess = dp;
        },
        setMakeParams: function(mp) {
            makeParams = mp;
        },
        init : function(quickSearchInputField, dropDownPlacement) {
            quickSearchInputField.quicksearch("/json/contentnamesearch.action", null, {
                dropdownPlacement : dropDownPlacement,
                dropdownPostprocess : function(dd) {
                    dropDownPostProcess && dropDownPostProcess(dd);
                    addSpaceName(dd);
                },
                makeParams: function(value) {
                    // if the makeParams function was set use that one instead of the default
                    if (makeParams)
                        return makeParams(value);
                    else
                        return { query : value };
                }
            });
        }
    }
})(AJS.$);

AJS.toInit(function ($) {

    /**
     * Append the drop down to the form element with the class quick-nav-drop-down
     */
    var quickNavPlacement = function (input) {
        return function (dropDown) {
            input.closest("form").find(".quick-nav-drop-down").append(dropDown);
        };
    };

    var quickSearchQuery = $("#quick-search-query");
        spaceBlogSearchQuery = $("#space-blog-quick-search-query"),
        confluenceSpaceKey = $("#confluence-space-key");

    Confluence.QuickNav.init(quickSearchQuery, quickNavPlacement(quickSearchQuery));

    if (spaceBlogSearchQuery.length && confluenceSpaceKey.length) {
        spaceBlogSearchQuery.quicksearch("/json/contentnamesearch.action?type=blogpost&spaceKey=" + 
                AJS("i").html(confluenceSpaceKey.attr("content")).text(), null, {
            dropdownPlacement : quickNavPlacement(spaceBlogSearchQuery)
        });
    }
});
