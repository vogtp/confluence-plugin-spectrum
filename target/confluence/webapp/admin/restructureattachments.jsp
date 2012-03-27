<%@ page language="java" autoFlush="true" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>

<%@ page import="org.apache.log4j.Level"%>
<%@ page import="org.apache.log4j.Logger"%>
<%@ page import="org.apache.log4j.WriterAppender"%>
<%@ page import="org.apache.log4j.HTMLLayout"%>
<%@ page import="com.atlassian.confluence.upgrade.upgradetask.HierarchicalFileSystemAttachmentUpgradeTask"%>
<%@ page import="com.atlassian.spring.container.ContainerManager"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Restructure Filesystem Attachment Storage</title>
</head>
<body>
<%
    if ("Restructure".equals(request.getParameter("action")))
    {
        Logger logger = Logger.getLogger("com.atlassian.confluence.upgrade.UpgradeTask");
        WriterAppender jspAppender = new WriterAppender(new HTMLLayout(), out);
        jspAppender.setImmediateFlush(false);
        logger.addAppender(jspAppender);
        logger.setLevel(Level.DEBUG);

        HierarchicalFileSystemAttachmentUpgradeTask task = (HierarchicalFileSystemAttachmentUpgradeTask) ContainerManager
                .getComponent("hierarchicalFileSystemAttachmentUpgradeTask");
        
        try
        {
            task.doUpgrade();   
        }
        catch (Exception ex)
        {
            logger.error("Exception while performing restructure.", ex);   
        }

        logger.removeAppender(jspAppender);
    }
    else
    {
%>
<p>This page allows you to move your file system stored attachments
to a new hierarchical structure, avoiding the issues <a
    href="http://jira.atlassian.com/browse/CONF-8298">CONF-8298</a> and <a
    href="http://jira.atlassian.com/browse/CONF-13004">CONF-13004</a>.</p>
<p>For further details see the <a
    href="http://confluence.atlassian.com/display/DOC/Hierarchical+File+System+Attachment+Storage">Confluence
Documentation on CAC</a></p>
<form name="restructureform" id="restructureform"
    action="restructureattachments.jsp" method="post"><input
    type="submit" name="action" value="Restructure"></form>
<%
    }
%>
</body>
</html>