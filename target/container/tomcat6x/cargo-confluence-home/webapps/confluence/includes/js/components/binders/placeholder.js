/**
 * Displays default text in the input field when its value is empty.
 * If the browser supports placeholder input attributes (HTML5), then
 * we skip this component.
 *
 * Usage:
 * <pre>
 * &lt;input placeholder="Some default text"&gt;
 * </pre>
 *
 * Events thrown: reset.placeholder
 * 
 * @class placeholder
 * @namespace AJS.Confluence.Binder
 */
AJS.Confluence.Binder.placeholder = function() {
    var $ = AJS.$;
    // browser supports placeholder, no need to do anything
    var temp = document.createElement('input');
    if('placeholder' in temp)
        return;

    // support old attributes defaul-text, cause it was introduced in 3.3.
    $("textarea[placeholder][data-placeholder-bound!=\"true\"]," +
      "input[placeholder][data-placeholder-bound!=\"true\"]," +
      "input.default-text[data-placeholder-bound!=\"true\"]").each(function() {
        var $this = $(this).attr("data-placeholder-bound", "true");
        // Since we insert the placeholder as value for browers that does not support the tag we need to remove it before submitting or
        // or it will be treated as the value for that field
        $this.bind("reset.placeholder",function(e,data){
           var form = data.element.closest("form");
           form.bind('submit',function() {
               if(data.element.hasClass("placeholded")){
                   data.element.val('');
               }
           });
        });


        var defaultText = $this.attr("placeholder") || $this.attr("data-default-text"),
            applyDefaultText = function() {
                if(!$.trim($this.val()).length) {
                    $this.val(defaultText)
                         .addClass("placeholded")
                         .trigger("reset.placeholder",{"element": $this, "defaultText": defaultText });
                    $this.trigger("reset.default-text");
                }
            };

        applyDefaultText();
        $this.blur(applyDefaultText).focus(function() {
            if($this.hasClass("placeholded")) {
                $this.val("");
                $this.removeClass("placeholded");
            }
        });
    });
};



// for backwards compatability
Confluence.Binder.inputDefaultText = Confluence.Binder.placeholder;