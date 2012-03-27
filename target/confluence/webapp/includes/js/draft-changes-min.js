AJS.toInit(function(d){AJS.log("draft-changes initialising");var a;var f=function(h){a=new AJS.Dialog(860,530,"view-diff-draft-dialog");var i=AJS.I18n.getText("draft.heading");a.addHeader(i.replace(/\{0\}/,""));var g=d(Confluence.Templates.DraftChanges.dialogContent());a.addPanel("Diff",g);if(h){a.addButton(AJS.I18n.getText("edit.name"),function(j){a.hide();if(Confluence.Editor&&Confluence.Editor.Drafts){Confluence.Editor.Drafts.useDraft()}else{window.location=d(this).attr("data-href")}},"resume-diff-link");a.addButton(AJS.I18n.getText("discard.name"),function(j){a.hide();if(Confluence.Editor&&Confluence.Editor.Drafts){Confluence.Editor.Drafts.discardDraft()}else{window.location=d(this).attr("data-href")}},"discard-diff-link")}a.addCancel(AJS.I18n.getText("close.name"),function(){a.hide();return false});g.removeClass("hidden")};var c=function(j,h){d("#diff-view").html(j.htmlDiff);var k=AJS.I18n.getText("draft.heading");a.addHeader(k.replace(/\{0\}/,j.title));a.popup.element.find(".dialog-title").append(Confluence.Templates.DraftChanges.helpLink());var i=d("#atlassian-token").attr("content");var g=Confluence.getContextPath();d(".resume-diff-link").attr("data-href",g+"/pages/resumedraft.action?draftId="+h);d(".discard-diff-link").attr("data-href",g+"/users/deletedraft.action?draftId="+h+"&atl_token="+i);AJS.setVisible("#merge-warning",j.isMergeRequired)};var e=function(i){var g,k,h;var j=function(m){var l=/draftPageId:([^ ]*)/.exec(m);g=l?l[1]:AJS.Meta.get("page-id");l=/username:([^ ]*)/.exec(m);k=l?l[1]:AJS.Meta.get("remote-user");l=/draftId:([^ ]*)/.exec(m);h=l?l[1]:null};j(i.attr("class"));AJS.safeAjax({url:Confluence.getContextPath()+"/draftchanges/viewdraftchanges.action",type:"GET",dataType:"json",data:{pageId:g,username:k},success:function(n){if(n.actionErrors){var m="";var o=n.actionErrors;for(var l=0;l<o.length;l++){AJS.log("error: "+(o[l]));m=m+"<div>"+o[l]+"</div>"}d("#diff-view").html(m)}else{c(n,h)}},error:function(l){var m=l.errors||"An unknown error has occurred. Please check your logs";d("#diff-view").html(m)}})};var b=function(h,g){Confluence.Editor&&Confluence.Editor.Drafts.save();if(!a){f(g)}a.addHeader(AJS.I18n.getText("loading.name"));d("#diff-view").html("<tr><td id='draft-changes-waiting-icon'>Loading...</td></tr>");e(h);a.show()};d("#draft-status").click(function(h){var g=d(h.target);if(g.hasClass("view-diff-link")){b(g,false)}return AJS.stopEvent(h)});d(".view-diff-link").click(function(h){var g=d(this);b(g,true);return AJS.stopEvent(h)})});