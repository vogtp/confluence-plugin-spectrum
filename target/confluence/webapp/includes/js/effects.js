function placeFocus()
{
    // If the page has been loaded with an #anchor, don't place focus because it breaks the anchor
    // If the page contains a page-edit form, don't place focus because it pisses people off too frequently
    if (document.location.hash || document.getElementById("editpageform") || document.getElementById("createpageform")
            || document.getElementById("upload-attachments") || document.getElementById("addcomment"))
    {
        return;
    }

    // allow ability to customize which textfield the focus goes to (by specifying "?autofocus=<id of element>")
    var autoFocusElementId = "";
    var queryString = window.location.search.substring(1);
    // substring to remove the leading "?"
    var parameterPairs = queryString.split("&");
    for (var i = 0; i < parameterPairs.length; i++)
    {
        var key = parameterPairs[i].split("=")[0];
        var value = parameterPairs[i].split("=")[1];
        if (key == "autofocus" && (value != null && value.length > 0))
        {
            autoFocusElementId = "'" + value + "'";
            // necessary single quotes as element ids returned by element.id contain them
        }
    }

    var stopNow = false;
    for (var i = 0; i < document.forms.length; i++)
    {
        var currSet = document.forms[i].elements;
        if (document.forms[i].id != 'quick-search' && document.forms[i].id != 'space-blog-quick-search' && document.forms[i].name != 'inlinecommentform')
        {
            for (var j = 0; j < currSet.length; j++)
            {
                if (
                    (currSet[j].type == 'text' || currSet[j].type == 'password' || currSet[j].type == 'textarea')
                        && !currSet[j].disabled
                        && !(currSet[j].style.display == 'none')
                    )
                {
                    try
                    {
                        if (autoFocusElementId != null && autoFocusElementId.length > 0)
                        {
                            if (currSet[j].id == autoFocusElementId)
                            {
                                currSet[j].focus();
                                stopNow = true;
                                break;
                            }
                        }
                        else
                        {
                            currSet[j].focus();
                            stopNow = true;
                            break;
                        }
                    }
                    catch (e)
                    {
                        // ignore
                        // setting focus to input elements inside hidden div's causes an exception on IE
                    }
                }
            }
        }
        if (stopNow)
            break;
    }
}

function setCookie(name, value, exp_y, exp_m, exp_d, path, domain, secure)
{
    var cookie_string = name + "=" + escape(value);

    if (exp_y)
    {
        var expires = new Date(exp_y, exp_m, exp_d);
        cookie_string += "; expires=" + expires.toGMTString();
    }

    if (path)
        cookie_string += "; path=" + escape(path);
    else
        cookie_string += "; path=/";

    if (domain)
        cookie_string += "; domain=" + escape(domain);

    if (secure)
        cookie_string += "; secure";

    document.cookie = cookie_string;
}

function getCookie(cookie_name)
{
    var results = document.cookie.match(cookie_name + '=(.*?)(;|$)');

    if (results)
        return ( unescape(results[1]) );
    else
        return null;
}

function highlight(element)
{
    new Effect.Highlight(element,{endcolor:"#f0f0f0"});
}

