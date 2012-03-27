/**
 * Simple scroll-to jQuery plugin.
 * Written by Atlassian, October 2009.
 *
 * Typical usage: $("#container").simpleScrollTo($("#container > .some-item"))
 *
 * The container must be the nearest ancestor of the item with "position: relative" or "position: absolute".
 * This is the only way that the item's position can be calculated relative to it.
 */
jQuery.fn.simpleScrollTo = function (element) {
    var $ = jQuery;
    var container = $(this[0]);
    var topOffset = $(element).position().top;
    var bottomOffset = topOffset + $(element).outerHeight() - container.outerHeight();
    if (topOffset < 0) { // top of element is above the top of the container
        container.scrollTop(container.scrollTop() + topOffset);
    } else if (bottomOffset > 0) { // bottom of element is below the bottom of the container
        container.scrollTop(container.scrollTop() + bottomOffset);
    }
    return this;
};