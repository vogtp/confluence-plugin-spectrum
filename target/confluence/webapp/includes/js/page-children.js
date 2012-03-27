/**
 * Load the child pages.
 */
AJS.toInit(function($) {

    var throbber, spinner;

    /**
     * Render a link to a child page. This will render the link using three different icons: 'icon-home-page' for the
     * link to the home page, 'icon-recently-updated-page' for a page that as been recently updated or
     * 'icon-page' for the default page icon.
     *
     * This is based on the 'contentLink2' macro defined in macros.vm
     *
     * @param page object
     */
    var renderLink = function(page) {
        if(page.homePage) {
            var title = AJS.I18n.getText("home.page");
            return '<span class="child-display"><span class="icon icon-home-page" title="'+title+'">'+title+':</span> <a href="' + AJS.params.contextPath + page.href + '">' + page.text + '</a></span>';
        } else {
            var cssClass = page.recentlyUpdated ? "icon icon-recently-updated-page" : "icon icon-page"
            return '<span class="child-display"><span class="'+cssClass+'" title="Page">Page:</span> <a href="' + AJS.params.contextPath + page.href + '">' + AJS.escapeHtml(page.text) + '</a></span>';
        }
    };

    /**
     * Callback handler for the Ajax call.
     *
     * @param data - list of page objects
     */
    var onPageChildrenLoadSuccess = function(data) {
        var container = $("#page-children:not(.children-loaded)");
        hideThrobber();
        if (data && container.length) {
            if(data.errorMessage) {
                container.html("<span class='error'>"+data.errorMessage+"</span>");
                return;
            }
            var html = [];
            $.each(data, function(index, page) {
                html.push(renderLink(page));
            });
            container.html(html.join(""));
            container.addClass("children-loaded");
        }
    };

    /**
     * Hide the loading indicator.
     */
    var hideThrobber = function() {
        if (spinner) {
            spinner();
            spinner = null;
        }
        throbber.addClass("hidden");
    };

    /**
     * Update the UserInterfaceState -> setChildrenShowing.
     *
     * @param showChildren (boolean)
     */
    var updateUserSetting = function(showChildren) {
        AJS.safe.ajax({
            url: AJS.params.contextPath + '/json/pagechildrenstoresettings.action',
            type: "POST",
            data: { 'pageId': AJS.params.pageId, 'showChildren': showChildren },
            success: function(){},
            error: function(xhr, text) {
                AJS.log("Failed to store the user 'showChildren' user setting: " + text);
            }
        });
    };

    /**
     * Attempt to load he child pages. This will load the child pages only once per page.
     */
    var loadChildren = function() {
        var container = $("#page-children:not(.children-loaded)");
        // Don't load the children list twice...
        if (container.length) {
            throbber = $("<div class='throbber'></div>");
            container.append(throbber);
            spinner = Raphael.spinner(throbber[0], 10, "#666");

            // Retrieve the list of children objects AND store the user setting
            AJS.safe.ajax({
                url: AJS.params.contextPath + '/json/pagechildren.action',
                type: "POST",
                data: { pageId: AJS.params.pageId, showChildren: true },
                success: onPageChildrenLoadSuccess,
                error: function(xhr, text, error) {
                    var errorText = AJS.I18n.getText("page.children.error.load");
                    hideThrobber();
                    container.html("<span class='error'>"+errorText+"</span>");
                    AJS.log("Error retrieving child pages: " + text);
                }
            });
        } else {
            // If we don't load the children we still have to update the user interface state.
            updateUserSetting(true);
        }
    };

    /**
     * Hide the list of page children and update the 'showChildren' settings in the background.
     */
    var hideChildren = function() {
        $("#page-children").hide();
        // Store setting
        updateUserSetting(false);
    };

    /**
     * Show the children. Load the child data if necessary.
     */
    var showChildren = function() {
        $("#page-children").show();
        // Attempt to load the children only if they are not visible already
        if($("#children-section:not(.children-showing)").length) {
            loadChildren();
        } else {
            updateUserSetting(true);
        }
    };

    $("#children-section a.children-show-hide").each(function() {
        $(this).click(function(e) {
            var container = $("#children-section");
            if (container.hasClass("children-showing")) {
                hideChildren();
                container.removeClass("children-showing").addClass("children-hidden");
            } else {
                showChildren();
                container.removeClass("children-hidden").addClass("children-showing");
            }
            return AJS.stopEvent(e);
        })
    });
});
