package ch.unibas.urz.confluence.spectrum;

import java.util.Comparator;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import ch.almana.spectrum.rest.access.AlarmModelAccess;
import ch.almana.spectrum.rest.access.AssociationModelAccess;
import ch.almana.spectrum.rest.access.CollectionModelAccess;
import ch.almana.spectrum.rest.model.GenericModel;
import ch.almana.spectrum.rest.model.SpectrumAttibute;
import ch.almana.spectrum.rest.net.HttpClientRequestHandler;

import com.atlassian.confluence.content.render.xhtml.ConversionContext;
import com.atlassian.confluence.macro.Macro;
import com.atlassian.confluence.macro.MacroExecutionException;
import com.atlassian.confluence.setup.settings.SettingsManager;

/**
 * This very simple macro shows you the very basic use-case of displaying
 * *something* on the Confluence page where it is used. Use this example macro
 * to toy around, and then quickly move on to the next example - this macro
 * doesn't really show you all the fun stuff you can do with Confluence.
 */
public class AlarmTableMacro implements Macro {

	private final SettingsManager settingsManager;

	// We just have to define the variables and the setters, then Spring injects
	// the correct objects for us to use. Simple and efficient.
	// You just need to know *what* you want to inject and use.

	public AlarmTableMacro(SettingsManager settingsManager) {
		this.settingsManager = settingsManager;
	}

	/**
	 * This method returns XHTML to be displayed on the page that uses this
	 * macro we just do random stuff here, trying to show how you can access the
	 * most basic managers and model objects. No emphasis is put on beauty of
	 * code nor on doing actually useful things :-)
	 */
	@Override
	public String execute(Map<String, String> parameters, String body,
			ConversionContext context) throws MacroExecutionException {

		// in this most simple example, we build the result in memory, appending
		// HTML code to it at will.
		// this is something you absolutely don't want to do once you start
		// writing plugins for real. Refer
		// to the next example for better ways to render content.
		StringBuffer result = new StringBuffer();

		if ("preview".equals(context.getOutputType())) {
			doOutputPreview(parameters, body, context, result);
		} else {
			doOutputDisplay(parameters, body, context, result);
		}

		return result.toString();
	}

	private void doOutputPreview(Map<String, String> parameters, String body,
			ConversionContext context, StringBuffer result) {
		RequestConfig settings = new RequestConfig(parameters);
//		result.append("\n" + 
//				"<form action=\"#\" method=\"post\" class=\"aui\">\n" + 
//				"  <div class=\"field-group\">\n" + 
//				"    <label for=\"addUser\">Search users</label>\n" + 
//				"    <input class=\"text long-field\" type=\"text\" id=\"addUser\" name=\"addUser\" title=\"Add user\">\n" + 
//				"  </div>\n" + 
//				"  <div class=\"buttons-container\">\n" + 
//				"    <div class=\"buttons\">\n" + 
//				"      <input class=\"button submit\" type=\"submit\" value=\"submit\">\n" + 
//				"      <a class=\"cancel\" href=\"forms.html#\">Cancel</a>\n" + 
//				"    </div>\n" + 
//				"  </div>\n" + 
//				"</form>");
//		debugOutput(parameters, body, context, result);
		HttpClientRequestHandler requestHandler = new HttpClientRequestHandler(
				settings);
		CollectionModelAccess cma = new CollectionModelAccess(requestHandler);
		try {
						result.append("<p>");
			result.append("Spectrum Collections on:").append(
					settings.getSpectroServerName());
			result.append("<p>");
			result.append("<table class=\"confluenceTable\">");
			result.append("<thead><tr>");
			result.append("<th class=\"confluenceTh\">Collection Name</th>");
			result.append("<th class=\"confluenceTh\">Handle</th>");
			result.append("</tr></thead>");
			result.append("<tbody>");
			Map<String, GenericModel> entities = cma.getEntities(null);
			for (String  collection : entities.keySet()) {
				result.append("<tr>");
				result.append("<td class=\"confluenceTd\">")
						.append(entities.get(collection).get(
								SpectrumAttibute.MODEL_NAME))
						.append("</td>");
				result.append("<td class=\"confluenceTd\">")
.append(collection)
						.append("</td>");
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
				result.append("<p />").append(key).append(": ")
						.append(parameters.get(key)).append("<p />");
			}
		}
	}

