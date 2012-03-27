<%@ page import="com.atlassian.config.ConfigurationException,
                 com.atlassian.confluence.core.ConfluenceSidManager,
                 com.atlassian.johnson.JohnsonEventContainer,
                 com.atlassian.johnson.event.Event,
                 com.atlassian.spring.container.ContainerManager"%>
<%@ page import="java.util.Collection" %>
<%@ page import="java.util.Iterator" %>

<html>
<head>
    <title>Errors</title>
    <style type="text/css">
        body {
            font-family: Arial, Helvetica, FreeSans, sans-serif;
        }

        h1 {
            color: #003366; 
        }

        table.error {
            width: 100%;
            border: 1px solid #ccc;
            border-collapse: collapse;
        }

        table.error td, table.error th {
            padding: 10px;
            border: 1px solid #ccc;
            vertical-align: top;
            line-height: 16pt; 
        }

        table.error th {
            text-align: left;
        }

        table.error tr.header {
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>

<h1><img src="<%= request.getContextPath() %>/images/logo/confluence_48_white.png" alt="Confluence Logo" align="absmiddle"> Confluence</h1>

        <%
                String sid = null;
                if (ContainerManager.isContainerSetup())
                {
                    ConfluenceSidManager sidManager = (ConfluenceSidManager) ContainerManager.getComponent("sidManager");
                    try
                    {
                        sid = sidManager.getSid();
                    }
                    catch (ConfigurationException e)
                    {
                        // ignore, we just don't want this to bomb out this page 
                    }
                }

                JohnsonEventContainer appEventContainer = JohnsonEventContainer.get(pageContext.getServletContext());
                //if there are Events outstanding then set the HTTP return code to 500 Internal Server Error
                if (appEventContainer != null && appEventContainer.hasEvents())
                {
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.flushBuffer(); // needed otherwise an exception is thrown
                }
                //if there are Events outstanding then display them in a table
                if (appEventContainer != null && appEventContainer.hasEvents())
                {
            %>
                        <content tag="headsection">
                            <meta http-equiv="Refresh" content="60;"/>
                        </content>
                        
                    <p>You cannot access Confluence at present. Look at the table below to identify the reasons.</p>

                    <table class="error">

                        <tr class="header">
                            <th>Type</th>
                            <th width=40%>Description</th>
                            <th width=40%>Exception</th>
                            <th>Level</th>
                            <th nowrap>Time</th>
                        </tr>

                        <%
                            Collection events  = appEventContainer.getEvents();
                            for (Iterator iterator = events.iterator(); iterator.hasNext();)
                            {
                                Event event = (Event) iterator.next();

                                %>
                                <tr bgcolor="#fffff0">
                                    <td nowrap><%=event.getKey() == null ? "" : event.getKey().getType()%></td>
                                    <%-- See: DefaultUpgradeManager.runUpgradePrerequisites for a description of the $CONTEXT token --%>
                                    <td><%=event.getDesc().replaceAll("\\$CONTEXT",request.getContextPath())%><br/><br/><%= (sid == null ? " No server id found." : " Your server id is: <strong>" + sid + "</strong>") %></td>
                                    <td><pre><%=event.getException() == null ? "" : event.getException()%></pre></td>
                                    <td nowrap><%=event.getLevel() == null ? "" : event.getLevel().getLevel()%> </td>
                                    <td nowrap><%=event.getDate()%></td>
                                </tr>
                                <%
                                }

                            %>
                    </table>

                    <p>This page will automatically update every 60 seconds.</p>

                <% } else { %>
                    <p>This instance of Confluence is now ready to use again. Go to the <a href="<%= request.getContextPath() + "/" %>">Homepage</a>.</p>
                 <% } %>
    </body>
</html>
