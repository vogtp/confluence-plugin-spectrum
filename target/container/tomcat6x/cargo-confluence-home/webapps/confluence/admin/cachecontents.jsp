<%@ page import="com.atlassian.cache.Cache" %>
<%@ page import="com.atlassian.cache.CacheManager" %>
<%@ page import="com.atlassian.spring.container.ContainerManager" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.Collections" %>
<%@ page import="java.util.Comparator" %>
<%@ page import="java.util.List" %>
<%@ page import="com.atlassian.confluence.util.GeneralUtil" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    CacheManager cacheManager = (CacheManager) ContainerManager.getComponent("cacheManager");
    List<Cache> caches = new ArrayList<Cache>(cacheManager.getCaches());
    Collections.sort(caches, new Comparator<Cache>() {
        public int compare(Cache c1, Cache c2) {
            return new Integer(c2.getKeys().size()).compareTo(c1.getKeys().size());
        }
    });
    String cacheName = request.getParameter("cache");
    Cache cache = null;
    if (cacheName != null)
        cache = cacheManager.getCache(cacheName);
%>
<html>
  <head>
      <title>Confluence cache contents</title>
      <style type="text/css">
        body {
            font-family: Arial, Helvetica, FreeSans, sans-serif;
        }
        table {
            border-collapse: collapse;
        }
        td, th {
            border: 1px solid #ddd;
            padding: 5px 2px;
            margin: 0;
        }
        a, a:visited, a:hover {
            color: #44d;
        }
        li.selected {
            background: #ccf0cc;
        }
        .content {
            margin-left: 400px;
        }
        .selection {
            position: absolute;
            top: 0;
            left: 10px;
            width: 380px;
            font-size: .9em;
        }
        ul {
            padding-left: 1em;
        }
      </style>
  </head>
  <body>
    <div class="content">
    <h1>Confluence cache contents</h1>
    <% if (cache != null) { %>
        <p>Cache: <%= GeneralUtil.htmlEncode(cache.getName()) %> (<%= cache.getKeys().size() %> items)</p>
        <table>
            <thead>
                <tr><th>Key</th><th>Value</th></tr>
            </thead>
            <tbody>
                <% int count = 0; %>
                <% for (Object key : cache.getKeys()) { %>
                    <tr>
                        <td>
                            <%= GeneralUtil.htmlEncode(key.toString()) %>
                            (<abbr title="<%= key.getClass().getName() %>"><%= key.getClass().getSimpleName() %></abbr>)</td>
                        <td>
                            <% final Object value = cache.get(key); %>
                            <% if (value == null) {%>
                    		    NULL
                    	    <% } else { %>
                    		    <%= GeneralUtil.htmlEncode(value.toString()) %>
                                (<abbr title="<%= value.getClass().getName() %>"><%= value.getClass().getSimpleName() %></abbr>)
                    	    <% } %>
                        </td>
                    </tr>
                    <% if (++count > 100) break; %>
                <% } %>
                <% if (count > 100) { %>
                    <tr><td colspan="2">(truncated at 100)</td></tr>
                <% } %>
            </tbody>
        </table>
    <% } else { %>
        <p>No cache selected.</p>
    <% } %>
    </div>
    <div class="selection">
    <h2>Cache selection</h2>
    <p>Select a cache from the list:</p>
    <ul>
        <% for (Cache c : caches) { %>
            <% if (c.getKeys().isEmpty()) continue; %>
            <% String name = c.getName().replaceAll("^(.{10}).*\\.(.*)$", "$1...$2").replaceAll("\\.\\.\\.(.{27}).{3,}", "...$1..."); %>
            <% if (c.getName().equals(cacheName)) { %>
                <li class="selected"><%= GeneralUtil.htmlEncode(name) %> (<%= c.getKeys().size() %>)</li>
            <% } else { %>
                <li><a href="?cache=<%= GeneralUtil.urlEncode(GeneralUtil.htmlEncode(c.getName()), "UTF-8") %>"
                    title="<%= GeneralUtil.htmlEncode(c.getName()) %>"><%= GeneralUtil.htmlEncode(name) %></a>
                    (<%= c.getKeys().size() %>)</li>
            <% } %>
        <% } %>
    </ul>
    </div>
  </body>
</html>
