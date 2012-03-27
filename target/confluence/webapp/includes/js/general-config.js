AJS.toInit(function ($) {

    if (!AJS.params.editMode) {
        return;
    }

    var oldColor,
        quickNavInput = $("#enableQuickNav"),
        maxRequests = $("#maxSimultaneousQuickNavRequests"),
        maxRequestsLabel = maxRequests.siblings("span.inline-text"),
        baseURL = $("#editbaseurl"),
        currentURL = window.location.href;
    var showBaseURLWarning = function() {
        var warningRow = $("#urlWarning");
        var newBaseURL = $("#editbaseurl").val();
        //CONF-18134
        //Context path of the current URL will be everything up to /admin so need to check
        //that the new baseURL + /admin matches the start of the current URL
        if( newBaseURL[newBaseURL.length-1] == '/') {
            newBaseURL += 'admin';
        }
        else {
            newBaseURL += '/admin';
        }
        var currentURLStart = currentURL.substring(0, newBaseURL.length);
        if(currentURLStart != newBaseURL) {
            warningRow.removeClass("hidden");
        }
        else {
            warningRow.addClass("hidden");
        }
    };

    var toggleQuickNav = function() {
        if (quickNavInput.attr("checked")) {
            maxRequests.removeAttr("disabled").css("color", "#000");
            maxRequestsLabel.css("color", oldColor);
            if (maxRequests.val() == 0) {
                maxRequests.val(40);
            }
        }
        else {
            maxRequests.attr("disabled", "disabled").css("color", "#ccc");
            oldColor = maxRequestsLabel.css("color");
            maxRequestsLabel.css("color", "#ccc");
        }
    };

    showBaseURLWarning();
    baseURL.change(showBaseURLWarning);

    quickNavInput.click(toggleQuickNav);
    toggleQuickNav();

    // did you mean settings
    var didYouMeanInput = $("#enableDidYouMean"),
        didYouMeanWarning = didYouMeanInput.siblings("div.description"); 

    didYouMeanWarning.hide();
    if ($("#dymIndexExists").length == 0) {
        didYouMeanInput.attr("disabled", "disabled");
        didYouMeanWarning.show();
    }
});
