AJS.toInit(function(b){var a;var c=function(h){var i=function(){return b(".search-panel",h.baseElement)},j=function(){return b("#searched-images")},k=function(){return b(".search-form",h.baseElement)},g=function(){return b("input.search-text",k())},f=function(){return g().val()},e=function(){return b(".search-space",k()).val()},d=function(){g().focus()};return{clearContainer:function(){var l=j();l.find(".loading-message").removeClass("hidden");l.find(".image-list").empty();l.find(".warning").remove()},getPanelElement:i,getForm:k,getContainer:j,getSpaceKey:e,getQuery:f,getPanel:function(){return Confluence.Templates.Image.searchPanel({spaceKey:AJS.Meta.get("space-key"),spaceName:AJS.Meta.get("space-name")})},loadImages:function(l){b.ajax({type:"GET",dataType:"json",url:Confluence.getContextPath()+AJS.REST.getBaseUrl()+"search.json",data:{spaceKey:e(),query:f(),search:"name",type:"attachment",attachmentType:["image"],groupResults:false,searchParentName:true,pageSize:Confluence.Defaults.maxResults},success:l.success,error:l.error})},bindPanelSelection:function(){h.getPanel(a).onselect=d}}};Confluence.Editor.ImageDialog.panelComponent.push({id:"search",createPanel:function(f,d){var d=(d&&d(f))||c(f),e,g;a=f.addPanel(AJS.I18n.getText("image.browser.search.title"),d.getPanel(),"search-panel");e=d.getForm();e.focusin(f.clearSelection);g=d.getContainer();e.submit(function(i){var h=d.getQuery();try{if(h){d.clearContainer();d.loadImages({success:function(k){if(k.result){d.clearContainer();var j=new Confluence.Highlighter(h.split(" "));f.imageContainerSupport.refreshImageList(f,{imageContainer:d.getContainer(),images:k.result,noImageMessage:AJS.I18n.getText("image.browser.search.no.attachments"),justAttached:false,showParentTitle:true,highlighter:j})}},error:function(){g.find(".loading-message").addClass("hidden");g.append(b("<p></p>").addClass("warning").text(AJS.I18n.getText("image.browser.error.search")))}})}}finally{i.preventDefault()}return false});d.bindPanelSelection();f.imageContainerSupport.bindImageContainer(g,f)}})});