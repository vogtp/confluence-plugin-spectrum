/*
 * This js file allows to mark a entity (space or page) as a favourite (global or personal) by clicking the star icon.
 * This can be achieved by using a binder.
*/
(function ($) {
    var waiting = []; // used to prevent the user from triggering off another labelling operation when one is in progress

    /**
     * Check whether a entity is favourited given the favourite icon for that space/page
     * @param button the entity's favourite icon (jQuery object)
     */
    var entityIsWatched = function(button) {
        return button.hasClass("icon-stop-watching"); // Anchor version
    };

    /**
     * Add/Remove a entity from the user's favourites.
     * @param entityId - The identifier for the entity to add as favourite (i.e. space key or page id)
     * @param type - the type of entity (i.e. page or space)
     * @param button - The button that was clicked (anchor element jQuery object)
     */
    var toggleFavourite = function(entityId, type, button) {
        var wasWatched = entityIsWatched(button),
            waitIndicator = button.parent().find(".icon-wait"),
            url,
            params;


        if (type == "page") {
            url = Confluence.getContextPath() + "/users/" +
                  (wasWatched ? "removepagenotificationajax.action" : "addpagenotificationajax.action");
            params = { pageId : entityId };
        }

        if (type == "space") {
            url = Confluence.getContextPath() + "/users/" +
                  (wasWatched ? "removespacenotificationajax.action" : "addspacenotificationajax.action");
            params = { "spaceKey" : entityId };
        }

        button.addClass("hidden");
        waitIndicator.removeClass("hidden");

        AJS.safe.ajax({
            url: url,
            type: "POST",
            data: params,
            success: function(labelsArr) {
                AJS.log(labelsArr);
                waitIndicator.addClass("hidden");
                button.parent().find(wasWatched ? ".icon-start-watching" : ".icon-stop-watching").removeClass("hidden");
                delete waiting[entityId];
            },
            error: function(xhr, text, error) {
                // TODO CONF-20780 Notify the user of the problem (will need to be internationalised)
                waitIndicator.addClass("hidden");
                button.parent().find(wasWatched ? ".icon-stop-watching" : ".icon-start-watching").removeClass("hidden");
                AJS.log("Error Toggling Watching: " + text);
                delete waiting[entityId];
            }
        });
    };

    var bindWatching = function(buttons, options) {
        if (buttons.attr("data-watching-bound")) {
            return;
        }

        buttons.delegate(".icon-start-watching, .icon-stop-watching", "click", function(e) {
            var button = $(e.target);
            var entityId,
                type = buttons.attr("data-entity-type");
            //debugger
            if (options && options.getEntityId && typeof options.getEntityId == "function") {
                entityId = options.getEntityId(button);

            } else {
                entityId = buttons.attr("data-entity-id");
            }
            if (waiting[entityId]) {
                AJS.log("Already busy toggling favourite for " + type  + " '" + entityId + "'. Ignoring request.");
                return;
            }
            waiting[entityId] = true;
            toggleFavourite(entityId, type, button);
            return false;
        });
        buttons.attr("data-watching-bound", true);
    };

    /**
     * The favourite entities binder looks for the following markup:
     * <div class="entity-watching" data-entity-id="{entityId}" data-entity-type="{type}">
     *     <a class="icon-stop-watching">Stop Watching</a>
     *     <a class="icon-start-watching">Start Watching</a>
     *     <span class="icon icon-wait hidden">$i18NBean.getText('loading.name')</span>
     * </div>
     */
    AJS.Confluence.Binder.watching = function () {
        $(".entity-watching").each(function () {
            if (!$(this).attr("data-watching-bound")) {
                bindWatching($(this), {});
            }
        });
    };

    /**
     * Allows the user to toggle favourites. This plugin is made available for dynamic content.
     * If you have static content, then use the binder.
     * Options are:
     * <li> getEntityId - a function that retrieves the relevant entity identifier from the button pressed.
     * @param options {Object}
     */
    $.fn.watching = function (options) {
        $(this).each(function () {
            var buttons = $(this);
            bindWatching(buttons, options);
        });
    };
})(AJS.$);
