AJS.$(function ($) {
    $(document).bind("long-running-task-complete", function () {
        $("#wait-spinner").hide();
    });
    $(document).bind("long-running-task-failed", function () {
        $("#wait-spinner").hide();
        $("#task-elapsed-time-label").hide();
        $("#taskElapsedTime").hide();
    });
});