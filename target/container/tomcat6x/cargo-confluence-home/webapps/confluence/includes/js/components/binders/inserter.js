/**
 * Insert on Event Binder component.
 * <br>
 * Requirements:
 * <li>template with class 'insert-on-event'</li>
 * <li>name of event to insert on must be specified in the 'data-event' attribute</li>
 * <li>selector to the target element that the event will be handled for must be specified in the 'data-target' attribute</li>
 * <li>selector to the element to append content to must be specified in the 'data-insert-position' attribute</li>
 * <br>
 * Optional:
 * <li>'data-insert-unique-key' attribute to ensure content is added only if it is not already on the page</li>
 * <li>Unique content is identified by elements with class 'key-holder' with keys in the 'data-key' attribute</li>
 *
 * @since 3.3
 * @class insertOnEvent
 * @namespace AJS.Confluence.Binder
 */
AJS.Confluence.Binder.insertOnEvent = function() {
    var $ = AJS.$;

    $(".insert-on-event[data-inserter-bound!=\"true\"]").each(function() {
        var $this = $(this).attr("data-inserter-bound", "true"),
            target = $($this.attr("data-target"))[0],
            eventType = $this.attr("data-event"),
            insertPosition = $this.attr("data-insert-position"),
            uniqueKey = $this.attr("data-insert-unique-key");

        if (target && eventType && insertPosition) {
            $(self).bind(eventType, function(e, data) {
                if (target == data.target) {
                    if (uniqueKey) {
                        var currentValue = data.content[uniqueKey],
                            keys = {};
                        $(".key-holder", insertPosition).each(function () {
                            keys[$(this).attr("data-key")] = true;
                        });
                        if (currentValue in keys) {
                            return;
                        }
                    }
                    $(insertPosition).append(AJS.template($this.text()).fill(data.content));
                }
            });
        }
    });
};