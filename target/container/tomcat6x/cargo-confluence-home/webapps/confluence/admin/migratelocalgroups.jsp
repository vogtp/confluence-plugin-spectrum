<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="org.springframework.transaction.TransactionDefinition" %>
<%@ page import="org.springframework.transaction.interceptor.DefaultTransactionAttribute" %>
<%@ page import="org.springframework.transaction.support.TransactionTemplate" %>
<%@ page import="org.springframework.transaction.TransactionStatus" %>
<%@ page import="org.springframework.transaction.PlatformTransactionManager" %>
<%@ page import="com.atlassian.confluence.user.migration.AtlassianUserDataMigrator" %>
<%@ page import="org.springframework.transaction.support.TransactionCallbackWithoutResult" %>
<%@ page import="java.io.IOException" %>

<%@ page contentType="text/html; charset=UTF-8" %>

<html>
<head>
    <title>Atlassian Local Group Migration Recovery</title>
</head>

<!--
A JSP which will transport local group memberships after upgrading to 3.5 without an atlassian-user.xml configuration.
-->

<body>
<%    String migrate = request.getParameter("migrate");
    if (migrate == null)
    {
%>
    <p>This will fix the group memberships of external users from LDAP if they are incorrect after migration.</p>

    <p>
    This should only be necessary if:
    <ul>
        <li>You upgraded from a pre-3.5 version to 3.5 or later.</li>
        <li>You had LDAP users with memberships in local groups.</li>
        <li>You forgot to copy over your atlassian-user.xml file before migrating.</li>
    </ul>
    </p>

    <p>
    Before you start migration, ensure the following:
    <ul>
        <li>You have configured your LDAP directory as a
            <a href="<%=request.getContextPath()%>/plugins/servlet/embedded-crowd/directories/list">User Directory</a>,
            and have synchronised it.</li>
        <li>You have chosen "Read Only, with Local Groups" in your "LDAP Permissions" settings for the directory.</li>
        <li>You don't have more than 10,000 users matching your LDAP user filter. If you do, you'll need to
            <a href="<%=request.getContextPath()%>/admin/migrate-external-memberships.action">use the migrator for internal directory with LDAP authentication</a> instead.</li>
    </ul>
    </p>

    <p>If all of the above are applicable, you can <a href="<%=request.getContextPath()%>/admin/migratelocalgroups.jsp?migrate=start">start migration</a>.</p>
<%
    }
    else
    {
        try
        {
            final AtlassianUserDataMigrator migrator = (AtlassianUserDataMigrator) ContainerManager.getComponent("atlassianUserDataMigrator");
            final PlatformTransactionManager transactionManager = (PlatformTransactionManager) ContainerManager.getComponent("transactionManager");

            if (migrator != null)
            {
                TransactionDefinition transactionDefinition = new DefaultTransactionAttribute(TransactionDefinition.PROPAGATION_REQUIRED);
                new TransactionTemplate(transactionManager, transactionDefinition).execute(new TransactionCallbackWithoutResult()
                {
                    @Override
                    protected void doInTransactionWithoutResult(TransactionStatus status)
                    {
                        migrator.migrateExternalMemberships();
                    }
                });
                out.println("The group membership migration completed successfully.");
            }
            else
            {
                printToJSPWriter(out, "The AtlassianUserDataMigrator was null");
            }
        }
        catch (Exception e)
        {
            printToJSPWriter(out, e.getMessage());

        }
    }
%>
</body>
</html>
<%!
    private void printToJSPWriter(JspWriter out, String failureReason)
            throws IOException
    {
        out.println("The group membership migration did not complete correctly. Please <a href=\"http://support.atlassian.com\">raise a support issue</a> and copy the following into the description:");
        out.println("<pre>");
        out.println(failureReason);
        out.println("</pre>");
    }
%>