// ensure you have a text element on the page with id='port' 
function updatePort(e)
{
    if (e.value == 'pop3')
        document.getElementById("port").value = 110;
    else if (e.value == 'pop3s')
        document.getElementById("port").value = 995;
    else if (e.value == 'imap')
        document.getElementById("port").value = 143;
    else if (e.value == 'imaps')
        document.getElementById("port").value = 993;
    else
        alert('Protocol: ' + e.value + ' is not a supported protocol.');
}
