(function($) {
    /**
     * Creates a new hover popup
     *
     * @param items jQuery object - the items that trigger the display of this popup when the user mouses over.
     * @param identifier A unique identifier for this popup. This should be unique across all popups on the page and a valid CSS class.
     * @param url The URL to retrieve popup contents.
     * @param postProcess A function called after the popup contents are loaded.
     *                    `this` will be the popup jQuery object, and the first argument is the popup identifier.
     * @param options Custom options to change default behaviour. See AJS.contentHover.opts for default values and valid options.
     *
     * @return jQuery object - the popup that was created
     */
    AJS.contentHover = function(items, identifier, url, postProcess, options) {
        var opts = $.extend(false, AJS.contentHover.opts, options);
        var contents,
            mousePosition,
            popup = $("#content-hover-" + identifier);
        if (!popup.length) {
            // This is the first contentHover call for this identifier - create and set up the content container div.
            $(opts.container).append($('<div id="content-hover-' + identifier + '" class="ajs-content-hover"><div class="contents"></div></div>'));
            popup = $("#content-hover-" + identifier);
            contents = popup.find(".contents");
            contents.css("width", opts.width + "px")
            .mouseover(function() {
                clearTimeout(p.hideDelayTimer);
                popup.unbind("mouseover");
            }).mouseout(function() {
                hidePopup();
            });
        } else {
            // A popup has already been created for this identifier (ie. this contentHover call is from a newly-created
            // element with an existing identifier).
            contents = popup.find(".contents");
        }

        // The popup HTML element is persisted across contentHover calls so it can hold data.
        var p = popup[0];

        var showPopup = function() {
            if (popup.is(":visible")) {
                return;
            }

            p.showTimer = setTimeout(function() {
                if (!p.contentLoaded || !p.shouldShow) {
                    return;
                }
                p.beingShown = true;
                var $window = $(window),
                    posx = mousePosition.x - 3,
                    posy = mousePosition.y + 15;

                if (posx + opts.width + 30 > $window.width()) {
                    popup.css({
                        right: "20px",
                        left: "auto"
                    });
                }
                else {
                    popup.css({
                        left: posx + "px",
                        right: "auto"
                    });
                }

                var bottomOfViewablePage = (window.pageYOffset || document.documentElement.scrollTop) + $window.height();
                if ((posy + popup.height()) > bottomOfViewablePage) {
                    posy = bottomOfViewablePage - popup.height() - 5;
                    popup.mouseover(function() {
                        clearTimeout(p.hideDelayTimer);
                    }).mouseout(function() {
                        hidePopup();
                    });
                }
                popup.css({
                    top: posy + "px"
                });

                var shadow = $("#content-hover-shadow").appendTo(popup).show();
                // reset position of popup box
                popup.fadeIn(opts.fadeTime, function() {
                    // once the animation is complete, set the tracker variables
                    p.beingShown = false;
                });

                shadow.css({
                    width: contents.outerWidth() + 32 + "px",
                    height: contents.outerHeight() + 25 + "px"
                });
                $(".b", shadow).css("width", contents.outerWidth() - 26 + "px");
                $(".l, .r", shadow).css("height", contents.outerHeight() - 21 + "px");
            }, opts.showDelay);
        };

        var hidePopup = function() {
            p.beingShown = false;
            p.shouldShow = false;
            clearTimeout(p.hideDelayTimer);
            clearTimeout(p.showTimer);
            clearTimeout(p.loadTimer);
            p.contentLoading = false;
            p.shouldLoadContent = false;
            // store the timer so that it can be cleared in the mouseover if required
            p.hideDelayTimer = setTimeout(function() {
                popup.fadeOut(opts.fadeTime);
            }, opts.hideDelay);
        };

        $(items).mousemove(function(e) {
            mousePosition = { x: e.pageX, y: e.pageY };
            
            if (!p.beingShown) {
                clearTimeout(p.showTimer);
            }
            p.shouldShow = true;
            // lazy load popup contents
            if (!p.contentLoaded) {
                if (p.contentLoading) {
                    // If the mouse has moved more than the threshold don't load the contents
                    if (p.shouldLoadContent) {
                        var distance = (mousePosition.x - p.initialMousePosition.x)*(mousePosition.x - p.initialMousePosition.x)
                                + (mousePosition.y - p.initialMousePosition.y) * (mousePosition.y - p.initialMousePosition.y);
                        if (distance > (opts.mouseMoveThreshold * opts.mouseMoveThreshold)) {
                            p.contentLoading = false;
                            p.shouldLoadContent = false;
                            clearTimeout(p.loadTimer);
                            return;
                        }
                    }
                } else {
                    // Save the position the mouse started from
                    p.initialMousePosition = mousePosition;
                    p.shouldLoadContent = true;
                    p.contentLoading = true;
                    p.loadTimer = setTimeout(function () {
                        if (!p.shouldLoadContent)
                            return;

                        contents.load(url, function() {
                            p.contentLoaded = true;
                            p.contentLoading = false;
                            postProcess.call(popup, identifier);
                            showPopup();
                        });
                    }, opts.loadDelay);
                }
            }
            // stops the hide event if we move from the trigger to the popup element
            clearTimeout(p.hideDelayTimer);
            // don't trigger the animation again if we're being shown
            if (!p.beingShown) {
                showPopup();
            }
        }).mouseout(function() {
            hidePopup();
        });

        contents.click(function(e) {
            e.stopPropagation();
        });

        $("body").click(function() {
            p.beingShown = false;
            clearTimeout(p.hideDelayTimer);
            clearTimeout(p.showTimer);
            popup.hide();
        });

        return popup;
    };

    AJS.contentHover.opts = {
        fadeTime: 100,
        hideDelay: 500,
        showDelay: 700,
        loadDelay: 50,
        width: 300,
        mouseMoveThreshold: 10,
        container: "body"
    };

    AJS.toInit(function(){
        $("body").append($('<div id="content-hover-shadow"><div class="tl"></div><div class="tr"></div><div class="l"></div><div class="r"></div><div class="bl"></div><div class="br"></div><div class="b"></div></div>'));
        $("#content-hover-shadow").hide();
    });
})(jQuery);

if (typeof AJS.followCallbacks == "undefined") AJS.followCallbacks = [];
if (typeof AJS.favouriteCallbacks == "undefined") AJS.favouriteCallbacks = [];

// if you want to customize the behaviour of the follow button you can add callbacks to the above array
// by adding this code to your javascript page:
//
// if (typeof AJS.followCallbacks == "undefined") AJS.followCallbacks = [];
// AJS.followCallbacks.push(function(user) {
//    alert('favourite added'+user');
// });
//
// these callbacks are called after the post to the server has completed.
//
// You can add to the followCallbacks or the favouriteCallbacks if you want callbacks on the follow functions
// or the favourite functions respectively.

AJS.toInit(function($) {
    $(self).bind("hover-user.follow", function(e, data) {
        for (var i=0, ii=AJS.followCallbacks.length; i<ii; i++) {
            AJS.followCallbacks[i](data.username);
        }
    });
});