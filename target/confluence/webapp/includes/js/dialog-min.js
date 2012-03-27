AJS.ConfluenceDialog=function(a){var b;a=a||{};a=jQuery.extend({},{keypressListener:function(c){if(c.keyCode===27){AJS.debug("dialog.js: escape keydown caught");if(!jQuery(".aui-dropdown",b.popup.element).is(":visible")){if(typeof a.onCancel=="function"){a.onCancel()}else{b.hide()}}}else{if(c.keyCode===13){AJS.debug("dialog.js: enter keydown caught");if(!jQuery(".aui-dropdown",b.popup.element).is(":visible")){var d=c.target.nodeName&&c.target.nodeName.toLowerCase();if(d!="textarea"&&typeof a.onSubmit=="function"){setTimeout(a.onSubmit)}}}}},width:865,height:530},a);b=new AJS.Dialog(a);jQuery.aop.around({target:b,method:"addButton"},function(c){if(c.arguments[0]){c.arguments[0]=AJS.I18n.getText(c.arguments[0])}return c.proceed()});return b};AJS.toInit(function(b){AJS.bind("show.dialog",function(h,f){var c=AJS.Meta.get("page-id"),j=AJS.Meta.get("space-key"),d=AJS.Meta.get("editor-mode"),g=AJS.Meta.get("new-page"),i=function(){var e={};if(c){e.pageid=c}if(j){e.spacekey=j}if(d){e.editormode=d}if(g){e.newpage=g}return e};AJS.EventQueue=AJS.EventQueue||[];AJS.EventQueue.push({name:f.dialog.id,properties:i()})});var a=function(e){var g=b(e),f;if(g.attr("data-lasttab-override")){return}if(g.attr("data-tab-default")){f=g.attr("data-tab-default")}var h=Confluence.storageManager(g.attr("id")),d=h.getItem("last-tab"),c=d!=null?d:f;if(c){b(".page-menu-item:visible:eq("+c+") button",g).click()}if(!g.attr("data-lasttab-bound")){b(".page-menu-item",g).each(function(k,j){b(j).click(function(){h.setItem("last-tab",k)})});g.attr("data-lasttab-bound","true")}};b(document).bind("showLayer",function(f,c,d){Confluence.runBinderComponents();if(c=="popup"&&d){a(d.element)}});AJS.Dialog.prototype.overrideLastTab=function(){b(this.popup.element).attr("data-lasttab-override","true")};AJS.Dialog.prototype.addHelpText=function(d,c){if(!d){return}var g=d;if(c){g=AJS.template(d).fill(c).toString()}var f=this.page[this.curpage];if(!f.buttonpanel){f.addButtonPanel()}var e=b("<div class='dialog-tip'></div>").html(g);f.buttonpanel.append(e);b("a",e).click(function(){window.open(this.href,"_blank").focus();return false})};AJS.Dialog.prototype.getTitle=function(){return b("#"+this.id+" .dialog-components:visible h2").text()};AJS.Dialog.prototype.isVisible=function(){return b("#"+this.id).is(":visible")}});