	private void doOutputDisplay(Map<String, String> parameters, String body,
			ConversionContext context, StringBuffer result) {
		RequestConfig settings = new RequestConfig(parameters);
		HttpClientRequestHandler requestHandler = new HttpClientRequestHandler(
				settings);
		AlarmModelAccess ama = new AlarmModelAccess(requestHandler);
		String detailDescription = "";
		try {
			final Map<String, GenericModel> entities;
			String collection = parameters.get("collection");
			if (collection == null || "".equals(collection.trim())){
				entities = ama.getEntities(ama.getList());
			}else{
				AssociationModelAccess asoma = new AssociationModelAccess(requestHandler);
				Set<String> modelsForCollection = asoma
						.getModelsForCollection(collection);
				entities = ama.getAlarmsIdByModelHandle(modelsForCollection);
				CollectionModelAccess cma = new CollectionModelAccess(
						requestHandler);
				String collectionName = cma.getEntities(null).get(collection)
						.get(SpectrumAttibute.MODEL_NAME);
				detailDescription = " for collection " + collectionName;
			}
			
			SortedSet<GenericModel> alarms = new TreeSet<GenericModel>(
					new Comparator<GenericModel>() {

						@Override
						public int compare(GenericModel o1, GenericModel o2) {
							int severity1 = Integer.parseInt(o1.getAttributes()
									.get(SpectrumAttibute.SEVERITY));
							int severity2 = Integer.parseInt(o2.getAttributes()
									.get(SpectrumAttibute.SEVERITY));
							int cmp = (new Integer(severity2))
									.compareTo(severity1);
							if (cmp == 0) {
								cmp = 1;
							}
							return cmp;
						}
					});
			alarms.addAll(entities.values());
			result.append("<p>");
			result.append("Spectrum alarms").append(detailDescription)
					.append(" (").append(settings.getSpectroServerName())
					.append(")");
			result.append("<p>");
			result.append("<table class=\"confluenceTable\">");
			result.append("<thead><tr>");
			result.append("<th class=\"confluenceTh\">Severity</th>");
			result.append("<th class=\"confluenceTh\">Alarm Title</th>");
			result.append("<th class=\"confluenceTh\">Model Name</th>");
			result.append("<th class=\"confluenceTh\">Occurences</th>");
			result.append("</tr></thead>");
			result.append("<tbody>");
			for (GenericModel model : alarms) {
				Map<String, String> attrs = model.getAttributes();
				result.append("<tr>");
				int severity = Integer.parseInt(attrs
						.get(SpectrumAttibute.SEVERITY));
				result.append("<td class=\"confluenceTd\">")
						.append(AlarmModelAccess.severityToString(severity))
						.append("</td>");
				result.append("<td class=\"confluenceTd\">")
						.append(attrs.get(SpectrumAttibute.ALARM_TITLE))
						.append("</td>");
				result.append("<td class=\"confluenceTd\">")
						.append(attrs.get(SpectrumAttibute.MODEL_NAME))
						.append("</td>");
				result.append("<td class=\"confluenceTd\">")
						.append(attrs.get(SpectrumAttibute.OCCURENCES))
						.append("</td>");
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
				result.append("<p />").append(key).append(": ")
						.append(parameters.get(key)).append("<p />");
			}
		}
	}

	private void debugOutput(Map<String, String> parameters, String body,
			ConversionContext context, StringBuffer result) {
		result.append("<p />").append("body:").append(body).append("<p />");
		result.append("<p />").append("context:").append(context.toString())
				.append("<p />");
		result.append("<p />").append("context getOutputType:")
				.append(context.getOutputType()).append("<p />");
		result.append("<p />").append("context getSpaceKey:")
				.append(context.getSpaceKey()).append("<p />");
		result.append("<p />").append("context getEntity:")
				.append(context.getEntity()).append("<p />");
		result.append("<p />").append("parameters:").append("<p />");
		for (String key : parameters.keySet()) {
			result.append("<p />").append(key).append(": ")
					.append(parameters.get(key)).append("<p />");
		}
	}

	@Override
	public BodyType getBodyType() {
		return BodyType.NONE;
	}

	@Override
	public OutputType getOutputType() {
		return OutputType.BLOCK;
	}

}
