AJS.toInit(function ($) {
    // For public signup page
    $("#checkboxUsername").click(function (e) {
        var checkBox = $(this);
        if (checkBox.attr('checked')) {
            $("#username").val($("#email").val());
            $("#username").attr("readOnly", "readOnly");
        } else {
            $("#username").removeAttr("readOnly");
        }
    });
});