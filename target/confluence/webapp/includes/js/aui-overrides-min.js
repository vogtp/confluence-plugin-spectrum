(function(){if(typeof AJS!="undefined"){var a=AJS.populateParameters;AJS.populateParameters=function(){a.apply(AJS,arguments);AJS.$("meta[name^=ajs-]").each(function(){var b=this.name,c=this.content;b=b.substring(4).replace(/(-\w)/g,function(d){return d.charAt(1).toUpperCase()});if(typeof AJS.params[b]=="undefined"){AJS.params[b]=AJS.asBooleanOrString(c)}})}}AJS.$.fn.disable=function(b){return this.each(function(){var c=AJS.$(this);var d=c.attr("disabled","disabled").addClass("disabled").attr("id");if(d){AJS.$("label[for="+d+"]",c.parent()).addClass("disabled")}})};AJS.$.fn.enable=function(b){return this.each(function(){var c=AJS.$(this);var d=c.attr("disabled","").removeClass("disabled").attr("id");if(d){AJS.$("label[for="+d+"]",c.parent()).removeClass("disabled")}})}})();