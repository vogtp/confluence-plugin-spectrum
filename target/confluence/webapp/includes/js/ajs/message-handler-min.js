(function(b){var a=function(c){var d,e;d=function(){return c.baseElement};e=function(g){var f=b("ul",g);if(!f.length){f=AJS("ul").appendTo(g)}return f};return{getMessageContainer:d,clearMessages:function(){d().addClass("hidden").empty()},displayMessages:function(j){if(!j||!j.length){return}if(!b.isArray(j)){j=[j]}var k=d(),h=e(k);for(var f=0,g=j.length;f<g;f++){AJS("li").text(j[f]).appendTo(h)}k.removeClass("hidden")},handleResponseErrors:function(f,g){var h=[].concat(f.validationErrors||[]).concat(f.actionErrors||[]).concat(f.errorMessage||[]);if(h.length){this.displayMessages(g||h);return true}return false}}};AJS.MessageHandler=function(d,e){var c=b.extend(a(d),e&&e(d));c.getMessageContainer().addClass("message-handler");c.clearMessages();return c}})(AJS.$);