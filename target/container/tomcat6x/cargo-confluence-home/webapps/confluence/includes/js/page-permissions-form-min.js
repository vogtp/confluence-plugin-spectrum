AJS.PagePermissions.Controls=function(b){var d=AJS.$;var c={handleNonExistentEntityNames:function(g){if(!g||!g.length){return}var f=g.join(", ");var h=AJS.I18n.getText("page.perms.error.invalid.entity.names")+" "+f;d("#page-permissions-error-div").find("div").text(h).end().removeClass("hidden");b.refreshLayout()},isDuplicateEntityForType:function(f,h){var g=d("#page-permissions-table ."+h+"-permission-row .permission-entity-name").filter(function(){return d(this).text()==f.name});return g.length>0},resetValidationErrors:function(){d("#page-permissions-error-div").addClass("hidden");b.refreshLayout()}};var a=(function(){var f=d("#page-permissions-names-input");var h=d("#page-permissions-names-hidden");var g=f.val();f.keypress(function(i){if(i.keyCode==Event.KEY_RETURN){e();f.focus();return false}return true});f.bind("selected.autocomplete-user",function(j,i){var k=i.content.username;h.val(unescape(k.replace(/\+/g," ")));f.val("");e();j.preventDefault()});f.focus(function(){var k=f.next(".aui-dd-parent");if(!k.length){return}k.show();var i=f.offset().left;if(k.offset().left!=i){k.css("margin-left",0);var m=i-k.offset().left;k.css("margin-left",m+"px")}var l=f.offset().top+f.outerHeight();if(k.offset().top!=l){k.css("margin-top",0);var j=l-k.offset().top;k.css("margin-top",j+"px")}k.css({width:f.outerWidth()});k.hide()});return{getValue:function(){var i=h.val();if(i){h.val("")}else{i=f.val();if(i==g){i=""}}return i},removeFromNameInput:function(m){if(!m){return}var l=f.val();if(!l){return}var j=l.split(",");for(var k=0;k<j.length;k++){j[k]=d.trim(j[k])}j=d.grep(j,function(i){return i!=""&&i!=m});if(j.length){f.val(j.join(", "))}else{if(document.activeElement==f[0]){f.val("")}}}}})();var e=function(){c.resetValidationErrors();b.table.clearHighlight();var f=a.getValue();if(!f){return}b.addNames(f)};d("#page-permissions-choose-me").click(function(f){c.resetValidationErrors();b.addNames(d(this).find(".remote-user-name").text());return AJS.stopEvent(f)});d("#permissions-error-div-close").click(function(f){c.resetValidationErrors();return AJS.stopEvent(f)});d("#add-typed-names").click(e);return{validator:c,nameField:a,setVisible:function(f){AJS.setVisible("#page-permissions-editor-form",f);AJS.setVisible(".remove-permission-link",f)},isShowing:function(){return !d("#page-permissions-editor-form").hasClass("hidden")},getPermissionType:function(){return !!d("#restrictViewRadio:checked").length?"view":"edit"}}};