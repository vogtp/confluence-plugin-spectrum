/**
 * Position help to position elements relative to other elements within a container.
 */
AJS.Position = (function ($) {

    return {
        /**
         * Visible space above an element within a viewport.
         *
         * @param containerElement element, such as an iframe, or div (not-jquery'd).
         * @param the element to determine space above and below (jquery'd).
         *
         * @return object with <strong>above</strong> space between top of visible area and the bottom of the element
         *         (may be negative is element is above the top of the screen); and
         *         <strong>below</strong> space between bottom of visible area and the bottom of the element (may be
         *         negative if is element is below the bottom of the screen.
         */
        spaceAboveBelow: function(containerElement, element) {
            var elementPos = element.position().top,
                iframe,
                body,
                bodyPos,
                anchorHeight = element.outerHeight(true),
                viewPortHeight,
                above,
                below;

            if(containerElement.nodeName == "IFRAME") {
                iframe = containerElement.contentWindow || containerElement.contentDocument;
                viewPortHeight = $(containerElement).height();
                body = $(iframe.document || iframe);
                above = elementPos - body.scrollTop();
                if(!($.browser.msie && $.browser.version <= 8)) {
                    // All browsers but IE return the elementPos relative to the document.
                    above = above - $(window).scrollTop();
                }
            } else {
                body = $(containerElement);
                viewPortHeight = body.height();
                above = elementPos - body.position().top;
            }

            below = viewPortHeight - above - anchorHeight;

            return {
                above: above,
                below: below
            };
        }
    };

})(AJS.$);