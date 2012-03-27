<%@ page import="com.atlassian.config.util.BootstrapUtils,
                 com.atlassian.confluence.cluster.ClusterInformation,
                 com.atlassian.confluence.cluster.ClusterManager,
                 com.atlassian.confluence.jmx.RequestMetrics,
                 com.atlassian.confluence.plugin.persistence.PluginData,
                 com.atlassian.confluence.plugin.persistence.PluginDataDao,
                 com.atlassian.confluence.status.SystemErrorInformationLogger,
                 com.atlassian.confluence.status.service.SystemInformationService,
                 com.atlassian.confluence.status.service.systeminfo.ConfluenceInfo,
                 com.atlassian.confluence.status.service.systeminfo.DatabaseInfo" %>
<%@ page import="com.atlassian.confluence.status.service.systeminfo.MemoryInfo"%>
<%@ page import="com.atlassian.confluence.util.GeneralUtil"%>
<%@ page import="com.atlassian.confluence.util.I18NSupport"%>
<%@ page import="com.atlassian.confluence.util.PatternLayoutWithStackTrace"%>
<%@ page import="com.atlassian.core.logging.DatedLoggingEvent"%>
<%@ page import="com.atlassian.core.logging.ThreadLocalErrorCollection"%>
<%@ page import="com.atlassian.plugin.Plugin"%>
<%@ page import="com.atlassian.plugin.PluginInformation"%>
<%@ page import="com.atlassian.seraph.auth.DefaultAuthenticator"%>
<%@ page import="com.atlassian.spring.container.ContainerManager"%>
<%@ page import="org.apache.commons.lang.StringUtils" %>
<%@ page import="org.apache.log4j.spi.LoggingEvent" %>
<%@ page import="org.apache.velocity.exception.MethodInvocationException" %>
<%@ page import="java.io.BufferedReader" %>
<%@ page import="java.io.PrintWriter"%>
<%@ page import="java.io.StringReader" %>
<%@ page import="java.lang.reflect.InvocationTargetException" %>
<%@ page import="java.security.Principal" %>
<%@ page import="java.text.DateFormat" %>
<%@ page import="java.util.Date" %>
<%@ page import="java.util.Enumeration" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Locale" %>
<%@ page import="java.util.Map" %>
<%@ page import="java.util.UUID" %>
<%@ page isErrorPage="true" %>
<% String context = request.getContextPath(); %>
<% try { %>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Oops - an error has occurred</title>
    <link rel="stylesheet" href="<%= context %>/includes/css/setup.css" type="text/css">
    <script type="text/javascript" src="<%= context %>/includes/js/cookieUtils.js"></script>
</head>
<body>
<div id="PageContent">
<h1>
    <a href="<%= context %>/">
            <img src="<%= context %>/images/logo/confluence_48_white.png" alt="logo" title="Confluence">
    </a>
    System Error
</h1>

<div id="sysErrPanel" class="panel">
    <p>
        A system error has occurred &mdash; our apologies!
    </p>
    <p>
        For immediate troubleshooting, consult our <strong><a href="<%= I18NSupport.getText("url.confluence.knowledge.base") %>">knowledge base</a></strong> for a solution.
    </p>
    <p>
        If you would like to receive support from Atlassian's support team, ask your
        <strong><a href="<%= context %>/contactadministrators.action">Confluence administrator</a></strong> to create a support issue on <a href="<%= I18NSupport.getText("url.support") %>">Atlassian's support system</a> with the following information:
    </p>
    <ol>
        <li>a description of your problem and what you were doing at the time it occurred</li>
        <li>a copy of the error and system information found below</li>
        <li>a copy of the application logs (if possible).</li>
    </ol>
    <p>
        Your Confluence administrator can use the
        <strong><a href="<%= context %>/admin/raisesupportrequest.action">support request form</a></strong>
        to create a support ticket which will include this information.
    </p>
    <p>
        We will respond as promptly as possible.<br>
        Thank you!
    </p>
    <p>
        <a href="<%= context %>/"><strong>Return to site homepage&hellip;</strong></a>
    </p>
</div>

        <%
        	UUID uniqueID = UUID.randomUUID();  // enable an easy mapping between this page and the error log.
        	SystemErrorInformationLogger logAction = new SystemErrorInformationLogger(uniqueID, pageContext.getServletContext(), request);
            logAction.writeToLog(false);
            RequestMetrics.incrementErrorCount();


            SystemInformationService sysInfoService = null;
            PluginDataDao pluginDataDao = null;
            Throwable sysInfoRetrievalFailure = null;
            try
            {
                sysInfoService = ((SystemInformationService) ContainerManager.getInstance().getContainerContext().getComponent("systemInformationService"));
                pluginDataDao = (PluginDataDao) ContainerManager.getInstance().getContainerContext().getComponent("pluginDataDao");
            }
            catch (Throwable t)
            {
                sysInfoRetrievalFailure = t;
            }           
            
            // These variables are kept at a high scope to simplify the complexity of following scope in a
        	// JSP like this one.
        	//
            // sysInfoService being null will be used as a the check as to whether we should expect
            // non-null in any of these variables.
        	Map sysinfo = null;
        	Map buildstats = null;
        	MemoryInfo memoryInfo = null;
        	DatabaseInfo dbInfo = null;
        	ConfluenceInfo confluenceInfo = null;
        	boolean isOrion = false;

        	if (sysInfoService != null)
        	{
	        	confluenceInfo = sysInfoService.getConfluenceInfo();
	        	memoryInfo = sysInfoService.getMemoryInfo();
	        	dbInfo = sysInfoService.getSafeDatabaseInfo();
                sysinfo = GeneralUtil.convertBeanToMap(sysInfoService.getSystemProperties());
	            buildstats = GeneralUtil.convertBeanToMap(confluenceInfo);

	            // remove the properties that we don't want to display in the maps
	            buildstats.remove("enabledPlugins");
	    		buildstats.remove("startTime");
                buildstats.remove("globalSettings");

	    		isOrion = "Orion".equals(sysinfo.get("appServer"));
        	}
        	else
        	{
        		out.println("The SystemInformationService could not be retrieved from the container.");
        		out.println("Therefore very limited information is available in this error report. <br>");
                if (sysInfoRetrievalFailure != null)
                {%>The SystemInformationService could not be retrieved due to the following error:
                   <%= GeneralUtil.htmlEncode(String.valueOf(sysInfoRetrievalFailure)) %><br><%                 
                }
            }
        %>

    <%
        String uri = (String)request.getAttribute("javax.servlet.error.request_uri");
        if(uri != null && uri.contains("editpage"))
        {
            String editDraft = context + "/pages/editpage.action?useDraft=true&pageId=" + request.getParameter("pageId");
            %>
            <div class="panel warning">
                <img id="draftNote" alt="" src="<%= context %>/images/icons/emoticons/warning.png">
                You can <a href="<%= editDraft %>">resume editing</a> the most recently saved draft of your page.
            </div>
        <% 
        }
    %>

    <h3>Cause</h3>
    <%
        String ex = (String) request.getAttribute("javax.servlet.error.message");
        if (isOrion)
        {
            //get the first line of the error message for the "cause:"
            String line = (ex == null) ? "No exception" : new BufferedReader(new StringReader(ex)).readLine();
        %>
        <p><%= GeneralUtil.htmlEncode(line) %></p>
        <%
        }
        else
        {
            Throwable throwable = exception;
            String causedBy = "";
            while (throwable != null)
            {
                String at = throwable.getStackTrace().length > 0 ? throwable.getStackTrace()[0].toString() : "Unknown location";
            %>
            <p>
                <%= causedBy %><%= GeneralUtil.htmlEncode(String.valueOf(throwable)) %><br>
                &nbsp;&nbsp;&nbsp;&nbsp;at <%= GeneralUtil.htmlEncode(at) %>
            </p>
            <%
                causedBy = "caused by: ";
                if (throwable instanceof InvocationTargetException)
                {
                    throwable = ((InvocationTargetException)throwable).getTargetException();
                }
                else if (throwable instanceof MethodInvocationException)
                {
                    throwable = ((MethodInvocationException)throwable).getWrappedThrowable();
                }
                else if (throwable instanceof ServletException)
                {
                    throwable = ((ServletException)throwable).getRootCause();
                }
                else
                {
                    throwable = throwable.getCause();
                }
            }
        }
        %>

        <h4>Stack Trace:<span class="switch" id="stacktrace-switch" onclick="toggle('stacktrace')">[hide]</span></h4>

        <% if (isOrion) { %>
        <pre id="stacktrace"><%= GeneralUtil.htmlEncode(ex) %></pre>
        <% } else { %>
        <pre id="stacktrace"><%
            StringBuffer sb = new StringBuffer();
            PatternLayoutWithStackTrace.appendStackTrace(sb, exception);
            out.print(GeneralUtil.htmlEncode(sb.toString()));
        %>
        </pre>
        <% } %>

        <h3>Referer URL</h3>
        <p><%= request.getHeader("Referer") != null ? GeneralUtil.htmlEncode(request.getHeader("Referer")) : "Unknown" %></p>

        <% if ((sysInfoService != null) && sysInfoService.isShowInfoOn500()) {%>
            <h3>Confluence Application Information</h3>
            <h4>Build Information</h4>
            <p>
            <%  if (buildstats != null) {
                    for (Iterator it = buildstats.entrySet().iterator(); it.hasNext();)
                    {
                        Map.Entry entry = (Map.Entry) it.next();
            %>
                    <%= entry.getKey() %>: <%= entry.getValue() %><br>
            <%      }
                } else { %>
                No build information available.
            <%  } %>
                Unique ID: <%= uniqueID.toString()%>
            </p>

            <h4>Server information</h4>
            <p>
                Application Server: <%= application.getServerInfo() %><br>
                Servlet Version: <%= application.getMajorVersion() %>.<%= application.getMinorVersion() %><br>
                <% if (dbInfo != null) { %>
                    Database Dialect: <%= dbInfo.getDialect() %><br>
                    Database Driver Name: <%= dbInfo.getDriverName() %><br>
                <% } else { %>
                    No database information available.
                <% } %>
            </p>

            <h4>Memory Information</h4>
            <p>
            <% if (memoryInfo != null) { %>
                Maximum Heap: <%= memoryInfo.getMaxHeap().megabytes() %> MB<br>
                Allocated Heap: <%= memoryInfo.getAllocatedHeap().megabytes() %> MB<br>
                Used Memory: <%= memoryInfo.getUsedHeap().megabytes() %> MB<br>
                Unused Allocated Memory: <%= memoryInfo.getFreeAllocatedHeap().megabytes() %> MB<br>
                Available Memory: <%= memoryInfo.getAvailableHeap().megabytes() %> MB<br>
                <br>
                Maximum Permgen: <%= memoryInfo.getMaxPermGen().megabytes()%> MB<br>
                Used Permgen: <%= memoryInfo.getUsedPermGen().megabytes()%> MB<br>
            <% } else { %>
                No memory information available.
            <%	} %>
            </p>

            <h4>System Information</h4>
            <p>
            <%  if (sysinfo != null) {
                    for (Iterator it = sysinfo.entrySet().iterator(); it.hasNext();)
                    {
                        Map.Entry entry = (Map.Entry) it.next();
                    %>
                        <%= entry.getKey() %>: <%= entry.getValue() %><br>
            <%      }
                } else { %>
                No system information available.
            <%  } %>
            </p>

            <% if (BootstrapUtils.getBootstrapManager().getHibernateConfig().isHibernateSetup()) {%>
                <h4>Cluster Information</h4>
                <% try { %>
                    <% ClusterManager clusterManager = (ClusterManager) ContainerManager.getComponent("clusterManager"); %>
                    <% if (!clusterManager.isClustered()) { %>
                            <p>Not clustered.</p>
                    <% } else { %>
                        <% ClusterInformation clusterInformation = clusterManager.getClusterInformation(); %>
                        <p>
                            Name: <%= GeneralUtil.htmlEncode(clusterInformation.getName())%> <br>
                            Description: <%= GeneralUtil.htmlEncode(clusterInformation.getDescription())%> <br>
                            Members:<br>
                            <%
                                for (Iterator it = clusterInformation.getMembers().iterator(); it.hasNext();)
                                {
                            %>
                                    - <%= GeneralUtil.htmlEncode(String.valueOf(it.next())) %><br>
                            <%  } %>
                        </p>
                   <% } %>
                <% } catch (Throwable t) { %>
                    <p>Error reporting cluster information: <%= GeneralUtil.htmlEncode(t.toString()) %></p>
                <% } %>
            <% } %>

            <h3>Plugins</h3>
            <ul class="plugins">
            <%  if (confluenceInfo != null) {
                    DateFormat format = DateFormat.getDateInstance(DateFormat.MEDIUM, Locale.US);
                    try
                    {
                        for (Iterator it = confluenceInfo.getEnabledPlugins().iterator(); it.hasNext();)
                        {
                            Plugin plugin = (Plugin) it.next();
                            PluginInformation pluginInfo = plugin.getPluginInformation();
                            String pluginName = plugin.getName();
                            String pluginKey = plugin.getKey();
                            String pluginVersion = pluginInfo == null ? "N/A" : pluginInfo.getVersion();
                            if (pluginVersion == null) // sometimes the version isn't defined by the plugin
                                pluginVersion = "N/A";

                            String lastModifiedStr = pluginDataDao == null ? "unknown" : "bundled";
                            if (pluginDataDao != null && pluginDataDao.pluginDataExists(pluginKey))
                            {
                                PluginData pluginData = pluginDataDao.getPluginData(pluginKey);
                                Date lastModified = pluginData != null ? pluginData.getLastModificationDate() : null;
                                if (lastModified != null)
                                {
                                    lastModifiedStr = format.format(lastModified);
                                }
                            }
            %>
                            <li><%= GeneralUtil.htmlEncode(pluginName) %> (<%= GeneralUtil.htmlEncode(pluginKey) %>, Version: <%= pluginVersion %>, Installed: <%= lastModifiedStr %>) </li>
            <%          }
                    } catch (Exception e) { %>
                        <li>Error retrieving plugin information: <%= GeneralUtil.htmlEncode(e.toString()) %></li>
            <%      }
                } else { %>
                    <li>No plugin information available.</li>
            <%  } %>
            </ul>

            <h3>Request</h3>
            <%
                try {
            %>
            <h4>Information</h4>
            <dl>
                <dt>URL</dt><dd><%= GeneralUtil.htmlEncode(request.getRequestURL().toString()) %>
                <dt>URI</dt><dd><%= GeneralUtil.htmlEncode(request.getRequestURI()) %>
                <dt>Context Path</dt><dd><%= request.getContextPath() %></dd>
                <dt>Servlet Path</dt><dd><%= request.getServletPath() %></dd>
                <% if (StringUtils.isNotBlank(request.getPathInfo())) { %>
                    <dt>Path Info</dt><dd><%= GeneralUtil.htmlEncode(request.getPathInfo()) %></dd>
                <% } %>
                <% if (StringUtils.isNotBlank(request.getQueryString())) { %>
                <dt>Query String</dt><dd><%= GeneralUtil.htmlEncode(request.getQueryString()) %></dd>
                <% } %>
            </dl>
            <h4>Headers (Limited subset)</h4>
            <dl>
            <%
                String[] headers = new String[]{"host", "x-forwarded-for", "user-agent", "keep-alive",
                    "connection", "cache-control", "if-modified-since", "if-none-match"};
                for (int i = 0; i < headers.length; i++)
                {
                    String name = headers[i];
                    Enumeration headerValues = request.getHeaders(name);
                    if (headerValues == null || !headerValues.hasMoreElements()) continue;
            %>
                    <dt><%= GeneralUtil.htmlEncode(name) %></dt>
            <%
                    while (headerValues.hasMoreElements())
                    {
            %>
                    <dd><%= GeneralUtil.htmlEncode(String.valueOf(headerValues.nextElement()))%></dd>
            <%
                    }
                }
            %>
            </dl>
            <h4>Attributes</h4>
            <dl>
            <%
                for (Enumeration attributeNames = request.getAttributeNames(); attributeNames.hasMoreElements();)
                {
                    String name = String.valueOf(attributeNames.nextElement());
                %>
                    <dt><%= GeneralUtil.htmlEncode(name) %></dt>
                    <dd><%= GeneralUtil.htmlEncode(String.valueOf(request.getAttribute(name)))%></dd>
                <%
                }
            %>
            </dl>
            <h4>Parameters (Limited subset)</h4>
            <dl>
            <%
                for (Enumeration parameterNames = request.getParameterNames(); parameterNames.hasMoreElements();)
                {
                    String name = String.valueOf(parameterNames.nextElement());
                    if (name.contains("pass")) continue;
                %>
                <dt><%= GeneralUtil.htmlEncode(name) %></dt>
                <%
                    String[] parameterValues = request.getParameterValues(name);
                    for (int i = 0; i < parameterValues.length; i++)
                    {
                        %>
                        <dd><%= GeneralUtil.htmlEncode(parameterValues[i]) %></dd>
                        <%
                    }
                }
            %>
            </dl>
            <h3>Confluence User</h3>
            <%
                Object loggedInValue = session.getAttribute(DefaultAuthenticator.LOGGED_IN_KEY);
                String username = null;
                if ((loggedInValue != null) && (loggedInValue instanceof Principal))
                {
                    username = ((Principal)loggedInValue).getName();
                }
                else
                {
                    username = "unknown";
                }
            %>
            <p>
                <%= username %>
            </p>

            <%
                }
                catch (Throwable t)
                {
                    out.println("Error rendering logging information - uh oh.");
                    t.printStackTrace(new PrintWriter(out));
                }
            %>

        <%  List events = ThreadLocalErrorCollection.getList();
            if (events != null && !events.isEmpty()) { %>
            <h3>Logging:</h3>
            <%  try { %>
                <p><%= events.size() %> log statements generated by this request:</p>
                <%
                    for (Iterator it = events.iterator(); it.hasNext();)
                    {
                        Object event = it.next();
                        if (event instanceof DatedLoggingEvent) {
                            DatedLoggingEvent dle = (DatedLoggingEvent) event;
                            LoggingEvent loggingEvent = dle.getEvent();
                            Date date = dle.getDate();
                    %>
                        <div class="logStatement">
                            <em class="bad">[<%= GeneralUtil.htmlEncode(loggingEvent.getLevel().toString()) %>]</em>
                            <%= GeneralUtil.htmlEncode(date.toString()) %>
                            [<%= GeneralUtil.htmlEncode(loggingEvent.getLoggerName()) %>]
                            <%= GeneralUtil.htmlEncode(loggingEvent.getRenderedMessage()) %>
                            <br>
                            <% if (loggingEvent.getThrowableInformation() != null) { %>
                                <div class="logThrowable">
                                    <strong>Throwable:</strong><br>
                                    <%
                                        for (int i = 0; i < loggingEvent.getThrowableStrRep().length && i < 20; i++)
                                        {
                                            String s = loggingEvent.getThrowableStrRep()[i];
                                            out.println("" +GeneralUtil.htmlEncode(s) + "<br>");
                                        }
                                    %>
                                </div>
                        <% } %>
                        </div>
                    <%} else { %>
                        <%= GeneralUtil.htmlEncode(event.getClass().toString()) %>: <%= GeneralUtil.htmlEncode(event.toString()) %>
                    <% } %>
                <% } %>
            <% } catch (Throwable t) { %>
                <div class="error">
                    <div class="errorMessage" style="font-weight: bold;">Error rendering logging information - uh oh.</div>
                    <pre>
                        <% t.printStackTrace(new PrintWriter(out)); %>
                    </pre>
                </div>
            <% } %>
        <% } %>
    <% } %>
</div>
</body>
</html>
<%
    }
    finally
    {
        out.flush();
    }
%>