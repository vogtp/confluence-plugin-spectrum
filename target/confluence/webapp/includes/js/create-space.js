AJS.toInit(function ($) {

    var spaceKeyInput = $("#key");

    spaceKeyInput.change(function() {
        var errorObj = spaceKeyInput.siblings(".error");
        $.getJSON(AJS.Confluence.getContextPath() + "/ajax/spaceavailable.action", {key: spaceKeyInput.val()},
            function(data) {
                errorObj.remove();
                if (!data.available && data.message) {
                    spaceKeyInput.before("<div id='" + spaceKeyInput.attr("id") + "-error' class='error'><span class='errorMessage'>" + data.message + "</span></div>");
                }
            });
    });
});