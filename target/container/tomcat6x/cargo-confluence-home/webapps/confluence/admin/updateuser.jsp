<%@ page import="com.atlassian.spring.container.ContainerManager,
                 com.atlassian.confluence.setup.BootstrapManager,
                 javax.naming.InitialContext,
                 javax.naming.NamingException,
                 javax.sql.DataSource,
                 java.sql.*,
                 java.util.Properties" %>

<%@ page contentType="text/html; charset=UTF-8" %>

<!--
If you want to use this utility to double check your database settings *before* setting
up Confluence you need to set it up within a separate web application in your app. server. -->
<html>
<head>
    <title>Atlassian Database Check Utility</title>
</head>

<body style="text-align:left;">
<%!


    private void updateDatabase(Connection connection)
    {
        Statement statement = null;
        try
        {
            statement = connection.createStatement();
            statement.execute("update os_user set USERNAME = lower( USERNAME )");
            statement.execute("update ATTACHMENTS set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update CONTENT set USERNAME = lower( USERNAME), CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update CONTENTLOCK set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update EMAILTEMPLATES set USERNAME = lower( USERNAME), CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update EXTRNLNKS set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update LINKS set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update NOTIFICATIONS set USERNAME = lower( USERNAME), CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update PAGETEMPLATES set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update SPACEPERMISSIONS set PERMUSERNAME = lower( PERMUSERNAME), CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update SPACES set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            statement.execute("update TRACKBACKLINKS set CREATOR = lower( CREATOR ), LASTMODIFIER = lower( LASTMODIFIER)");
            if (!connection.getAutoCommit())
                connection.commit();
        }
        catch (SQLException e)
        {
            e.printStackTrace();
        }
        finally
        {
            if (statement != null)
                try
                {
                    statement.close();
                }
                catch (Exception e)
                {
                }
        }
    }

    public String hasDuplicateUsers(Connection connection)
    {
        String errorMessage = "";
        PreparedStatement statement = null;
        try
        {
            statement = connection.prepareStatement("SELECT lower(username), COUNT(lower(username)) AS NumOccurrences " +
                "FROM os_user " +
                "GROUP BY lower(username) " +
                "HAVING ( COUNT(lower(username)) > 1 )");

            ResultSet rs = statement.executeQuery();

            // If there are no duplicates
            if (rs.next())
            {
                // Show error message
                errorMessage = "<div>" +
                    "<div style=\"color:red; font-weight:bold;\">Multiple users with the same username found in database.</div>" +
                    "You will need to to delete the duplicates in order to continue with the upgrade.<br/>" +
                    "Following users have duplicate entries:<div style=\"font-weight:bold;\">";

                String username = rs.getString(1);
                errorMessage = errorMessage + username + "<br/>";

                while (rs.next())
                {
                    username = rs.getString(1);
                    errorMessage = errorMessage + username + "<br/>";
                }
                errorMessage = errorMessage + "</div></div>";
            }
        }
        catch (SQLException e)
        {
            e.printStackTrace();
        }
        finally
        {
            if (statement != null)
                try
                {
                    statement.close();
                }
                catch (Exception e)
                {
                }
        }
        return errorMessage;
    }


     public String hasMixedCaseEntries(Connection connection)
    {
        String errorMessage = "";
        PreparedStatement statement = null;
        try
        {
            statement = connection.prepareStatement("SELECT lower(username) " +
                "FROM os_user " +
                "WHERE username <> lower(username)");

            ResultSet rs = statement.executeQuery();

            // If there are no duplicates
            if (rs.next())
            {
                // Show error message
                errorMessage = "<div>" +
                    "<div style=\"color:red; font-weight:bold;\">MixedCased usernames found in the database.</div>" +
                    "Perform the database upgrade by clicken the button below.<br/>";

                 errorMessage = errorMessage + "<div style=\"margin-bottom:20px; margin-top:20px\">\n" +
                    "<form method=\"POST\" action=\"updateuser.jsp\">\n" +
                    "<input type=\"hidden\" name=\"operation\" value=\"update\"/>\n" +
                    "<input type=\"submit\" value=\"Perform Database Update\"/>\n" +
                    "</form>\n" +
                    "</div>";

                String username = rs.getString(1);
                errorMessage = errorMessage + username + "<br/>";

                while (rs.next())
                {
                    username = rs.getString(1);
                    errorMessage = errorMessage + username + "<br/>";
                }
                errorMessage = errorMessage + "</div></div>";
            }
            else
            {
                // Show Update Button
                errorMessage = "<div><strong class=\"good\">Your database contains no invalid usernames.</strong></div>" +
                    "<div style=\"margin-top:50px\"><strong>Note:</strong> If you have a case insensitive Database (e.g. MySQL) this test won't work and you should perform the upgrade to be sure you data is valid.<br />" +
                    "<a href=\"?operation=upgrade\">Click here</a></div>";
            }
        }
        catch (SQLException e)
        {
            e.printStackTrace();
        }
        finally
        {
            if (statement != null)
                try
                {
                    statement.close();
                }
                catch (Exception e)
                {
                }
        }
        return errorMessage;
    }


%>

<%!
    private Connection getDatabaseConnection()
    {
        BootstrapManager bootstrapManager = (BootstrapManager) ContainerManager.getInstance().getContainerContext().getComponent("bootstrapManager");
        Properties hibernateConfig = bootstrapManager.getHibernateProperties();

        Connection connection = null;

        if (hibernateConfig.containsKey("hibernate.connection.datasource"))
        {
            // Datasource connection
            String datasource = hibernateConfig.getProperty("hibernate.connection.datasource");

            try
            {
                InitialContext ctx = new InitialContext();
                DataSource dsrc = (DataSource) ctx.lookup(datasource);
                connection = dsrc.getConnection();
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }
            catch (NamingException e)
            {
                e.printStackTrace();
            }
        }

        else
        {
            //JDBC Connection
            String driverStr = hibernateConfig.getProperty("hibernate.connection.driver_class");
            String jdbcURL = hibernateConfig.getProperty("hibernate.connection.url");
            String username = hibernateConfig.getProperty("hibernate.connection.username");
            String password = hibernateConfig.getProperty("hibernate.connection.password");

            try
            {
                connection = DriverManager.getConnection(jdbcURL, username, password);
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }
        }
        return connection;
    }


%>

<div style="text-align: left; margin-left: 20px;">


    <h1>Atlassian Confluence</h1>

    <h3>Database User Upgrade</h3>

    <p>Due to a bug in Confluence, usernames were case sensitive. This might introduce problems when a username is used
        twice (e.g. user and User).</p>

    <p>This JSP will lowercase all users in you database to eliminate those problems.</p>


    <%

        String operation = request.getParameter("operation");

        //String operation = request.getParameter("operation");
        Connection connection = getDatabaseConnection();

        try
        {
            if (operation == null)
            {
                out.print(hasDuplicateUsers(connection));
                out.print(hasMixedCaseEntries(connection));
            }
            else
            {
                updateDatabase(connection);
                out.println("<em class=\"good\">Database Update successful</em>");
            }
        }
        finally
        {
            try
            {
                connection.close();
            }
            catch (SQLException e)
            {
                e.printStackTrace();
            }
        }
    %>


</div>

</body>
</html>