/**
 * Provides Confluence-specific overrides of AUI settings (including jQuery settings)
 */

AJS.$.ajaxSetup({
  traditional: true
});

AJS.isIE6 = !window.XMLHttpRequest;

/**
 * Applies an AlphaImageLoader filter, used to fix PNG alpha channel problems in IE6.
 *
 * @param el Element to have the PNG image source
 * @param imageSrc (optional) the image source. If null, the src property of the element is used.
 * @param sizingMethod (optional)the sizing method to use, defaults to "scale"
 * @return true if the filter was applied
 */
AJS.applyPngFilter = function (el, imageSrc, sizingMethod) {
    if (!AJS.isIE6) {
        return false;
    }
    imageSrc = imageSrc || el.src;
    sizingMethod = sizingMethod || "scale";

    el.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imageSrc + "', sizingMethod='" + sizingMethod + "')";
    return true;
};
