jQuery.fn.movePageAutocomplete=function(d,c,b,a){var f=jQuery;var e=a;AJS.log(d);return f(this).quicksearch(d,null,{dropdownPostprocess:function(g){f("> ol.last",g).remove();if(!f("> ol",g).length){f(g).append(b)}f("> ol:last-child",g).addClass("last");f("a",g).attr("tabindex","-1")},dropdownPlacement:function(g){f(c).append(g)},ajsDropDownOptions:{selectionHandler:function(h,g){if(g){this.hide("selected");e(h,g);h.preventDefault()}}}})};jQuery.fn.movePageLocation=function(c){var f=jQuery;var b=f(this);var e=f("#new-space",b);var d=f("#new-space-key",b);var a=f("#new-parent-page",b);var g=function(){if(e.is(":visible")){if(e.val()==""){e.val(AJS.Meta.get("space-name"));d.val(AJS.Meta.get("space-key"))}c.clearErrors();c.select(d.val(),e.val(),a.val())}};a.blur(g).focus(function(){c.clearErrors();AJS.dropDown.current&&AJS.dropDown.current.hide()});e.blur(g).focus(function(){AJS.dropDown.current&&AJS.dropDown.current.hide()});e.movePageAutocomplete("/json/contentnamesearch.action?type=spacedesc&type=personalspacedesc",f(".new-space-dropdown",b),Confluence.Templates.MovePage.noMatchingSpaces(),function(j,i){var h=i.find("span").data("properties");d.val(h.spaceKey);e.val(AJS("span").html(h.name).text());a.val("");g();a.focus()});a.movePageAutocomplete(function(){return"/json/contentnamesearch.action?type=page&spaceKey="+d.val()},f(".new-parent-page-dropdown",b),Confluence.Templates.MovePage.noMatchingPages(),function(i,h){var j=AJS("span").html(h.find("span").data("properties").name).text();a.val(j);g();window.setTimeout(function(){c.moveButton.focus()},50)})};