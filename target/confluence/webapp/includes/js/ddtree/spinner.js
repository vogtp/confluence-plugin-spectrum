(function ($) {
    $.ui = $.ui || {};
    $.fn.extend({
        spinner: function (options) {
            if (!this.is(".ui-spinner")) {
                return new $.ui.spinner(this, options || {});
            }
        }
    });

    $.ui.spinner = function (anchor, options) {
        this.anchor = anchor;
        var prefix = AJS.params.staticResourceUrlPrefix || contextPath;
        this.images = options.images || 
            [
                prefix + "/images/ddtree/black spinner/1.png",
                prefix + "/images/ddtree/black spinner/2.png",
                prefix + "/images/ddtree/black spinner/3.png",
                prefix + "/images/ddtree/black spinner/4.png",
                prefix + "/images/ddtree/black spinner/5.png",
                prefix + "/images/ddtree/black spinner/6.png",
                prefix + "/images/ddtree/black spinner/7.png",
                prefix + "/images/ddtree/black spinner/8.png",
                prefix + "/images/ddtree/black spinner/9.png",
                prefix + "/images/ddtree/black spinner/10.png",
                prefix + "/images/ddtree/black spinner/11.png",
                prefix + "/images/ddtree/black spinner/12.png"
            ];
        this.width = options.width || "16px";
        this.height = options.height || options.width || "16px";
        this.hide = function () {
            this.anchor.hide();
            this.stop();
        };
        this.show = function () {
            this.start();
            this.anchor.show();
        };
        this.fadeIn = function () {
            this.anchor.fadeIn.apply(this.anchor, arguments);
        };
        this.fadeOut = function () {
            this.anchor.fadeOut.apply(this.anchor, arguments);
        };
        this.moveTo = function (x, y) {
            this.anchor.css("top", y);
            this.anchor.css("left", x);
        };
        this.putInBox = function (box) {
            var x = box.x || box.x1,
                y = box.y || box.y1,
                width = (typeof box.width == "undefined") ? box.x2 - box.x1 : box.width,
                height = (typeof box.height == "undefined") ? box.y2 - box.y1 : box.height;
            this.moveTo(x + Math.round((width - this.offsetWidth) / 2), y + Math.round((height - this.offsetHeight) / 2));
        };
        this.start = function () {
            if (!this.timer) {
                this.timer = setInterval(spin, 100);
            }
            return this.timer;
        };
        this.stop = function () {
            clearInterval(this.timer);
            this.timer = null;
        };
        this.divs = [];
        for (var i = 0, ii = this.images.length; i < ii; i++) {
            var div = document.createElement("div");
            if (!AJS.applyPngFilter(div, this.images[i])) {
                var img = document.createElement("img");
                img.src = this.images[i];
                img.style.width = this.width;
                img.style.height = this.height;
                div.appendChild(img);
            }
            div.style.width = this.width;
            div.style.height = this.height;
            this.anchor.append(div);
            if (!this.offsetWidth) {
                this.offsetWidth = div.offsetWidth;
                this.offsetHeight = div.offsetHeight;
            }
            this.divs.push($(div).hide());
        }
        this.frame = 0;
        this.direction = 1;
        var spinner = this;
        var spin = function () {
            spinner.divs[spinner.frame].hide();
            spinner.frame += spinner.direction;
            if (spinner.frame >= spinner.divs.length) {
                spinner.frame = 0;
            }
            if (spinner.frame < 0) {
                spinner.frame = spinner.divs.length - 1;
            }
            spinner.divs[spinner.frame].show();
        };
        this.anchor.css("position", "absolute");
    };
})(jQuery);