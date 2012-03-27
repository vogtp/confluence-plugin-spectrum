AJS.toInit(function ($) {
    $("#editusergroups-selectall").click(function(e) {
        $(".checkbox input:checkbox").each(function(e) {
            this.checked = true;
        });
        return false;
    });

    $("#editusergroups-selectnone").click(function(e) {
        $(".checkbox input:checkbox").each(function(e) {
            this.checked = false;
        });
        return false;
    });
});