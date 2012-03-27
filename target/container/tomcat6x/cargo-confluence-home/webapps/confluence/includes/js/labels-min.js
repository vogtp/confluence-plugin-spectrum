AJS.Labels=(function(e){var k={parse:function(s){var t=[],r=e(s);if(r.is(d.labelItem)){t.push(r[0])}else{r.find(d.labelItem).each(function(){t.push(this)})}return t},contains:function(t){var r=e(t),s=r.text(),w=r.attr(w),u=e(d.labelView).first(),v;v=i()?":contains('"+s+"')":"["+d.idAttribute+"='"+w+"']";return !!u.find(d.labelItem).filter(v).size()},size:function(){return e(d.labelView).first().find(d.labelItem).size()}};var d={labelView:".label-list",labelItem:".label",noLabelsMessage:".no-labels-message",idAttribute:"data-label-id"};var q=Confluence.getContextPath(),o={index:q+"/labels/autocompletelabel.action?maxResults=3",create:q+"/json/addlabelactivity.action",validate:q+"/json/validatelabel.action",destroy:q+"/json/removelabelactivity.action"};var i=function(){return !!document.getElementById("createpageform")};var a=function(){return e(".space-administration").length};var f=0;var n=function(r){var s=b();p();if(r&&r.promise){r.done(function(u,t){AJS.Meta.set("num-labels",k.size());j(t);e("#rte-button-labels").trigger("updateLabel")});r.done(m);r.fail(m);r.done(s);r.fail(s)}return r};var b=function(){var r=e("#labelsString, #add-labels-editor-button");r.addClass("disabled");return function(){r.removeClass("disabled")}};var m=function(){e("#labelsString").val("")};var p=function(r){r=r||null;e("#labelOperationErrorMessage").html(r).toggle(!!r)};var j=function(r){r.each(function(){var u=e(this),t=u.find("li").size(),s=u.siblings(d.noLabelsMessage);s.toggle(!t)})};var l=function(r){if(!r){return false}var t={type:"POST",dataType:"json",data:{}},u,s=e.Deferred();t.url=i()?o.validate:o.create;t.data.entityIdString=AJS.params.pageId;t.data.labelString=r;u=AJS.safe.ajax(t);u.done(function(x){var w=e(d.labelView),v=e(k.parse(x.response));v.each(function(){if(k.contains(this)){return}var z,y=e("<li/>");if(i()){z=f+(new Date().getTime());this.setAttribute(d.idAttribute,z);f++}y.append(this).appendTo(w)});if(!x.success){p(x.response)}s.resolve(v,w)});u.fail(function(x,v,w){AJS.log(w);p(w.message);s.reject(w.message)});i()&&u.done(function(){var v=e("#createPageLabelsString").val();e("#createPageLabelsString").val(v+" "+r)});return s.promise()};var c=function(s){if(!s){return false}s=s.jquery?s:e(s);var w=s.attr(d.idAttribute),r=jQuery.trim(s.text()),v,u={type:"POST",dataType:"json",data:{}},t=e.Deferred();if(i()){v=e.Deferred();v.resolve()}else{if(a()){u.type="GET";u.url=q+"/spaces/removelabelfromspace.action";u.data.key=AJS.Meta.get("space-key");u.data.labelId=w;u.dataType="text"}else{u.url=o.destroy;u.data.entityIdString=AJS.params.pageId;u.data.labelIdString=w}v=AJS.safe.ajax(u)}v.done(function(){var x=e(d.labelItem);x=x.filter("["+d.idAttribute+"='"+w+"']");x.fadeOut("normal",function(){var y=x.closest(d.labelView);x.parent().remove();t.resolve(s,y)})});v.fail(function(z,x,y){console.log(y);p(y.message);t.reject()});i()&&t.done(function(){var x=e("#createPageLabelsString").val();var y=x.split(/\s+/);y=e.grep(y,function(z){return(!z||z==r)},true);e("#createPageLabelsString").val(y.join(" "))});return t.promise()};var g=function(){var w=e("#labelsString"),v=w.parents("#add-labels-form").length;if(!w.length){return}var t=function(x){e("#labelsAutocompleteList").append(x)};var u=function(F){if(F.find("a.label-suggestion").length){var G=e("span",F),C=e.data(G[0],"properties"),E=w.val(),y=[];if(v){y=E.split(/\s+/);y[y.length-1]=C.name;w.val(y.join(" "))}else{var D=AJS.Labels.queryTokens,J=-1,z,A="";for(var B=0,I=D.length;B<I;B++){A=D[B];z=E.lastIndexOf(A);if(z>J){J=z}}if(J!=-1){var H=E.substr(0,J);var x=E.substr(J+A.length).match(/^\s+/);if(x){H+=x[0]}w.val(H+C.name)}else{w.val(C.name)}}}};var r=function(){if(!e("#labelsAutocompleteList .label-suggestion").length){this.hide()}else{if(!v){var z=e("#labelsAutocompleteList a.label-suggestion");for(var x=0,y=z.length;x<y;x++){z.get(x).href="#"}}}};var s="/labels/autocompletelabel.action?maxResults=3";e(window).bind("quicksearch.ajax-success",function(y,x){if(x.url==s){AJS.Labels.queryTokens=(x.json&&x.json.queryTokens)||[];return false}});e(window).bind("quicksearch.ajax-error",function(y,x){if(x.url==s){AJS.Labels.queryTokens=[];return false}});w.quicksearch(s,r,{makeParams:function(x){return{query:x,contentId:AJS.params.pageId||""}},dropdownPlacement:t,ajsDropDownOptions:{selectionHandler:function(y,x){u(x);this.hide();y.preventDefault()}}})};var h=function(r){e("#labels_div").toggleClass("hidden");e("#labels_info").toggleClass("hidden");if(e("#labels_div").hasClass("hidden")){e("#labels_info").html(e("#labelsString").val().toLowerCase());e("#labels_edit_link").html(AJS.I18n.getText("edit.name"))}else{e("#labels_edit_link").html(AJS.I18n.getText("done.name"))}if(r){r.preventDefault()}};e("#labels_edit_link").live("click",h);e(".label-list.editable a.label").live("click",function(r){r.preventDefault()});e(".label-list.editable .remove-label").live("click",function(r){r.preventDefault();AJS.Labels.removeLabel(this.parentNode)});AJS.toInit(function(){if(a()){AJS.Labels.bindAutocomplete();e(".label-list").addClass("editable")}});return{addLabel:function(r){return n(l(r))},removeLabel:function(r){return n(c(r))},bindAutocomplete:g}})(AJS.$);