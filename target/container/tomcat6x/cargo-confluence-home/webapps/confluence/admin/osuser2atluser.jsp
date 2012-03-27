<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="com.atlassian.user.impl.DuplicateEntityException" %>
<%@ page import="com.atlassian.user.util.migration.EntityMigrator" %>
<%@ page import="com.atlassian.user.util.migration.MigratorConfiguration" %>
<%@ page import="com.atlassian.confluence.user.migration.HtmlJspWriterMigrationProgressListener" %>
<%@ page import="com.atlassian.user.impl.RepositoryException" %>

<%@ page contentType="text/html; charset=UTF-8" %>

<html>
<head>
    <title>Atlassian User Transfer Utility</title>
</head>

<!--
A JSP which will transport current OSUser users and groups (and related property properties) to
a corresponding form in the primary Atlassian User repository.
-->

<body>
<%    String migrate = request.getParameter("migrate");
if (migrate == null)
{%>
<p>
This will migrate your existing users from Confluence's OSUser user repository to the Atlassian-User user repository.
This is an <em>internal</em> data change, and will not affect your ability to use or log in to Confluence.
</p>
<p>
Note: if you plan to use LDAP and existing Confluence users have the same username as LDAP users,
do not run migration until the LDAP repository is configured. Once the LDAP repository is configured,
this migration will ignore users who have the same username as an LDAP user. This will ensure users are not
duplicated in Confluence when you have both LDAP and local Confluence users enabled.
</p>

<p>
There are two options for migrating group membership of local Confluence users where a user already exists in LDAP.
Select one of the options below (if you are not using LDAP, use #1):
</p>
<ol>
<li>
    <strong>Transfer group memberships for existing LDAP users <em>(recommended)</em></strong> - If a user in OSUser already
    exists in the LDAP repository, its group memberships will be transferred to Hibernate as part of the migration.
    - <a href="<%=request.getContextPath()%>/admin/osuser2atluser.jsp?migrate=start&transferGroupMembership=true">Begin migration</a>.
</li>
<li>
    <strong>Remove group memberships for existing LDAP users</strong> - If a user in OSUser already exists in the LDAP repository,
    its group memberships will not be transferred. In effect, this will remove local group membership of any users found
    in LDAP. If your permission management is based on LDAP groups - choose this option.
    - <a href="<%=request.getContextPath()%>/admin/osuser2atluser.jsp?migrate=start">Begin migration</a>.
</li>
</ol>

<%
    }
    EntityMigrator migrator = null;

    MigratorConfiguration migratorConfiguration = new MigratorConfiguration();
    migratorConfiguration.setMigrateMembershipsForExistingUsers(Boolean.valueOf(request.getParameter("transferGroupMembership")).booleanValue());
    try
    {
        migrator = (EntityMigrator) ContainerManager.getComponent("osuserMigrationBean");
    }
    catch (Exception e)
    {
        out.println("<em class=\"bad\">The configuration for the osuserMigrationBean is missing.</em>");
    }

    if (migrator != null && migrate != null)
    {
        out.print("Migrating users and groups ... ");
        try
        {
            migrator.migrate(migratorConfiguration, new HtmlJspWriterMigrationProgressListener(out));
            out.print("<p>Users and groups migrated successfully!</p>");
        }
        catch (DuplicateEntityException dee)
        {
            out.println("<strong class=\"bad\">ERROR</strong><br><blockquote><em class=\"bad\">" + dee.getMessage() + "</em><br>");
            out.println("If you are upgrading from Confluence 2.1.x and have already performed this migration previously - <i>you do not need to perform this again</i>. You only need to move your settings over as outlined in <a href='http://confluence.atlassian.com/x/tp8C'>this document.</a><br>");
            out.println("Otherwise, please ensure that in your: <pre>confluence/WEB-INF/classes/atlassian-user.xml</pre> file, that the hibernateRepository is first and the osuserRepository is second.<br></blockquote>");
        }
        catch (RepositoryException repositoryException)
        {
            out.println("<strong class=\"bad\">ERROR</strong><br><blockquote><em class=\"bad\">" + repositoryException.getMessage() + "</em><br>");
            out.println("Please ensure that at least one non OSUser repository configured.");
        }
    }
%>

</body>
</html>