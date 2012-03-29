package ch.unibas.urz.confluence.spectrum;

import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.SortedMap;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;


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
public class AlarmTableMacro implements Macro
{

    private final SettingsManager settingsManager;

	// We just have to define the variables and the setters, then Spring injects the correct objects for us to use. Simple and efficient.
    // You just need to know *what* you want to inject and use.


    public AlarmTableMacro(SettingsManager settingsManager)
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
        
		RequestConfig settings = new RequestConfig(parameters);
		HttpClientRequestHandler requestHandler = new HttpClientRequestHandler(settings);
		AlarmModelAccess ama = new AlarmModelAccess(requestHandler );
		try {
			final Map<String, GenericModel> entities = ama.getEntities(ama.getList());
			
			SortedSet<GenericModel> alarms = new TreeSet<GenericModel>(new Comparator<GenericModel>() {

				@Override
				public int compare(GenericModel o1, GenericModel o2) {
					int severity1 = Integer.parseInt(o1.getAttributes().get(SpectrumAttibute.SEVERITY));
					int severity2 = Integer.parseInt(o2.getAttributes().get(SpectrumAttibute.SEVERITY));
					int cmp = (new Integer(severity2)).compareTo(severity1);
					if (cmp == 0){
						cmp =1;
					}
					return cmp;
				}
			} );
			alarms.addAll(entities.values());
	        result.append("<p>");
	        result.append("Spectrum alarms on:").append(settings.getSpectroServerName());
	        result.append("<p>");
	        result.append("<table class=\"confluenceTable\">");
	        result.append("<thead><tr>");
	        result.append("<th class=\"confluenceTh\">Severity</th>");
	        result.append("<th class=\"confluenceTh\">Alarm Title</th>");
	        result.append("<th class=\"confluenceTh\">Model Name</th>");
	        result.append("<th class=\"confluenceTh\">Occurences</th>");
	        result.append("</tr></thead>");
	        result.append("<tbody>");
	        for (GenericModel model : alarms)
	        {
	        	Map<String, String> attrs = model.getAttributes();
	            result.append("<tr>");
	            int severity = Integer.parseInt(attrs.get(SpectrumAttibute.SEVERITY));
				result.append("<td class=\"confluenceTd\">").append(AlarmModelAccess.severityToString(severity)).append("</td>");
	            result.append("<td class=\"confluenceTd\">").append(attrs.get(SpectrumAttibute.ALARM_TITLE)).append("</td>");
	            result.append("<td class=\"confluenceTd\">").append(attrs.get(SpectrumAttibute.MODEL_NAME)).append("</td>");
	            result.append("<td class=\"confluenceTd\">").append(attrs.get(SpectrumAttibute.OCCURENCES)).append("</td>");
	            result.append("</tr>");
	        }
	        result.append("</tbody>");
	        result.append("</table>");
	        result.append("</p>");
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			result.append("Error: ").append(e.getMessage());
			result.append("<p />").append("parameters:").append("<p />");
			  for (String key : parameters.keySet()) {
					result.append("<p />").append(key).append(": ").append(parameters.get(key)).append("<p />");
				}
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
