AJS.toInit(function ($) {
   $("#advanced_opt_link").click(function (e) {
        if ($("#advanced_opt").is(':visible')) {
            $("#advanced_opt").fadeOut();
            $("#advanced_opt_link").show();
        } else {
            $("#advanced_opt").fadeIn();
            $("#advanced_opt_link").hide();
        }
        return false;
    });
});