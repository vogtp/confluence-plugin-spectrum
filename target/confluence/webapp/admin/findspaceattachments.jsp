<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>

<%@ page import="org.apache.log4j.Level"%>
<%@ page import="org.apache.log4j.Logger"%>
<%@ page import="org.apache.log4j.WriterAppender"%>
<%@ page import="org.apache.log4j.HTMLLayout"%>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="com.atlassian.confluence.spaces.SpaceManager" %>
<%@ page import="com.atlassian.confluence.spaces.Space" %>
<%@ page import="com.atlassian.confluence.util.GeneralUtil" %>
<%@ page import="org.apache.commons.lang.StringUtils" %>
<%@ page import="com.atlassian.confluence.upgrade.upgradetask.HierarchicalFileSystemAttachmentUpgradeTask" %>
<%@ page import="com.atlassian.confluence.pages.persistence.dao.HierarchicalFileSystemAttachmentDataDao" %>
<%@ page import="java.io.File" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Find Space Attachment Storage Location</title>
</head>
<body>
<%
    if ("Find".equals(request.getParameter("action")))
    {
        String spaceKey = request.getParameter("spacekey");
        if (StringUtils.isBlank(spaceKey))
        {
%>
<p>
<strong>The space key parameter must be supplied</strong>
</p>
<%            
        }
        else
        {
                SpaceManager spaceManager = (SpaceManager) ContainerManager.getComponent("spaceManager");
                Space space = spaceManager.getSpace(spaceKey);
                if (space == null)
                {
%>
<p>
<strong>No space was found for the key <%= GeneralUtil.htmlEncode(spaceKey) %></strong>
</p>
<%
                }
                else
                {
                    HierarchicalFileSystemAttachmentDataDao dao = (HierarchicalFileSystemAttachmentDataDao) ContainerManager.getComponent("fileSystemAttachmentDataDao");
                    File pageDir = dao.getDirectoryForAttachmentContainer(0, space.getId());
                    
                    // now remove the made up (0) contentId part
                    File spaceDir = pageDir;
                    for (int i=0; i < 3; i++)
                    {
                        File parentDir = spaceDir.getParentFile();
                        if (parentDir == null)
                            break;
                        
                        spaceDir = parentDir;
                    }
%>
<p>
Attachments for the space <strong><%= GeneralUtil.htmlEncode(space.getName()) %></strong> (key=<strong><%= GeneralUtil.htmlEncode(spaceKey) %></strong>) are stored at -
</p> 
<ul>
<li><%= GeneralUtil.htmlEncode(spaceDir.getAbsolutePath()) %>
</ul>
<hr/>
<%
                }
        }
    }

HierarchicalFileSystemAttachmentUpgradeTask upgradeTask = (HierarchicalFileSystemAttachmentUpgradeTask) ContainerManager.getComponent("hierarchicalFileSystemAttachmentUpgradeTask");
        if (upgradeTask.isUpgradeNeeded())
        {
%>
<p>
Given a valid space key, this page will provide you with the location on the file system where the attachments for this space are stored.
</p>
<p>
If this Confluence instance is not using file system attachment storage then this will be indicated.
</p>
<form name="spacekeyform" id="spacekeyform"
    action="findspaceattachments.jsp" method="post">
    <input type="text" size="10" name="spacekey"/>
    <input type="submit" name="action" value="Find" />
</form>
<%
        }
        else
        {
%>
    <p>
    This instance of Confluence is not configured to store attachments on the file system so no file system locations can be given.
    </p>
<%
        }
%>
</body>
</html>