AJS.toInit(function($) {
    $("a#websudo-drop.drop-non-websudo").click(function()
    {
        $.getJSON($(this).attr("href"), function() {
            $("li#confluence-message-websudo-message").slideUp();
        });
        return false;
    });
});