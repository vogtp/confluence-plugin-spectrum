(function(d){var e=[];var c=function(f){return f.hasClass("icon-stop-watching")};var b=function(h,j,i){var g=c(i),k=i.parent().find(".icon-wait"),f,l;if(j=="page"){f=Confluence.getContextPath()+"/users/"+(g?"removepagenotificationajax.action":"addpagenotificationajax.action");l={pageId:h}}if(j=="space"){f=Confluence.getContextPath()+"/users/"+(g?"removespacenotificationajax.action":"addspacenotificationajax.action");l={spaceKey:h}}i.addClass("hidden");k.removeClass("hidden");AJS.safe.ajax({url:f,type:"POST",data:l,success:function(m){AJS.log(m);k.addClass("hidden");i.parent().find(g?".icon-start-watching":".icon-stop-watching").removeClass("hidden");delete e[h]},error:function(o,n,m){k.addClass("hidden");i.parent().find(g?".icon-stop-watching":".icon-start-watching").removeClass("hidden");AJS.log("Error Toggling Watching: "+n);delete e[h]}})};var a=function(g,f){if(g.attr("data-watching-bound")){return}g.delegate(".icon-start-watching, .icon-stop-watching","click",function(k){var i=d(k.target);var h,j=g.attr("data-entity-type");if(f&&f.getEntityId&&typeof f.getEntityId=="function"){h=f.getEntityId(i)}else{h=g.attr("data-entity-id")}if(e[h]){AJS.log("Already busy toggling favourite for "+j+" '"+h+"'. Ignoring request.");return}e[h]=true;b(h,j,i);return false});g.attr("data-watching-bound",true)};AJS.Confluence.Binder.watching=function(){d(".entity-watching").each(function(){if(!d(this).attr("data-watching-bound")){a(d(this),{})}})};d.fn.watching=function(f){d(this).each(function(){var g=d(this);a(g,f)})}})(AJS.$);