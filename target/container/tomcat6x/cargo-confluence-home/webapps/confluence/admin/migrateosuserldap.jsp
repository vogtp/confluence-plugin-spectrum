<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="java.io.IOException" %>
<%@ page import="java.util.List" %>
<%@ page import="com.atlassian.crowd.embedded.api.CrowdDirectoryService" %>
<%@ page import="com.atlassian.crowd.embedded.api.Directory" %>
<%@ page import="com.atlassian.crowd.embedded.api.DirectoryType" %>
<%@ page import="com.atlassian.confluence.util.GeneralUtil" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="com.atlassian.user.util.migration.OSUCrowdEntityMigrator" %>
<%@ page import="org.springframework.transaction.PlatformTransactionManager" %>
<%@ page import="org.springframework.transaction.TransactionDefinition" %>
<%@ page import="org.springframework.transaction.interceptor.DefaultTransactionAttribute" %>
<%@ page import="org.springframework.transaction.support.TransactionTemplate" %>
<%@ page import="org.springframework.transaction.support.TransactionCallbackWithoutResult" %>
<%@ page import="org.springframework.transaction.TransactionStatus" %>
<%@ page import="net.sf.hibernate.Session" %>
<%@ page import="org.springframework.orm.hibernate.SessionFactoryUtils" %>
<%@ page import="net.sf.hibernate.SessionFactory" %>
<%@ page import="com.atlassian.user.util.migration.MigrationProgressListener" %>
<%@ page import="com.atlassian.user.util.migration.Slf4jMigrationProgressListener" %>
<%@ page import="net.sf.hibernate.FlushMode" %>
<%@ page import="com.atlassian.confluence.user.migration.AtlassianUserDataMigrator" %>

<%@ page contentType="text/html; charset=UTF-8" %>

<html>
<head>
    <title>OSUser LDAP Migration Recovery</title>
</head>

<!--
A JSP that will migrate OSUser LDAP users and their group memberships to a 3.5 internal with LDAP auth directory
-->

<body>
<%
    final Logger log = LoggerFactory.getLogger(this.getClass());

    String migrate = request.getParameter("migrate");

    // Figure out which directory to use (internal with LDAP)
    CrowdDirectoryService crowdDirectoryService = (CrowdDirectoryService) ContainerManager.getComponent("crowdDirectoryService");
    List<Directory> directories = crowdDirectoryService.findAllDirectories();
    Directory firstActiveDelegatedDirectory = null;
    for (Directory directory : directories)
    {
        if (directory.isActive() && directory.getType().equals(DirectoryType.DELEGATING))
        {
            firstActiveDelegatedDirectory = directory;
            break;
        }
    }

    final Directory targetDirectory = firstActiveDelegatedDirectory;

    if (targetDirectory == null)
    {%>
    <div class="aui-message error">
        <p class="title">
            <span class="aui-icon icon-error"></span>
            <strong>An error occurred:</strong>
        </p>
        <p>You don't have any active &quot;Internal with LDAP authentication&quot; directories configured. You must create one to continue.</p>
    </div>
<%
    }
    else if (migrate == null)
    {
%>
    <p>This will migrate any OSUser users and their group memberships to the top-listed Confluence 3.5+ internal directory with LDAP authentication.</p>

    <p>This should only be necessary if these are all true:</p>
    <ul>
        <li>You upgraded from a pre-3.5 version to 3.5 or later.</li>
        <li>You had an atlassian-users.xml configured with OSUsers and an LDAP provider in your osuser.xml.</li>
        <li>You followed the first part of the workaround in <a href="http://confluence.atlassian.com/x/5AQMDg">this KB article</a> - i.e. restored osuser.xml and then upgraded.</li>
        <li>You want your old OSUser entries migrated to <% out.print(GeneralUtil.htmlEncode(targetDirectory.getName())); %></li>
    </ul>

    <p>If all of the above are applicable, you can <a href="<%=request.getContextPath()%>/admin/migrateosuserldap.jsp?migrate=start">start migration</a>.</p>
    <p>If you want to migrate the users to a different delegated LDAP authentication directory, then move that one to the top of the directory list.</p>
<%
    }
    else
    {
        try
        {
            final OSUCrowdEntityMigrator osUserMigrator = (OSUCrowdEntityMigrator) ContainerManager.getComponent("osuserMigrationBeanTarget");
            final AtlassianUserDataMigrator externalMembershipsMigrator = (AtlassianUserDataMigrator) ContainerManager.getComponent("atlassianUserDataMigrator");
            final PlatformTransactionManager transactionManager = (PlatformTransactionManager) ContainerManager.getComponent("transactionManager");

            if (osUserMigrator != null && externalMembershipsMigrator != null)
            {
                TransactionDefinition transactionDefinition = new DefaultTransactionAttribute(TransactionDefinition.PROPAGATION_REQUIRED);
                new TransactionTemplate(transactionManager, transactionDefinition).execute(new TransactionCallbackWithoutResult()
                {
                    @Override
                    protected void doInTransactionWithoutResult(TransactionStatus status)
                    {
                        SessionFactory sessionFactory = (SessionFactory) ContainerManager.getComponent("sessionFactory");
                        Session hibernateSession = SessionFactoryUtils.getSession(sessionFactory, true);
                        FlushMode oldFlushMode = hibernateSession.getFlushMode();

                        try
                        {
                            MigrationProgressListener progressListener = new Slf4jMigrationProgressListener(log);
                            osUserMigrator.migrateUsersAndUserProperties(progressListener, hibernateSession, targetDirectory);
                            osUserMigrator.migrateGroups(hibernateSession, targetDirectory, progressListener);
                            osUserMigrator.migrateGroupMemberships(targetDirectory, hibernateSession);
                            externalMembershipsMigrator.migrateExternalMemberships();
                            hibernateSession.flush();
                        }
                        catch (Exception e)
                        {
                            log.error("Failed to migrate OSUsers", e);
                        }
                        finally
                        {
                            hibernateSession.setFlushMode(oldFlushMode);
                        }
                    }
                });
                out.println("The group membership migration completed successfully.");
            }
            else if (osUserMigrator == null)
            {
                printToJSPWriter(out, "The OSUCrowdEntityMigrator was null");
            }
            else
            {
                printToJSPWriter(out, "The AtlassianUserDataMigrator was null");
            }
        }
        catch (Exception e)
        {
            printToJSPWriter(out, e.getMessage());
            log.error("Migration of OSUser LDAP failed: ", e);
        }
    }
%>
</body>
</html>
<%!
    private void printToJSPWriter(JspWriter out, String failureReason)
            throws IOException
    {
        out.println("The OSUser LDAP migration did not complete correctly. Please <a href=\"http://support.atlassian.com\">raise a support issue</a> and copy the following into the description:");
        out.println("<pre>");
        out.println(failureReason);
        out.println("</pre>");
    }
%>