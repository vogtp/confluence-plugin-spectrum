AJS.toInit(function(e){var c,f=140;function b(){var m="idontthinksohal";var j=new AJS.Dialog(650,m,"update-user-status-dialog");var l=j.popup.element;var k=e(Confluence.Templates.UserStatus.dialogContent({maxChars:f}));j.addHeader(AJS.I18n.getText("status.dialog.heading"));j.addPanel(AJS.I18n.getText("status.dialog.panel.title"),k);j.addButton(AJS.I18n.getText("status.dialog.button.update"),h,"status-update-button");j.addCancel(AJS.I18n.getText("cancel.name"),function(n){n.hide();return false});j.setError=function(n){e(".error-message",l).html(n)};if(Confluence.KeyboardShortcuts&&Confluence.KeyboardShortcuts.enabled){j.addHelpText(AJS.I18n.getText("keyboard.shortcuts.dialog.tip","s"))}return j}function g(k){var j;if(!k){j=AJS.I18n.getText("status.message.error.blank")}else{if(!e.trim(k)){j=AJS.I18n.getText("status.message.error.onlywhitespace")}else{if(k.length>f){j=AJS.I18n.getText("status.message.error.too.long",f)}}}if(j){c.setError(j)}return !j}function d(j){e(".current-user-latest-status .status-text").html(j.text);e(".current-user-latest-status a[id^=view]").each(function(){var l=e(this),k=l.attr("href");l.attr("href",k.replace(/\d+$/,j.id)).text(j.friendlyDate).attr("title",new Date(j.date).toLocaleString())})}function i(){e.getJSON(Confluence.getContextPath()+"/status/current.action",function(j){if(j.errorMessage){c.setError(j.errorMessage)}else{d(j)}})}var h=function(){var m=c.popup.element,p=e("#status-text",m),k=e(".status-update-button",m),o=p.val(),j,n;function l(){p.blur();p.attr("disabled","disabled").attr("readonly","readonly");k.attr("disabled","disabled");return function(){p.focus();p.removeAttr("disabled").removeAttr("readonly");k.removeAttr("disabled")}}j=l();if(!g(o)){j();return false}n=AJS.safe.ajax({url:Confluence.getContextPath()+"/status/update.action",type:"POST",dataType:"json",data:{text:o}});n.done(j).fail(j);n.done(function(q){if(q.errorMessage){c.setError(q.errorMessage)}else{d(q);p.val("");m.fadeOut(200,function(){c.hide()})}});n.fail(function(s,r,q){AJS.log("Error updating status: "+r);AJS.log(q);c.setError("There was an error - "+q)});return n.promise()};var a=function(j){var l=j.popup.element,n=e("#status-text",l),m=e(".chars-left",l),k=e(".status-update-button",l);n.keydown(function(o){if(o.keyCode==13){h()}}).bind("blur focus change "+(!e.browser.msie?"paste input":"keyup"),function(){var p=e(this).val(),o=f-p.length;k[p.length?"removeAttr":"attr"]("disabled","disabled");m.text(Math.abs(o)).toggleClass("close-to-limit",o<20).toggleClass("over-limit",o<0)});e("form",l).submit(function(o){o.preventDefault();h()})};e("#set-user-status-link").click(function(k){var j=e(this).parents(".ajs-drop-down")[0];j&&j.hide();if(typeof c=="undefined"){c=b();a(c)}i();c.setError("");c.show();e("#update-user-status-dialog #status-text").removeAttr("readonly").removeAttr("disabled").focus();return AJS.stopEvent(k)})});