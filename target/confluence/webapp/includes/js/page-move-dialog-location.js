jQuery.fn.movePageAutocomplete = function (url, appendTo, notFoundTemplate, selectionHandler) {
    var $ = jQuery;
    var handler = selectionHandler;
    AJS.log(url);
    return $(this).quicksearch(url, null, {
        dropdownPostprocess: function (list) {
            $("> ol.last", list).remove();
            if (!$("> ol", list).length) { // empty list
                $(list).append(notFoundTemplate);
            }
            $("> ol:last-child", list).addClass("last");
            $("a", list).attr("tabindex", "-1"); // prevent tabbing to links
        },
        dropdownPlacement: function (dropDown) {
            $(appendTo).append(dropDown);
        },
        ajsDropDownOptions: {
            selectionHandler: function (e, selected) {
                if (selected) {
                    this.hide("selected");
                    handler(e, selected);
                    e.preventDefault();
                }
            }
        }
    });
};

/**
 * Renders the 'Known Location' tab with autocomplete in the move page dialog.
 *
 * @param controls should contain:
 * - an 'error' function for passing errors back to the caller
 * - a 'clearErrors' function to indicate no problems occurred
 * - a 'select' function to handle selection of a new parent page
 * - a 'moveButton' jQuery-wrapped element, which is the default button in the dialog
 */
jQuery.fn.movePageLocation = function (controls) {
    var $ = jQuery;
    var container = $(this);
    var space = $("#new-space", container);
    var spaceKey = $("#new-space-key", container);
    var parentPage = $("#new-parent-page", container);

    var fieldChanged = function () {
        if(space.is(":visible")) {
            if (space.val() == "") {
                space.val(AJS.Meta.get('space-name'));
                spaceKey.val(AJS.Meta.get('space-key'));
            }

            controls.clearErrors();
            controls.select(spaceKey.val(), space.val(), parentPage.val());
        }
    };

    parentPage.blur(fieldChanged).focus(function () {
        controls.clearErrors();
        AJS.dropDown.current && AJS.dropDown.current.hide();
    });
    space.blur(fieldChanged).focus(function () {
        AJS.dropDown.current && AJS.dropDown.current.hide();
    });

    space.movePageAutocomplete(
        "/json/contentnamesearch.action?type=spacedesc&type=personalspacedesc",
        $(".new-space-dropdown", container),
        Confluence.Templates.MovePage.noMatchingSpaces(),
        function (e, selected) {
            var props = selected.find("span").data("properties");
            spaceKey.val(props.spaceKey);
            space.val(AJS("span").html(props.name).text());
            parentPage.val("");
            fieldChanged();
            parentPage.focus();
        }
    );
    parentPage.movePageAutocomplete(
        function () { return "/json/contentnamesearch.action?type=page&spaceKey=" + spaceKey.val(); },
        $(".new-parent-page-dropdown", container),
        Confluence.Templates.MovePage.noMatchingPages(),
        function (e, selected) {
            var title = AJS("span").html(selected.find("span").data("properties").name).text();
            parentPage.val(title);
            fieldChanged();
            window.setTimeout(function () {
                controls.moveButton.focus(); // focus slightly afterwards, so Firefox 2 doesn't submit the form
            }, 50);
        }
    );
};
