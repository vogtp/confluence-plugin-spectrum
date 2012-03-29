package ch.unibas.urz.confluence.spectrum;

import java.util.Map;

import com.opensymphony.util.TextUtils;

import ch.almana.spectrum.rest.net.IRequestConfig;

public class RequestConfig implements IRequestConfig {

	private Map<String, String> parameters;

	public RequestConfig(Map<String, String> parameters) {
		this.parameters = parameters;
	}

	public String getSpectroServerProtocoll() {
		if (!parameters.containsKey("secureconnection")){
			return "https";
		}
		return Boolean.parseBoolean(parameters.get("secureconnection")) ? "https" : "http";
	}

	public String getSpectroServerName() {
		return parameters.get("servername");
	}

	public String getSpectroServerUrlPath() {
		String path = parameters.get("URLpath");
		if (path == null || "".equals(path)){
			path = "spectrum";
		}
		return  path;
	}

	public String getUsername() {
		return parameters.get("username");
	}

	public String getPassword() {
		return parameters.get("password");
	}

	public int getThrottlesize() {
		return -1;
	}

	@Override
	public int getServerPort() {
		if (!parameters.containsKey("serverport")){
			return -1;
		}
		try{
			return Integer.parseInt(parameters.get("serverport"));
		}catch (Exception e) {
			return -1;
		}
	}

}
