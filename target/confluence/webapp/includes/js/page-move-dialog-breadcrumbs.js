
/**
 * Renders a set of breadcrumbs in the specified element. Typical usage:
 *
 *   $("some-element").renderBreadcrumbs([ { title: "Dashboard", url: "/dashboard.action" }, ... ]);
 *
 * @param items an array of objects with 'title' and 'url' properties, representing the breadcrumbs.
 */
jQuery.fn.renderBreadcrumbs = function (items) {
    var $ = jQuery,
        el = this,
        html = [],
        i = 0,
        last = items.length - 1,
        space = items[i],
        spaceClass = space.url.indexOf("~") >= 0 ? "personalspacedesc" : "spacedesc",
        parent,
        breadCrumbContainerWidth = el.closest(".breadcrumbs-container").width(),
        lessThanContainer = function () {
            return el.width() < breadCrumbContainerWidth;
        },
        breadcrumbItems;

    html.push(Confluence.Templates.MovePage.breadcrumbItem({
        text: space.title,
        title: space.title,
        className: (i == last ? "last" : "")}));

    while (i++ < last) {
        parent = items[i];
        html.push(Confluence.Templates.MovePage.breadcrumbItem({
            text: parent.title,
            title: parent.title,
            className: (i == last ? "last" : "")}));
    }

    // shorten the middle items first then the space (first item) and then the last item
    this.html(html.join(""));
    breadcrumbItems = $('li a span', this);
    breadcrumbItems.each(function(index){
    	if (index != 0 && index != last){
    		$(this).shortenUntil(lessThanContainer);
    	}
    });
    $(breadcrumbItems.get(0)).shortenUntil(lessThanContainer);
    $(breadcrumbItems.get(last)).shortenUntil(lessThanContainer);
    return this;
};

