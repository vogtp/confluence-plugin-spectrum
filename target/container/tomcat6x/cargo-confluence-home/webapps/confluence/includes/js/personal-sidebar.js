AJS.toInit(function($) {
    var sidebarPrefs = Confluence.storageManager("personal-sidebar"),
        sidebar = $("#personal-info-sidebar"),
        height = sidebar.height(),
        content = $("#content");

    function toggleSidebar() {
        sidebar.toggleClass("collapsed");
        content.toggleClass("sidebar-collapsed");
        sidebar.trigger("toggled");
    }

    if (sidebarPrefs.getItemAsBoolean("show")) {
        toggleSidebar();
    }

    $(".sidebar-collapse").click(function(e) {
        toggleSidebar();
        sidebarPrefs.setItem("show", sidebar.hasClass("collapsed"));
        return AJS.stopEvent(e);
    }).height(height); // fixes half-px rounding bug in FF but causes overflow bug
});