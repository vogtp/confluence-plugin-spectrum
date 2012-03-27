AJS.toInit(function ($)
{
    $(".navmenu.collapsible-menu li div.menuheading").click(function () {
        $(this).toggleClass("closed");
        var parent = $(this).parent();
        $("ul.menu-section-list", parent).toggleClass("hidden");
    });
});