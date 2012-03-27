<%
    if (request != null)
    {
        response.sendRedirect(request.getContextPath() + "/homepage.action");
        return;
    }
%>
<html>
	<head>
		<title>Go to Confluence</title>
	</head>
	<body>
		<strong><a href="<%= request.getContextPath() %>/homepage.action">Click here!</a></strong> to go to Confluence.
    </body>
</html>