<%
    if (request != null)
    {
        response.sendRedirect(request.getContextPath() + "/admin/console.action");
        return;
    }
%>
<html>
	<head>
		<title>Go to Confluence Admin</title>
	</head>
	<body>
		<strong><a href="<%= request.getContextPath() %>/admin/console.action">Click here!</a></strong> to go to the Confluence administration console.
    </body>
</html>