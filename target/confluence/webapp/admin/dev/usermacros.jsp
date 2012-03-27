<%@ page language="java" autoFlush="true"
    contentType="text/html; charset=ISO-8859-1"
    pageEncoding="ISO-8859-1"%>

<%@ page import="com.atlassian.cache.CacheManager"%>
<%@ page import="com.atlassian.confluence.setup.bandana.ConfluenceBandanaContext"%>
<%@ page import="com.atlassian.confluence.setup.bandana.ConfluenceBandanaKeys"%>
<%@ page import="com.atlassian.confluence.setup.bandana.ConfluenceBandanaRecord"%>
<%@ page import="com.atlassian.confluence.setup.bandana.persistence.dao.ConfluenceBandanaRecordDao" %>
<%@ page import="com.atlassian.confluence.util.GeneralUtil" %>
<%@ page import="com.atlassian.spring.container.ContainerManager"%>
<%@ page import="org.springframework.transaction.PlatformTransactionManager" %>
<%@ page import="org.springframework.transaction.TransactionStatus" %>
<%@ page import="org.springframework.transaction.support.TransactionCallbackWithoutResult" %>
<%@ page import="org.springframework.transaction.support.TransactionTemplate" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
    <title>User Macros</title>
</head>
<body>
<%
    final ConfluenceBandanaRecordDao bandanaDao = (ConfluenceBandanaRecordDao) ContainerManager.getComponent("confluenceBandanaRecordDao");

    final String userMacroXml = request.getParameter("userMacroXml");
    String result = "";
    if (userMacroXml != null)
    {
        TransactionTemplate tt = new TransactionTemplate();
        tt.setTransactionManager((PlatformTransactionManager) ContainerManager.getInstance().getContainerContext().getComponent("transactionManager"));

        tt.execute(new TransactionCallbackWithoutResult()
        {
            protected void doInTransactionWithoutResult(TransactionStatus transactionStatus)
            {
                bandanaDao.saveOrUpdate(new ConfluenceBandanaRecord(new ConfluenceBandanaContext().getContextKey(), ConfluenceBandanaKeys.USER_MACROS, userMacroXml));
                CacheManager cacheManager = (CacheManager) ContainerManager.getComponent("cacheManager");
                cacheManager.flushCaches();
            }
        });
    }

    final ConfluenceBandanaRecord record = bandanaDao.getRecord(new ConfluenceBandanaContext().getContextKey(), ConfluenceBandanaKeys.USER_MACROS);
    String value = record != null ? record.getValue() : "";
%>

<form name="usermacrosform" id="usermacrosform" action="usermacros.jsp" method="post">
    <textarea rows="30" cols="150" name="userMacroXml"><%= GeneralUtil.htmlEncode(value) %></textarea>
    <br/>
    <input type="submit" name="action" value="Save"></form>
</body>
</html>
