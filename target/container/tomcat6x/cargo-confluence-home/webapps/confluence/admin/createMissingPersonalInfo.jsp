<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>

<%@ page import="org.apache.log4j.Level" %>
<%@ page import="org.apache.log4j.Logger" %>
<%@ page import="org.apache.log4j.WriterAppender" %>
<%@ page import="org.apache.log4j.HTMLLayout" %>
<%@ page import="com.atlassian.confluence.upgrade.upgradetask.PersonalInformationRepairTask" %>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Create Missing Personal Information</title>
</head>
<body>

<%
	if ("create".equals(request.getParameter("action")))
	{
		Logger logger = Logger.getLogger("com.atlassian.confluence.upgrade.PersonalInformationRepairTask");
		WriterAppender jspAppender = new WriterAppender(new HTMLLayout(), out);
		logger.addAppender(jspAppender);
		logger.setLevel(Level.DEBUG);
		
		PersonalInformationRepairTask task = (PersonalInformationRepairTask)ContainerManager.getComponent("personalInformationRepairTask");
		task.run();
		
		logger.removeAppender(jspAppender);
	}
    else
    {
%>
<p>
This page allows you to build Personal Information objects for any content that has been created or modified by users that are described in an external system such as LDAP.
</p>
<p>
By building Personal Information objects the auto-complete box used in contributor filtering on the search screen will more completely populate.
</p>
<form name="create" id="create" action="createMissingPersonalInfo.jsp" method="post">
	<input type="submit" name="action" value="create">
</form>
<% } %>
</body>
</html>