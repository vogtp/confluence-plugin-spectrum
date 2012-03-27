(function ($){
$(function () {$(".avataror").each(function () {
    var $this = $(this);
    var imgsrc = $("img", this).attr("src");
    $this.css({"-moz-border-radius": "10px", "-webkit-border-radius": "10px", "border-radius": "10px"});
    $this.html("<p>Loading…</p>");
    var avataror = {previewSize: 64};
    avataror.preview = $("<div/>").css({border: "solid 1px #000", "float": "left", height: "64px", overflow: "hidden", width: "64px", position: "relative", top: "-9999em", left: "-9999em"});
    $this.append(avataror.preview);
    avataror.img = $('<img src="' + imgsrc + '" alt="Avatar Source"/>');
    avataror.img.load(function () {
        avataror.image = $("<div/>").css({background: "url('" + imgsrc + "') no-repeat", clear: "left", position: "relative"});
        avataror.marker = $("<div/>").css({cursor: "move", position: "relative"});
        avataror.dash = $("<div/>");
        avataror.shadow = $("<div/>");
        avataror.dash.add(avataror.shadow).css({cursor: "move", opacity: .5, left: 0, top: 0, position: "absolute"});
        avataror.image.append(avataror.shadow).append(avataror.dash).append(avataror.marker);
        $this.append(avataror.image);
        avataror.marker.html('<div></div><div></div><div></div><div></div>');
        $("div", avataror.marker).each(function (i) {
            var $this = $(this);
            $this.css({background: "#000", border: "solid 1px #fff", width: "10px", height: "10px", position: "absolute", "font-size": "1px"});
            $this.css(["left", "right", "right", "left"][i], "-6px");
            $this.css(["top", "top", "bottom", "bottom"][i], "-6px");
            $this.css("cursor", ["nw-resize", "ne-resize", "se-resize", "sw-resize"][i]);
            $this.mousedown(function (e) {
                e.preventDefault();
                e.stopPropagation();
                avataror.dragging = {x: e.pageX, y: e.pageY, ax: avataror.x, ay: avataror.y, w: avataror.width, h: avataror.height, i: i + 1};
                avataror.shadow.hide();
            });
        });
        avataror.marker.add(avataror.image).mousedown(function (e) {
            e.preventDefault();
            avataror.dragging = {x: e.pageX, y: e.pageY, ax: avataror.x, ay: avataror.y, w: avataror.width, h: avataror.height};
            avataror.shadow.hide();
        }).mousemove(function (e) {
            if (avataror.dragging) {
                var dx = e.pageX - avataror.dragging.x;
                var dy = e.pageY - avataror.dragging.y;
                avataror.x = avataror.dragging.ax + dx;
                avataror.y = avataror.dragging.ay + dy;
                console.log([avataror.x, avataror.width, avataror.imgwidth]);
                console.log([avataror.y, avataror.height, avataror.imgheight]);
                if (avataror.x + avataror.width > avataror.imgwidth) {
                    avataror.x = avataror.imgwidth - avataror.width;
                }
                if (avataror.y + avataror.height > avataror.imgheight) {
                    avataror.y = avataror.imgheight - avataror.height;
                }
                if (avataror.x < 0) {
                    avataror.x = 0;
                }
                if (avataror.y < 0) {
                    avataror.y = 0;
                }
                var big;
                var xc = [0, 1, -1, -1, 1];
                var yc = [0, 1, 1, -1, -1];
                if (avataror.dragging.i) {
                    big = (Math.abs(dx) < Math.abs(dy) ? yc[avataror.dragging.i] * dy : xc[avataror.dragging.i] * dx);
                    avataror.width = avataror.height = avataror.dragging.w - big;
                    if (avataror.width < 20) {
                        avataror.width = avataror.height = 20;
                    }
                    avataror.x = avataror.dragging.ax + (avataror.dragging.w - avataror.width) * (1 + xc[avataror.dragging.i]) / 2;
                    avataror.y = avataror.dragging.ay + (avataror.dragging.h - avataror.height) * (1 + yc[avataror.dragging.i]) / 2;
                    if (avataror.x + avataror.width > avataror.imgwidth) {
                        avataror.width = avataror.height = avataror.imgwidth - avataror.x;
                    }
                    if (avataror.y + avataror.height > avataror.imgheight) {
                        avataror.width = avataror.height = avataror.imgheight - avataror.y;
                    }
                }
                avataror.setMarker();
            }
        }).mouseup(function (e) {
            $("#avatar-offsetX").val(avataror.x);
            $("#avatar-offsetY").val(avataror.y);
            $("#avatar-width").val(avataror.width);
            avataror.dragging = null;
            avataror.shadow.show();
        });

        avataror.imgwidth = avataror.img.width();
        avataror.imgheight = avataror.img.height();
        avataror.x = $("#avatar-offsetX").val() * 1;
        avataror.y = $("#avatar-offsetY").val() * 1;
        avataror.width = $("#avatar-width").val() * 1;
        avataror.height = avataror.width;
        avataror.image.css({width: avataror.imgwidth + "px", height: avataror.imgheight + "px"});
        avataror.setMarker();

        $this.css({width: avataror.imgwidth + "px"});
        avataror.preview.css({margin: "0 0 10px " + Math.round(avataror.imgwidth / 2 - avataror.previewSize / 2) + "px", position: "static"});
        $("p", $this).remove();
    });
    avataror.preview.append(avataror.img);

    avataror.setMarker = function () {
        this.marker.css("border", "dashed 1px #fff");
        this.dash.css("border", "solid 1px #000");
        this.shadow.css("border", "solid 1px #000");
        this.marker.add(this.dash).css("left", this.x - 1 + "px");
        this.marker.add(this.dash).css("top", this.y - 1 + "px");
        this.shadow.css("border-left-width", this.x + "px");
        this.shadow.css("border-right-width", this.imgwidth - this.x - this.width + "px");
        this.shadow.css("border-top-width", this.y + "px");
        this.shadow.css("border-bottom-width", this.imgheight - this.y - this.height + "px");
        this.shadow.css("width", this.width + "px");
        this.shadow.css("height", this.height + "px");
        this.marker.add(this.dash).css("width", this.width + "px");
        this.marker.add(this.dash).css("height", this.height + "px");
        this.img.attr("width", this.imgwidth * this.previewSize / this.width);
        this.img.attr("height", this.imgheight * this.previewSize / this.height);
        this.img.css("margin-left", "-" + this.x * this.previewSize / this.width + "px");
        this.img.css("margin-top", "-" + this.y * this.previewSize / this.height + "px");
        this.preview.select();
    };
    // implementation
   });
 });
})(jQuery);