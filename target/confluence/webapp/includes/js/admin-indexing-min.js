AJS.toInit(function(h){var a=h("#search-index-task-progress-container"),t=h("#reindex-task-in-progress").length>0,x=h("#build-search-index-button"),n=h("#search-index-exists").length>0,C=h("#search-index-disabling-overlay"),p=h("#search-overlay-message"),z=h("#search-index-panel-contents"),b=h("#search-index-elapsed-time"),A=h("#search-index-elapsed-time-container"),j=h("#search-index-error-status"),B=h("#search-index-success-status"),w=h("#search-index-inprogress-status");var k=h("#dym-index-task-progress-container"),D=h("#dym-index-in-progress").length>0,i=h("#build-dym-index-button"),u=h("#dym-index-exists").length>0,m=h("#dym-index-disabling-overlay"),r=h("#ready-to-build-dym-index").length>0,o=h("#language-correct-for-dym").length>0,v=h("#dym-index-panel-contents"),e=h("#dym-overlay-message"),g=h("#dym-index-elapsed-time"),q=h("#dym-index-elapsed-time-container"),l=h("#dym-index-error-status"),f=h("#dym-index-success-status"),d=h("#dym-index-inprogress-status");C.hide();m.hide();if(!n||b.html()==""){A.hide()}if(!u||g.html()==""){q.hide()}a.progressBar(0);if(t||!r){m.show();v.addClass("faded");i.attr("disabled","disabled");if(t){e.html(h("#i18n-key-search-build-in-progress").val())}else{var y;if(!o){y=h("#i18n-key-dym-wrong-language").val()}else{y=h("#i18n-key-build-index-first").val()}e.html(y)}}if(t){x.attr("disabled","disabled");var s=setInterval(function(){h.getJSON(contextPath+"/json/reindextaskprogress.action",function(E){a.progressBar(E.percentageComplete);A.show();b.html(E.compactElapsedTime);if(E.percentageComplete==100){x.removeAttr("disabled");i.removeAttr("disabled");m.hide();v.removeClass("faded");B.show();j.hide();w.hide();clearInterval(s)}})},2000)}if(n&&!t){a.progressBar(100)}if(t){w.show();j.hide();B.hide()}else{if(n){B.show();j.hide();w.hide()}else{j.show();B.hide();w.hide()}}k.progressBar(0);if(D){C.show();z.addClass("faded");x.attr("disabled","disabled");p.html(h("#i18n-key-dym-build-in-progress").val())}if(D){i.attr("disabled","disabled");var c=setInterval(function(){h.getJSON(contextPath+"/admin/didyoumean/index-progress.action",function(E){k.progressBar(E.percentComplete);q.show();g.html(E.compactElapsedTime);if(E.percentComplete==100){i.removeAttr("disabled");x.removeAttr("disabled");C.hide();z.removeClass("faded");f.show();l.hide();d.hide();clearInterval(c)}})},2000)}if(u&&!D){k.progressBar(100)}if(D){d.show();l.hide();f.hide()}else{if(u){f.show();l.hide();d.hide()}else{l.show();f.hide();d.hide()}}});