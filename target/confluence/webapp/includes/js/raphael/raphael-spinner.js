// An extension to Raphael to draw a spinner (useful to show user when waiting for something to load).
// It returns a function that you can execute later to remove the spinner.
Raphael.spinner = function (holderId, radius, colour) {
    var color = colour || "#fff",
        width = radius * 13 / 60,
        r1 = radius * 35 / 60,
        r2 = radius,
        cx = r2 + width,
        cy = r2 + width,
        r = Raphael(holderId, r2 * 2 + width * 2, r2 * 2 + width * 2),

        sectors = [],
        opacity = [],
        beta = 2 * Math.PI / 12,

        pathParams = {stroke: color, "stroke-width": width, "stroke-linecap": "round"};
    for (var i = 0; i < 12; i++) {
        var alpha = beta * i - Math.PI / 2,
            cos = Math.cos(alpha),
            sin = Math.sin(alpha);
        opacity[i] = i / 12;
        sectors[i] = r.path([["M", cx + r1 * cos, cy + r1 * sin], ["L", cx + r2 * cos, cy + r2 * sin]]).attr(pathParams);
    }
    var tick;
    (function ticker() {
        opacity.unshift(opacity.pop());
        for (var i = 0; i < 12; i++) {
            sectors[i].attr("opacity", opacity[i]);
        }
        r.safari();
        tick = setTimeout(ticker, 80);
    })();
    return function () {
        clearTimeout(tick);
        r.remove();
    };
};