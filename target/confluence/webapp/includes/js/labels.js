AJS.Labels = (function($) {

    var Labels = {
        parse: function(html) {
            var labels = [],
                result = $(html);

            if (result.is(defaults.labelItem)) {
                labels.push(result[0]);
            } else {
                result.find(defaults.labelItem).each(function() {
                    labels.push(this);
                });
            }

            return labels;
        },
        contains: function(label) {
            var $label = $(label),
                name = $label.text(),
                id = $label.attr(id),
                list = $(defaults.labelView).first(),
                condition;

            condition = isNewPage() ? ":contains('"+name+"')" : "["+defaults.idAttribute+"='"+id+"']";
            return !!list.find(defaults.labelItem).filter(condition).size();
        },
        size: function() {
            return $(defaults.labelView).first().find(defaults.labelItem).size();
        }
    };

    var defaults = {
        labelView: ".label-list",
        labelItem: ".label",
        noLabelsMessage: ".no-labels-message",
        idAttribute: "data-label-id"
    };

    var path = Confluence.getContextPath(),
        routes = {
        "index" : path + "/labels/autocompletelabel.action?maxResults=3",
        "create" : path + "/json/addlabelactivity.action",
        "validate" : path + "/json/validatelabel.action",
        "destroy" : path + "/json/removelabelactivity.action"
    };

    var isNewPage = function() { return !!document.getElementById("createpageform"); };
    var isSpaceAdminPage = function() { return $(".space-administration").length; };
    var seed = 0;

    var labelAction = function(result) {
        var reEnableForm = disableForm();
        setLabelError();

        if (result && result.promise) {
            result.done(function(labels, lists) {
                AJS.Meta.set('num-labels', Labels.size());
                updateLabelListCount(lists);
                $("#rte-button-labels").trigger("updateLabel");
            });

            result.done(resetForm);
            result.fail(resetForm);

            result.done(reEnableForm);
            result.fail(reEnableForm);
        }
        return result;
    };

    var disableForm = function() {
        var controls = $("#labelsString, #add-labels-editor-button");
        controls.addClass("disabled");

        return function() {
            controls.removeClass("disabled");
        }
    };

    var resetForm = function() {
        $("#labelsString").val('');
    };

    var setLabelError = function(message) {
        message = message || null;
        $("#labelOperationErrorMessage").html(message).toggle(!!message);
    };

    var updateLabelListCount = function($lists) {
        $lists.each(function() {
            var list = $(this),
                count = list.find("li").size(),
                message = list.siblings(defaults.noLabelsMessage);

            message.toggle(!count);
        });
    };

    var addLabels = function(labelString) {
        if (!labelString) return false;

        var request = {
                type: "POST",
                dataType: "json",
                data: {}
            },
            labelsTask,
            callbacks = $.Deferred();

        request.url = isNewPage() ? routes.validate : routes.create;
        request.data['entityIdString'] = AJS.params.pageId;
        request.data['labelString'] = labelString;

        // Make the request.
        labelsTask = AJS.safe.ajax(request);

        labelsTask.done(function(data) {
            var lists = $(defaults.labelView),
                newLabels = $(Labels.parse(data.response));
            newLabels.each(function() {
                if (Labels.contains(this)) {
                    return; // label is a duplicate.
                }
                var id,
                    item = $("<li/>");
                if (isNewPage()) {
                    id = seed + (new Date().getTime());
                    this.setAttribute(defaults.idAttribute, id);
                    seed++;
                }
                item.append(this).appendTo(lists);
            });

            // FIXME: Change how the server responds.
            // Server should return array of JSON objects, so we can show errors for
            // just the labels that failed, and add the ones that worked.
            if (!data.success) setLabelError(data.response);

            callbacks.resolve(newLabels, lists);
        });

        labelsTask.fail(function(xhr, status, e) {
            AJS.log(e);
            setLabelError(e.message);
            callbacks.reject(e.message);
        });

        isNewPage() && labelsTask.done(function() {
            // FIXME: Add set theory to scoped Labels collection object. Use it.
            var value = $("#createPageLabelsString").val();
            $("#createPageLabelsString").val(value + " " + labelString);
        });

        return callbacks.promise();
    };

    var removeLabel = function(label) {
        if (!label) return false;
        label = label.jquery ? label : $(label);

        var id = label.attr(defaults.idAttribute),
            tag = jQuery.trim(label.text()),
            removeLabelTask,
            request = {
                type: "POST",
                dataType: "json",
                data: {}
            },
            callbacks = $.Deferred();

        if (isNewPage()) {
            removeLabelTask = $.Deferred();
            removeLabelTask.resolve();
        } else {
            if (isSpaceAdminPage()) {
                // NOTE: The sad truth is, it's quite different :(
                request.type = "GET";
                request.url = path + "/spaces/removelabelfromspace.action";
                request.data['key'] = AJS.Meta.get("space-key");
                request.data['labelId'] = id;
                request.dataType = "text";
            } else {
                request.url = routes.destroy;
                request.data['entityIdString'] = AJS.params.pageId;
                request.data['labelIdString'] = id;
            }

            // Make the request
            removeLabelTask = AJS.safe.ajax(request);
        }

        removeLabelTask.done(function() {
            var labels = $(defaults.labelItem);
            labels = labels.filter("["+defaults.idAttribute+"='"+id+"']");
            labels.fadeOut("normal", function() {
                var list = labels.closest(defaults.labelView);
                labels.parent().remove();
                callbacks.resolve(label, list);
            });
        });
        removeLabelTask.fail(function(xhr, status, e) {
            console.log(e);
            setLabelError(e.message);
            callbacks.reject();
        });

        isNewPage() && callbacks.done(function() {
            // FIXME: Add set theory to scoped Labels collection object. Use it.
            var value = $("#createPageLabelsString").val();
            var labels = value.split(/\s+/);
            labels = $.grep(labels, function(text) { return (!text || text == tag); }, true);
            $("#createPageLabelsString").val(labels.join(' '));
        });

        return callbacks.promise();
    };

    // Binds the autocomplete labels ajax call to the labels input field.
    // Labels are added on select of the autocomplete drop down if the input field is within a form.
    var bindAutocomplete = function() {
        var labelInput = $("#labelsString"),
            addLabelOnSelect = labelInput.parents("#add-labels-form").length;

        if (!labelInput.length) {
            return;
        }

        var dropDownPlacement = function (dropDown) {
            $("#labelsAutocompleteList").append(dropDown);
        };

        var onselect = function (selection) {
            if (selection.find("a.label-suggestion").length) {

                var span = $("span", selection),
                    contentProps = $.data(span[0], "properties"),
                    value = labelInput.val(),
                    labelArray = [];

                if(addLabelOnSelect) {
                    labelArray = value.split(/\s+/);

                    labelArray[labelArray.length - 1] = contentProps.name;
                    labelInput.val(labelArray.join(' '));
                } else {
                    // this hacky code was copied from uberlabels.js
                    var tokens = AJS.Labels.queryTokens,
                        last_token_pos = -1,
                        this_token_pos,
                        token = "";

                    for (var i = 0, ii=tokens.length; i < ii; i++) {
                        token = tokens[i];
                        this_token_pos = value.lastIndexOf(token);

                        if (this_token_pos > last_token_pos) {
                            last_token_pos = this_token_pos;
                        }
                    }

                    if (last_token_pos != -1) {
                        var new_value = value.substr(0, last_token_pos);
                        var whitespace = value.substr(last_token_pos + token.length).match(/^\s+/);
                        if (whitespace)
                            new_value += whitespace[0];
                        labelInput.val(new_value + contentProps.name);
                    }
                    else {
                        labelInput.val(contentProps.name);
                    }
                }
            }
        };
        var onshow = function() {
            if (!$("#labelsAutocompleteList .label-suggestion").length) {
                this.hide();
            }
            else if(!addLabelOnSelect) {
                // remove hrefs if we're not going to add the label on select
                var labels = $("#labelsAutocompleteList a.label-suggestion");
                for(var i=0,ii=labels.length; i<ii; i++) {
                    labels.get(i).href = "#";
                }
            }
        };
        var url = "/labels/autocompletelabel.action?maxResults=3";
        $(window).bind("quicksearch.ajax-success", function(e, data) {
            if (data.url == url) {
                AJS.Labels.queryTokens = (data.json && data.json.queryTokens) || [];
                return false;
            }
        });
        $(window).bind("quicksearch.ajax-error", function(e, data) {
            if (data.url == url) {
                AJS.Labels.queryTokens = [];
                return false;
            }
        });
        labelInput.quicksearch(url, onshow, {
            makeParams: function(val) {
                return {
                    query: val,
                    contentId: AJS.params.pageId || ""
                };
            },
            dropdownPlacement : dropDownPlacement,
            ajsDropDownOptions : {
                selectionHandler: function (e, selection) {
                        onselect(selection);
                        this.hide();
                        e.preventDefault();
                    }
                }
        });
    };

    var toggleLabels = function (e) {
        $('#labels_div').toggleClass("hidden");
        $("#labels_info").toggleClass("hidden");

        if ($('#labels_div').hasClass("hidden")) {
            $("#labels_info").html($("#labelsString").val().toLowerCase());
            $("#labels_edit_link").html(AJS.I18n.getText("edit.name"));
        }
        else {
            $("#labels_edit_link").html(AJS.I18n.getText("done.name"));
        }

        if (e) e.preventDefault();
    };

    $("#labels_edit_link").live('click', toggleLabels);
    //bind event handlers for clicking on and deleting labels
    $(".label-list.editable a.label").live("click", function(e) {
        e.preventDefault();
    });
    $(".label-list.editable .remove-label").live("click", function(e) {
        e.preventDefault();
        AJS.Labels.removeLabel(this.parentNode);
    });
    // Make the labels on the space admin page editable.
    AJS.toInit(function(){
        if (isSpaceAdminPage()) {
            // bind autocomplete for space admin label field (find a better place for this?)
            AJS.Labels.bindAutocomplete();
            $(".label-list").addClass("editable");
        }
    });

    return {
        addLabel: function(labelString) {
            return labelAction(addLabels(labelString));
        },
        removeLabel: function(label) {
            return labelAction(removeLabel(label));
        },
        bindAutocomplete: bindAutocomplete
    };
})(AJS.$);
