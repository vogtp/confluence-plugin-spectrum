<%@ page import="com.atlassian.confluence.user.UserAccessor" %>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.List" %>
<%@ page import="com.atlassian.confluence.mail.notification.NotificationCaseFixer" %>
<%@ page import="net.sf.hibernate.SessionFactory" %>
<%@ page import="net.sf.hibernate.Session" %>
<%@ page import="org.springframework.orm.hibernate.SessionFactoryUtils" %>
<%@ page import="com.atlassian.confluence.mail.notification.Notification" %>
<%@ page import="net.sf.hibernate.Transaction" %>
<%

    String doFix = request.getParameter("doFix");

    if (doFix != null)
    {
        out.println("<p>Starting notifications fix ... changes will only be committed after all records have been processed.</p>");

        UserAccessor userAccessor = (UserAccessor) ContainerManager.getComponent("userAccessor");
        SessionFactory sessionFactory = (SessionFactory) ContainerManager.getComponent("sessionFactory");
		Session sess = SessionFactoryUtils.getSession(sessionFactory, true);
        Transaction tx = sess.beginTransaction();
        NotificationCaseFixer caseFixer = new NotificationCaseFixer(userAccessor, sess, out);

        List notifications = sess.find("from Notification notification");
		for (Iterator iterator = notifications.iterator(); iterator.hasNext();)
		{
			caseFixer.fix((Notification) iterator.next());
		}
        tx.commit();

        out.println("<p>Notifications fix complete.</p>");
    }
    else
    {
%>

<form action="fixCaseInNotifications.jsp" id="fixCaseInNotifications" method="post">
    This JSP will fix the case of your notifications. Do you wish to proceed?
    <p/>
    <input type="hidden" name="doFix" value="true"/>
    <input type="submit" value="Proceed"/>
</form>

<%
    }

%>