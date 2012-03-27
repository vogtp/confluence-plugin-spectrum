package ch.unibas.urz.confluence.spectrum;

import java.util.Map;
import java.util.List;


import ch.almana.spectrum.rest.access.AlarmModelAccess;
import ch.almana.spectrum.rest.model.GenericModel;
import ch.almana.spectrum.rest.model.SpectrumAttibute;
import ch.almana.spectrum.rest.net.HttpClientRequestHandler;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.pages.PageManager;
import com.atlassian.confluence.pages.Page;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.spaces.SpaceManager;
import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.user.User;
import com.opensymphony.util.TextUtils;

/**
 * This very simple macro shows you the very basic use-case of displaying *something* on the Confluence page where it is used.
 * Use this example macro to toy around, and then quickly move on to the next example - this macro doesn't
 * really show you all the fun stuff you can do with Confluence.
 */
public class ExampleMacro implements Macro
{

    private final SettingsManager settingsManager;

	// We just have to define the variables and the setters, then Spring injects the correct objects for us to use. Simple and efficient.
    // You just need to know *what* you want to inject and use.


    public ExampleMacro(SettingsManager settingsManager)
    {
        this.settingsManager = settingsManager;
    }

    /**
     * This method returns XHTML to be displayed on the page that uses this macro
     * we just do random stuff here, trying to show how you can access the most basic
     * managers and model objects. No emphasis is put on beauty of code nor on
     * doing actually useful things :-)
     */
    @Override
    public String execute(Map<String, String> parameters, String body, ConversionContext context) throws MacroExecutionException
    {
    	
        // in this most simple example, we build the result in memory, appending HTML code to it at will.
        // this is something you absolutely don't want to do once you start writing plugins for real. Refer
        // to the next example for better ways to render content.
        StringBuffer result = new StringBuffer();
        result.append("Username: ").append(settingsManager.getPluginSettings("username"));
        
        for (String key : parameters.keySet()) {
			result.append("<p />").append(key).append(": ").append(parameters.get(key)).append("<p />");
		}
        
		RequestConfig settings = new RequestConfig(parameters);
		HttpClientRequestHandler requestHandler = new HttpClientRequestHandler(settings);
		AlarmModelAccess ama = new AlarmModelAccess(requestHandler );
		Map<String, GenericModel> alarms;
		try {
			alarms = ama.getEntities(ama.getList());
	        result.append("<p>");
	        result.append("Spectrum alarms on:").append(settings.getSpectroServerName());
	        result.append("<p>");
	        result.append("<table class=\"confluenceTable\">");
	        result.append("<thead><tr><th class=\"confluenceTh\">Alarm Title</th><th class=\"confluenceTh\">Model Name</th></tr></thead>");
	        result.append("<tbody>");
	        for (GenericModel model : alarms.values())
	        {
	        	Map<String, String> attrs = model.getAttributes();
	            String pageWithChildren = "<tr><td class=\"confluenceTd\">" + attrs.get(SpectrumAttibute.ALARM_TITLE) + "</td><td class=\"confluenceTd\" style=\"text-align:right\">" + attrs.get(SpectrumAttibute.MODEL_NAME) + "</td></tr>";
	            result.append(pageWithChildren);
	        }
	        result.append("</tbody>");
	        result.append("</table>");
	        result.append("</p>");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			result.append("Error: ").append(e.getMessage());
		}


       

        return result.toString();
    }

    @Override
    public BodyType getBodyType()
    {
        return BodyType.NONE;
    }

    @Override
    public OutputType getOutputType()
    {
        return OutputType.BLOCK;
    }

}
