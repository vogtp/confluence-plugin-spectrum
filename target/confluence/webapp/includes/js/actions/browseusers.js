AJS.toInit(function ($) {
    $("#create-user-form").hide(); // Initial state

    var switchButton = $("#switch-button");

    var searchAddUserToggle = function() {
        $("#user-search").toggle();
        $("#create-user-form").toggle();
    };

    switchButton.toggle(function() {
        searchAddUserToggle();
        switchButton.text($("#i18n-cancel-create").val());
        return false;

    }, function() {
        searchAddUserToggle();
        switchButton.text($("#i18n-create-user").val());
        $("#create-user-form :text").val("");
        $("#create-user-form :password").val("");
        $(".error").remove();
        return false;
    });

    $("#cancel-button").click(function() {
        switchButton.click();
    });

    if ($("#fielderrors-empty").val() === "false") {
        switchButton.click();
    }

    var simpleAdvancedToggle = function() {
        $("#search-simple").toggle();
        $("#search-advanced").toggle();
        return false;
    };

    $("#switch-simple").click(simpleAdvancedToggle);
    $("#switch-advanced").click(simpleAdvancedToggle);

    if ($("#simple-mode-available").val() === "false") {
        $("#switch-simple").hide();
        simpleAdvancedToggle();
    }
});
