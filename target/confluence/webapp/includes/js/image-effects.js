AJS.toInit(function($) {
    var fancyProps = {
        padding: 0,
        speedIn: 500,
        speedOut: 500,
        overlayShow: true,
        overlayOpacity: 0.5,
        dataAttr: "image-src"
    };

    $("img.confluence-embedded-image").each(function () {
        var $img = $(this);
        if  (!$img.parent("a").length) {
            // Only bind this image for fancybox if it is not already linked
            $img.fancybox(fancyProps);
        }
    });
});
