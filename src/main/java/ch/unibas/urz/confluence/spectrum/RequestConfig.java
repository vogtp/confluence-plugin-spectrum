package ch.unibas.urz.confluence.spectrum;

import java.util.Map;

import ch.almana.spectrum.rest.net.IRequestConfig;

public class RequestConfig implements IRequestConfig {

	private Map<String, String> parameters;

	public RequestConfig(Map<String, String> parameters) {
		this.parameters = parameters;
	}

	public String getSpectroServerProtocoll() {
		return Boolean.parseBoolean(parameters.get("secureconnection")) ? "https" : "http";
	}

	public String getSpectroServerName() {
		return parameters.get("servername");
	}

	public String getSpectroServerUrlPath() {
		return  parameters.get("URLpath");
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

}
