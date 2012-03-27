<%@ page import="java.io.IOException" %>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="org.springframework.transaction.PlatformTransactionManager" %>
<%@ page import="org.springframework.transaction.TransactionStatus" %>
<%@ page import="org.springframework.transaction.support.TransactionCallbackWithoutResult" %>
<%@ page import="org.springframework.transaction.support.TransactionTemplate" %>
<%@ page import="org.springframework.transaction.TransactionDefinition" %>
<%@ page import="org.springframework.transaction.interceptor.DefaultTransactionAttribute" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="com.atlassian.confluence.upgrade.UpgradeError" %>
<%@ page import="com.atlassian.confluence.upgrade.UpgradeTask" %>
<%@ page contentType="text/html; charset=UTF-8" %>

<html>
<head>
    <title>Atlassian Crowd Membership Repair</title>
</head>

<!--
 Applies Crowd Schema changes again, removing any duplicate memberships, and ensuring they can't happen anymore
 on databases that support unique constraints on null columns.
  -->

<body>
<%
    final Logger log = LoggerFactory.getLogger(this.getClass());
    String repair = request.getParameter("repair");
    if (repair == null)
    {
%>
<p>This will remove any duplicate memberships from the cwd_membership table. It will also apply DB constraints (on
    databases that support it) to prevent them being added again.</p>

    <p>
        This should only be necessary if:
    </p>
    <ul>
        <li>You are using Confluence 3.5 - 3.5.5.</li>
        <li>You have duplicate membership rows in the cwd_membership table.</li>
        <li>Subsequent attempts to synchronise with your remote user management system fail with errors about these duplicate rows.</li>
        <li>You have applied the patch for CONF-22541, and cannot revert your system to an old version of Confluence to trigger an upgrade.</li>
    </ul>

    <p>If all of the above are applicable, you can <a href="<%=request.getContextPath()%>/admin/fixcwdmemberships.jsp?repair=start">start repair</a>.</p>
<%
    }
    else
    {
        log.info("Beginning manual repair of duplicate memberships.");
        try
        {
            final UpgradeTask upgradeTask = (UpgradeTask)
                    ContainerManager.getComponent("embeddedCrowdSchemaUpgradeTask");
            final PlatformTransactionManager transactionManager = (PlatformTransactionManager)
                    ContainerManager.getComponent("transactionManager");
            if (upgradeTask != null)
            {
                TransactionDefinition transactionDefinition = new DefaultTransactionAttribute(TransactionDefinition.PROPAGATION_REQUIRED);
                new TransactionTemplate(transactionManager, transactionDefinition).execute(new TransactionCallbackWithoutResult()
                {
                    @Override
                    protected void doInTransactionWithoutResult(TransactionStatus status)
                    {
                        boolean success = false;
                        try
                        {
                            upgradeTask.doUpgrade();
                            success = true;
                        }
                        catch (Exception e)
                        {
                            throw new RuntimeException(e);
                        }
                        finally
                        {
                            if (upgradeTask.getErrors() != null && !upgradeTask.getErrors().isEmpty())
                            {
                                log.error("The following upgrade errors occurred:");
                                for (UpgradeError error : upgradeTask.getErrors())
                                {
                                    log.error(error.getMessage(), error.getError());
                                }
                                // do not mask existing exceptions
                                if (success)
                                {
                                    throw new RuntimeException("Membership repair failed with errors");
                                }
                            }

                        }
                    }
                });
                out.println("Membership repair completed successfully.");
                log.info("Membership repair completed successfully");
            }
            else
            {
                printToJSPWriter(out, "Could not find required upgrade task");
            }
        }
        catch (Exception e)
        {
            log.error("Repair failed", e);
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
        out.println("Membership repair did not complete correctly. Please <a href=\"http://support.atlassian.com\">raise a support issue</a> and copy the following into the description:");
        out.println("<pre>");
        out.println(failureReason);
        out.println("</pre>");
    }
%>