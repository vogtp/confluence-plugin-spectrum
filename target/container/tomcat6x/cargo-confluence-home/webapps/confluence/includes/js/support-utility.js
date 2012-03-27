AJS.toInit(function ($) {
   $("#includeServerLogs").click(function (e) {
        var serverIncludeBox = $(this);
        if (serverIncludeBox.attr('checked')) {
            $("#serverLogsDirectory").parent().fadeIn();
        } else {
            $("#serverLogsDirectory").parent().fadeOut();
        }
    });
});