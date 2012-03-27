(function($) {
    var drawTip = function(parent,shouldFlip) {
        var top = -11,
            tipParent = $('<div class="aui-tip-parent"></div>');

        if ($.browser.msie && $.browser.version < 9) { // old versions of IE if off by a few pixels
           top = (parseInt($.browser.version,10) < 8) ? -5 : -13;
        }
        var height = shouldFlip ? 14 : 7;
        parent.prepend(tipParent).css({zIndex: 3001});
        var r = Raphael(tipParent[0], 15, height),
        path = r.path("M0,6.0001l6.00001-6.00001,6.0001,6.0001").attr({
            fill: "#f0f0f0",
            stroke: "#e2e2e2"
        });

        r.canvas.style.zIndex = 3000;
        tip = r;
        if(shouldFlip) {
            path.rotate(180);
            if($.support.opacity) {
                // tip shadows are awful without opacity (i.e. in IE) - worse for the tip which overlays another shadow.
                path.clone().translate(2,3).attr({fill: "#A0A0A0", stroke: "#A0A0A0", opacity:".5", blur:"1"}).toBack();
            }
            top = top + parent.outerHeight() + 10;
        }
        tipParent.css({
           top: top,
           left: 10
        });


        return r;
    },
    /**
     * Draws a shadow relative to parent
     * @param parent the jquery element to draw the panel too
     */
    drawShadow = function(parent,shouldFlip)  {
        return Raphael.shadow(0, 0, parent.outerWidth(true), parent.outerHeight(true), {
            radius: 5,
            target: parent[0],
            offset: 2
        });
    },
    /*
     * figures out if there is room above relative to the container to draw the propery panel
     * @param container - the container element you wish to test against
     * @param anchor - the element the property panel is attached to
     */
    shouldDisplayAbove = function(container, anchor, panel, padding) {
        var panelHeight = panel.outerHeight(),
            heightNeeded = panelHeight + ~~padding,
            spaceAvailable = AJS.Position.spaceAboveBelow(container[0], anchor);

        // Prefer below the anchor if possible.
        if(spaceAvailable.below >= heightNeeded) {
            return false;
        }

        // If space above, flip, otherwise don't (snapToElement will display at bottom of container.)
        return (spaceAvailable.above >= heightNeeded);
    },

    /**
     * Calculates the top and left pixels to locate the property-panel correctly with respect to its anchor element.
     * @param propertyPanel the AJS.Confluence.PropertyPanel to relocate w.r.t. its anchor and panel
     * @param options map of options for the repositioning, including:
     *          - delay : wait {delay} milliseconds before calculating and repositioning
     *          - animate : if true, animate the panel from its current position to the calculated one
     */
    snapToElement = function (propertyPanel, options) {
        options = options || {};
        setTimeout( function() {
            var offset =  AJS.Rte.Content.offset(propertyPanel.anchor),
                overlap = propertyPanel.panel.width() + offset.left - $(window).width() + 10,
                gapForArrowY = 7,
                gapForArrowX = 0,
                elemHeight = $(propertyPanel.anchor).outerHeight(),top,
                left = offset.left - (overlap > 0 ? overlap : 0) - gapForArrowX;

            if(propertyPanel.shouldFlip) {
                top = offset.top - gapForArrowY - propertyPanel.panel.outerHeight() - 4; //acount for shadow
            }
            else {
                top = offset.top + gapForArrowY + elemHeight;
            }

            if (propertyPanel.options.anchorIframe) {
                // The anchor is in an iframe, so the Property Panel should display no lower than the bottom of the iframe.
                var $iframe = $(propertyPanel.options.anchorIframe),
                iframeBottom = $iframe.offset().top + $iframe.height() - propertyPanel.panel.outerHeight() - 10;
                top = Math.min(top, iframeBottom);
            }
            // position the tip 10 pixels from the left of the anchor
            propertyPanel.panel.find(".aui-tip-parent").css({
                left: Math.abs(offset.left - left) + 10
            });

            // CONFDEV-1553. Ensure that the property panel is at always on screen, and not outside the display area
            // due to the positioning of the parent.
            left = Math.max(0, left);

            var css = {
                top: top ,
                left: left
            },
            toAnimate = propertyPanel.panel.add(propertyPanel.shadow),
                reduceWidth = function() {
                    if (propertyPanel.shadow) {
                        propertyPanel.shadow.css("left", propertyPanel.panel.position().left - 1);
                    }
                };
            //might move this out to an if statment if this code sticks around
            options.animate ? toAnimate.animate(css, options.animateDuration, reduceWidth) : (function(){ toAnimate.css(css); reduceWidth(); })();

        }, options.delay || 0);
    };

    /**
     * Displays a property panel.
     *
     * @static
     * @class PropertyPanel
     * @namespace AJS.Confluence
     */
    AJS.Confluence.PropertyPanel = {

       shouldCreate: true,


        /**
         * Will hold a reference to the current displayed PropertyPanel, if any.
         */
        current: null,
        /**
         * Creates a new PropertyPanel instance with the supplied buttons and attaches it to the supplied element.
         *
         * @param el {Element} the element in the RTE to attach the PropertyPanel to
         * @param buttons {Array} array of objects of the form { html: "", click: function(){} }
         * @param options {Object} map of options for the panel, e.g.
         *      anchorIframe - specifies the iframe that the anchor is inside of
         */
        createFromButtonModel: function (type, el, buttons, options) {
            var panel = AJS("div").attr({"class": "panel-buttons"});
            for (var i = 0, ii = buttons.length; i < ii; i++) {
                if (!buttons[i]) continue;

                var button = buttons[i],
                    html = button.html || '<span class="icon"></span><span class="panel-button-text">' + (button.text || "") + '</span>',
                    classes = [];
                    button.className && classes.push(button.className);
                    button.disabled && classes.push("disabled");
                    button.selected && classes.push("selected");

                    !buttons[i + 1] && classes.push("last");
                    !buttons[i - 1] && classes.push("first");

                    var element;
                    if (!button.html) {
                        element = AJS("a").attr({
                            href: buttons[i].href || "#"
                        }).html(html);
                        if (button.disabled) {
                            element.attr("title", button.disabledText);
                            element.disable();
                            element.click(function(e) {
                                return AJS.stopEvent(e);
                            });
                        } else {
                            buttons[i].click && (function(button, element, el) {
                                element.click(function(e) {
                                    button.click(element,el);
                                    return AJS.stopEvent(e);
                                });
                            })(buttons[i], element, el);
                        }
                    } else {
                        // If HTML has been provided use that instead of creating a button.
                        element = $(button.html);
                    }

                    button.tooltip && element.attr("title", button.tooltip);
                    element.addClass(classes.join(" "));
                    panel.append(element);
            }
            return this.create(type, el, panel, options);
        },

        /**
         * Creates a new PropertyPanel instance with the supplied content and attaches it to the supplied element.
         *
         * @param anchor {Element} the element to anchor the PropertyPanel to
         * @param content {Element} the content to display inside the PropertyPanel
         * @param options {Object} map of options for the panel, e.g.
         *                  anchorIframe - specifies the iframe that the anchor is inside of
         */
        create: function (type, anchor, content, options) {
            options = options || {};
            AJS.Rte.BookmarkManager.storeBookmark();
            var parent = $("#property-panel"), panel,
            // this will default the value to true if not presesent, otherwise undefined would be false
            enableFlip = options.enableFlip == undefined || options.enableFlip,
            shouldFlip;
            parent.length && this.destroy();


            parent = AJS("div").addClass("aui-property-panel-parent").addClass(type + "-panel").attr("id", "property-panel").appendTo("body");
            panel = AJS("div").addClass("aui-property-panel").append(content);

            //as the element needs to have a display block, to calculate the height for rapheal
            //position it top of screen and off stage left so it doesnt flicker.
            parent.append(panel).css({
                top: 0,
                left: -10000
            });
            shouldFlip = enableFlip && shouldDisplayAbove($(options.anchorIframe || $(anchor).parent()), $(anchor),parent,10);
            var that = this;
            //remove the margin from the last element, as its applied as padding to the container
            content.find(".last:last").css({margin:0});


            var shadow = drawShadow(parent,shouldFlip),
            tip = drawTip(parent,shouldFlip);

            this.current = {
                anchor: anchor,
                panel: parent,
                hasAnchorChanged: function (el) {
                    return el && that.hasAnchorChanged(el);
                },
                snapToElement : function (options) {
                    snapToElement(this, options);
                },
                shouldFlip : shouldFlip,
                shadow:  shadow,
                tip: tip,
                options: options,
                updating: true,
                type: type
            };

            snapToElement(this.current);
            panel = this.current;
            AJS.$(document).bind("keydown.property-panel.escape", function(e) {
                if (e.keyCode === 27) { // esc key
                    AJS.Confluence.PropertyPanel.destroy();
                }
            });
            AJS.$(document).bind("click.property-panel",function (e) {
            // If click fired inside active property panel - ignore it
                if (!AJS.$(e.target).closest("#property-panel").length) {
                        AJS.Confluence.PropertyPanel.destroy();
                }
            });

            AJS.trigger("created.property-panel", this.current);
            this.current.updating = false;
            return this.current;
        },
        /**
         * Tears down the current PropertyPanel.
         */
        destroy: function () {
            //if current is bound, then shadow and tip is as well
            if (!this.current) {
                AJS.log("PropertyPanel.destroy: called with no current PropertyPanel, returning");
                return;
            }
            if (this.current.updating) {
                AJS.log("PropertyPanel.destroy: called while updating, returning");
                return;
            }
            AJS.trigger("destroyed.property-panel", this.current);
            AJS.$(document).unbind(".property-panel").unbind(".contextToolbar");
            this.current.panel.remove();
            //shadow does not sit inside the panel
            this.current.shadow &&  this.current.shadow.remove();
            this.current = null;
        },
        /**
         * Returns true if the passed element is NOT the RTE anchor element for any current PropertyPanel, or
         * if the current PropertyPanel has changed in size.
         * @param el {Element} element to check against the current PropertyPanel anchor, if any.
         * @return {boolean}
         */
        hasAnchorChanged: function (el) {
            var c = this.current;
            if (c && $(c.anchor)[0] == $(el)[0]) {
                return (c.options.originalHeight && (c.options.originalHeight != $(el).height()));
            }
            return true;
        }
    };
})(AJS.$);
