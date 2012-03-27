AJS.toInit(function ($) {
    $("#ellipsis").click(function () {
        try {
            $("#breadcrumbs .hidden-crumb").removeClass("hidden-crumb");
            $(this).addClass("hidden-crumb");
        } catch(e) {
            AJS.log(e);
        }
    });
});
