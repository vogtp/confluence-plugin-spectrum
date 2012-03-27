jQuery.fn.movePageHistory=function(b){var e=jQuery;var c=e("#confluence-context-path").attr("content");var a=this;var d=e(".search-results",a);e(d).keydown(function(g){function f(k){var i=e(".search-result",a);var j=e(".search-result.selected",a);var h=i.index(j)+k;if(h<0){h=i.length-1}if(h>=i.length){h=0}i.eq(h).click()}if(g.which==38){f(-1)}else{if(g.which==40){f(1)}}});d.html(Confluence.Templates.MovePage.pageHistoryLoading());e.ajax({type:"GET",dataType:"json",data:{types:["spacedesc","personalspacedesc","page"]},url:c+"/json/history.action",error:function(){b.error(AJS.params.movePageDialogHistoryError)},success:function(g,f){if(f!="success"){b.error(AJS.params.movePageDialogHistoryError);return}if(!g.history||g.history.length==0){d.html("<div class='no-results'>"+AJS.I18n.getText("move.page.dialog.history.no.results")+"</div>");return}d.html(AJS.getTemplate("searchResultsGrid").toString());e.each(g.history,function(){var i=this;if(i.id==AJS.params.pageId){return}var h=AJS.$(AJS.renderTemplate("searchResultsGridRow",[i.title,c+i.url,i.type,i.spaceName,i.spaceKey,i.friendlyDate,i.date]));e(h).click(function(j){if(i.type=="page"){b.select(i.spaceKey,i.spaceName,i.title,i.id)}else{b.select(i.spaceKey,i.spaceName)}d.find(".selected").removeClass("selected");e(this).addClass("selected");return AJS.stopEvent(j)});e(h).hover(function(){e(this).addClass("hover")},function(){e(this).removeClass("hover")});d.find("table").append(h)});if(e(".search-result",d).length==0){d.html("<div class='no-results'>"+AJS.I18n.getText("move.page.dialog.history.no.results")+"</div>")}}})};