AJS.toInit(function ($) {
    var contextPath = $("#confluence-context-path").attr("content");

    // returns false if the breadcrumb contains the current page
    function isValidLocation(breadcrumbs) {
        for (var i=1; i<breadcrumbs.length; i++) { // skip dashboard and space title
            if (breadcrumbs[i].title == AJS.Meta.get('page-title')) {
                return false;
            }
        }
        return true;
    };

    if (!AJS.MoveDialog) AJS.MoveDialog = {};

    var breadcrumbCache = {}; // cached for entire request -- if this isn't okay, move it into Breadcrumbs class below

    /**
     * Handles retrieval of breadcrumbs via AJAX and caching of the responses until the page reloads.
     * 
     * Possible options:
     * 
     * spaceKey - The space key for the space containing the object you want breadcrumbs for. It can be the space by itself or an 
     *            object within the space
     * title - The page title for the page you want breadcrumbs for or a page with an attachment you want breadcrumbs for.
     * fileName - the name of the attachment you want breadcrumbs for. 
     * userName - the name of the User you want breadcrumbs for. If this option is specified, the others are ignored and the user
     *            breadcrumbs are returned. 
     */
    AJS.MoveDialog.getBreadcrumbs = function (options, success, error) {
        var cacheKey = options.userName ? options.userName : 
        	(options.pageId ? (options.pageId + ":" + options.fileName): 
        		(options.spaceKey + ":" + options.title + ":" + options.postingDay + ":" + options.fileName));
        
        if (cacheKey in breadcrumbCache) {
            success(breadcrumbCache[cacheKey], "success");
            return;
        }       
       
        $.ajax({
            type: "GET",
            dataType: "json",
            data: options,
            url: contextPath + "/pages/breadcrumb.action",
            error: error || function () { },
            success:  function (data, textStatus) {
                if (!data || !data.breadcrumbs) {
                    error(data, textStatus);
                    return;
                }
                
                var breadcrumbs = $.makeArray(data.breadcrumbs);
                
                // strip out "Dashboard" and "People"
                while (breadcrumbs[0] && (/dashboard.action$/.test(breadcrumbs[0].url) || 
                	  (data.type != "userinfo" && /peopledirectory.action$/.test(breadcrumbs[0].url)))) {
                    breadcrumbs.shift();
                }
                breadcrumbs.type = data.type;
                
                breadcrumbCache[cacheKey] = breadcrumbs;
                success(breadcrumbs, textStatus);
            }
        });
    };

    /**
     * Returns an object with an 'update' method, which can be called to render a breadcrumb
     * with that location inside the breadcrumbsElement.
     *
     * @param breadcrumbsElement the element (usually a 'ul') where the breadcrumb will be
     * rendered.
     * @param getBreadcrumbs (optional) specify a custom function by which to retrieve breadcrumbs. The function signature should be similar to AJS.MoveDialog.getBreadcrumbs
     */
    AJS.MoveDialog.Breadcrumbs = function (breadcrumbsElement, getBreadcrumbs) {

        var requestCount = 0;

        function displayBreadcrumbs(spaceKey, breadcrumbs, controls) {
            breadcrumbsElement.renderBreadcrumbs(breadcrumbs);
            var validLocation = spaceKey != AJS.Meta.get('space-key') || isValidLocation(breadcrumbs);
            if (validLocation) {
                controls.clearErrors();
                $(controls.moveButton).attr("disabled", "");
            } else {
                controls.error(AJS.I18n.getText("move.page.dialog.invalid.location"));
                $("li:last-child", breadcrumbsElement).addClass("warning");
            }
        }

        return {
            /**
             * Updates the breadcrumb to the specified location. Any errors are handled by
             * calling 'controls.error' with the message.
             *
             * @param options available options
             * 
             * spaceKey - The space key for the space containing the object you want breadcrumbs for. It can be the space by itself or an 
		     *            object within the space
		     * title - The page title for the page you want breadcrumbs for or a page with an attachment you want breadcrumbs for.
		     * fileName - the name of the attachment you want breadcrumbs for. 
		     * userName - the name of the User you want breadcrumbs for. If this option is specified, the others are ignored and the user
		     *            breadcrumbs are returned. 
             * @param controls should contain an 'error' function which is used to pass
             * errors back to the caller, and a 'clearErrors' which indicates no errors
             * occurred
             */
            update: function (options, controls) {
                breadcrumbsElement.html(Confluence.Templates.MovePage.breadcrumbLoading());
                var thisRequest = requestCount += 1;

                // Breadcrumbs and errors should only be displayed for the latest request.
                var isRequestStale = function() {
                    if (thisRequest != requestCount) {
                        AJS.log("Breadcrumb response for ");
                        AJS.log(options);
                        AJS.log(" is stale, ignoring.");
                        return true;
                    }
                    return false;
                };
                
                (getBreadcrumbs || AJS.MoveDialog.getBreadcrumbs)(options,
                    function (breadcrumbs, textStatus) {
                        if (isRequestStale()) return;

                        if (textStatus != "success" || !breadcrumbs) {
                            breadcrumbsElement.html(Confluence.Templates.MovePage.breadcrumbError());
                            return;
                        }
                        displayBreadcrumbs(options.spaceKey, breadcrumbs, controls);
                    },
                    function (xhr) {
                        if (isRequestStale()) return;

                        breadcrumbsElement.html(Confluence.Templates.MovePage.breadcrumbError());
                        if (xhr.status == 404) {
                            controls.error(AJS.I18n.getText("move.page.dialog.location.not.found"));
                        }
                    }
                );
            }
        };
    };

    AJS.Breadcrumbs = {};
    /**
     * Retrieves breadcrumbs for the an entity with the specified id and type (inside options object)
     *
     * @param options (required) options.id and options.type are required.
     * @param success the function to call on successfull retrieval of breadcrumbs
     * @param error the function to call when there is an error retrieving breadcrumbs
     */
    AJS.Breadcrumbs.getBreadcrumbs = function (options, success, error) {
        if (!options.id) {
            throw new Error("id is a required parameter in 'options'");
        }
        if (!options.type) {
            throw new Error("type is a required parameter in 'options'");
        }

        var cacheKey = options.id + ":" + options.type;

        if (cacheKey in breadcrumbCache) {
            success(breadcrumbCache[cacheKey], "success");
            return;
        }

        $.ajax({
            type: "GET",
            dataType: "json",
            data: options,
            url: Confluence.getContextPath() + AJS.REST.getBaseUrl() + "breadcrumb",
            error: error || function () { },
            success:  function (data, textStatus) {
                if (!data || !data.breadcrumbs) {
                    error(data, textStatus);
                    return;
                }

                var breadcrumbs = $.makeArray(data.breadcrumbs);

                // strip out "Dashboard" and "People"
                while (breadcrumbs[0] && (/dashboard.action$/.test(breadcrumbs[0].url) ||
                	  (data.type != "userinfo" && /peopledirectory.action$/.test(breadcrumbs[0].url)))) {
                    breadcrumbs.shift();
                }
                breadcrumbs.type = data.type;

                breadcrumbCache[cacheKey] = breadcrumbs;
                success(breadcrumbs, textStatus);
            }
        });
    };
});
