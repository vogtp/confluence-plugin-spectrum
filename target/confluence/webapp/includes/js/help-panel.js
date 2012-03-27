AJS.toInit(function ($)
{
   $("#helpcontent a").click(function () {
       var linkUrl = $(this).attr("href");
       var onClickEvent = $(this).attr("onClick");
       if (!onClickEvent && linkUrl && linkUrl.indexOf("#") != 0 && linkUrl.indexOf(window.location) == -1) {
           window.open(linkUrl, '_blank').focus();
           return false;
       }
   });
});