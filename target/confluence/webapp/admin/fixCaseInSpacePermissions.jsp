<%@ page import="com.atlassian.confluence.security.SpacePermission" %>
<%@ page import="com.atlassian.confluence.security.SpacePermissionCaseFixer" %>
<%@ page import="com.atlassian.confluence.security.SpacePermissionManager" %>
<%@ page import="com.atlassian.confluence.security.persistence.dao.SpacePermissionDao" %>
<%@ page import="com.atlassian.confluence.spaces.Space" %>
<%@ page import="com.atlassian.confluence.spaces.SpaceManager" %>
<%@ page import="com.atlassian.confluence.user.UserAccessor" %>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="net.sf.hibernate.Session" %>
<%@ page import="net.sf.hibernate.SessionFactory" %>
<%@ page import="org.springframework.orm.hibernate.HibernateCallback" %>
<%@ page import="org.springframework.orm.hibernate.HibernateTemplate" %>
<%@ page import="java.util.List" %>
<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.lang.reflect.Proxy" %>
<%@ page import="java.lang.reflect.InvocationHandler" %>
<%@ page import="java.lang.reflect.Method" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%
    final PrintWriter output = new PrintWriter(out); // can't use 'out' in the inner class
    String doFix = request.getParameter("doFix");

    if (doFix != null)
    {
        output.println("<p>Starting space permissions fix ...</p>");

        final UserAccessor userAccessor = (UserAccessor) ContainerManager.getComponent("userAccessor");
        final SpacePermissionManager spacePermissionManager = (SpacePermissionManager) ContainerManager.getComponent("spacePermissionManager");
        final SpacePermissionDao spacePermissionDao = (SpacePermissionDao) ContainerManager.getComponent("spacePermissionDao");
        final SpaceManager spaceManager = (SpaceManager) ContainerManager.getComponent("spaceManager");

        final SessionFactory sessionFactory = (SessionFactory) ContainerManager.getComponent("sessionFactory");
        HibernateTemplate hibernateTemplate = new HibernateTemplate(sessionFactory);

        // ensure session is open for entirety of process
        hibernateTemplate.execute(new HibernateCallback() {
            public Object doInHibernate(Session session)
            {
                SpacePermissionCaseFixer caseFixer = new SpacePermissionCaseFixer(userAccessor, spacePermissionManager, output);

                // fix space permissions
                List<Space> spaces = spaceManager.getAllSpaces();
                for (Space space : spaces)
                {
                    List<SpacePermission> spacePermissions = spacePermissionDao.findPermissionsForSpace(space);
                    for (SpacePermission spacePermission : spacePermissions)
                    {
                        caseFixer.fix(spacePermission);
                    }
                }

                // fix global permissions
                List<SpacePermission> globalPermissions = spacePermissionManager.getGlobalPermissions();
                for (SpacePermission globalPermission : globalPermissions)
                {
                    caseFixer.fix(globalPermission);
                }

                output.println("<p>Space permissions fix complete.</p>");

                return null;
            }
        });
    }
    else
    {
%>

<form action="fixCaseInSpacePermissions.jsp" id="fixCaseInSpacePermissions" method="post">
    <p>This JSP will fix the case of your space permissions. Do you wish to proceed?</p>
    <p>
        <input type="hidden" name="doFix" value="true"/>
        <input type="submit" value="Proceed"/>
    </p>
</form>

<%
    }
%>