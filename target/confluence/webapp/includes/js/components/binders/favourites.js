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
    var entityIsFavourited = function(button) {
        return button.hasClass("icon-remove-fav"); // Anchor version
    };

    /**
     * Add/Remove a entity from the user's favourites.
     * @param entityId - The identifier for the entity to add as favourite (i.e. space key or page id)
     * @param type - the type of entity (i.e. page or space)
     * @param button - The button that was clicked (anchor element jQuery object)
     */
    var toggleFavourite = function(entityId, type, button) {
        var wasFavourited = entityIsFavourited(button),
            waitIndicator = button.parent().find(".icon-wait"),
            url,
            params;


        if (type == "page") {
            url = Confluence.getContextPath() + "/json/" +
                  (wasFavourited ? "removefavourite.action" : "addfavourite.action");
            params = { entityId : entityId };
        }

        if (type == "space") {
            url = Confluence.getContextPath() + "/json/" +
                  (wasFavourited ? "removespacefromfavourites.action" : "addspacetofavourites.action");
            params = { "key" : entityId };
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
                button.parent().find(wasFavourited ? ".icon-add-fav" : ".icon-remove-fav").removeClass("hidden");
                delete waiting[entityId];
            },
            error: function(xhr, text, error) {
                // TODO CONF-20780 Notify the user of the problem (will need to be internationalised)
                waitIndicator.addClass("hidden");
                button.parent().find(wasFavourited ? ".icon-remove-fav" : ".icon-add-fav").removeClass("hidden");
                AJS.log("Error Toggling Favourite: " + text);
                delete waiting[entityId];
            }
        });
    };

    var bindFavourites = function(buttons, options) {
        if (buttons.attr("data-favourites-bound")) {
            return;
        }

        buttons.delegate(".icon-add-fav, .icon-remove-fav", "click", function(e) {
            var button = $(e.target);
            var entityId,
                type = buttons.attr("data-entity-type");
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
        buttons.attr("data-favourites-bound", true);
    };

    /**
     * The favourite entities binder looks for the following markup:
     * <div class="entity-favourites" data-entityId="{entityId}" data-entityType="{type}">
     *     <a class="icon-remove-fav">Remove Favourite</a>
     *     <a class="icon-add-fav">Add Favourite</a>
     *     <span class="icon icon-wait hidden">$i18NBean.getText('loading.name')</span>
     * </div>
     */
    AJS.Confluence.Binder.favourites = function () {
        $(".entity-favourites").each(function () {
            if (!$(this).attr("data-favourites-bound")) {
                bindFavourites($(this), {});
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
    $.fn.favourites = function (options) {
        $(this).each(function () {
            var buttons = $(this);
            bindFavourites(buttons, options);
        });
    };
})(AJS.$);
