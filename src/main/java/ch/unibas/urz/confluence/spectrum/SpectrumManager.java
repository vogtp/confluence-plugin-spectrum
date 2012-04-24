package ch.unibas.urz.confluence.spectrum;

import ch.almana.spectrum.rest.model.SpectrumAttibute;
import ch.almana.spectrum.rest.net.IRequestConfig;

import com.atlassian.bandana.BandanaManager;
import com.atlassian.confluence.setup.bandana.ConfluenceBandanaContext;
import com.atlassian.extras.common.log.Logger;
import com.atlassian.extras.common.log.Logger.Log;

public class SpectrumManager implements IRequestConfig {
	private static final String DEFAULT_VALUE = "";

	private static final Log logger = Logger.getInstance(SpectrumManager.class);

	private BandanaManager bandanaManager;

	private ConfluenceBandanaContext bandanaContext;

	private SpectrumAttibute spectrumAttibute;;

	public SpectrumManager() {
		super();
	}

	public void setBandanaManager(BandanaManager bandanaManager) {
		bandanaContext = new ConfluenceBandanaContext();
		this.bandanaManager = bandanaManager;
	}

	private String getProperty(String key) {
		return getProperty(key, DEFAULT_VALUE);
	}

	private String getProperty(String key, String defaultValue) {
		if (bandanaManager == null) {
			logger.warn("bandanaManager is null  - cannot get " + key + " returning default value " + defaultValue);
			return defaultValue;
		}
		Object value = bandanaManager.getValue(bandanaContext, key);
		if (value == null || value.equals(key)) {
			logger.info("SpectrumManager: " + key + " has value " + value);
			return defaultValue;
		}
		if (value instanceof String) {
			return (String) value;
		}
		return defaultValue;
	}

	private int getProperty(String key, int defaultValue) {
		if (bandanaManager == null) {
			logger.info("bandanaManager is null - cannot get " + key + " returning default value " + defaultValue);
			return defaultValue;
		}
		Object value = bandanaManager.getValue(bandanaContext, key);
		if (value instanceof Integer) {
			logger.info("SpectrumManager: " + key + " has value " + value);
			return (Integer) value;
		}
		return defaultValue;
	}

	private void setProperty(String key, String value) {
		if (bandanaManager == null) {
			logger.info("bandanaManager is null - cannot set " + key + " to " + value);
			return;
		}
		logger.info("SpectrumManager: set " + key + " to value " + value);
		bandanaManager.setValue(bandanaContext, key, value);
	}

	private void setProperty(String key, int value) {
		if (bandanaManager == null) {
			logger.info("bandanaManager is null - cannot set " + key + " to " + value);
			return;
		}
		bandanaManager.setValue(bandanaContext, key, key);
	}

	public boolean isNotConfigured() {
		return DEFAULT_VALUE.equals(getSpectroServerName()) || DEFAULT_VALUE.equals(getUsername()) || DEFAULT_VALUE.equals(getPassword());
	}

	public String getConfiguredError() {
		String ret = "";
		if (DEFAULT_VALUE.equals(getSpectroServerName())) {
			ret += "No servername\n";
		}
		if (DEFAULT_VALUE.equals(getUsername())) {
			ret += "No username\n";
		}
		if (DEFAULT_VALUE.equals(getPassword())) {
			ret += "No password\n";
		}
		return ret;
	}

	public String getSpectroServerProtocoll() {
		return getProperty("secureconnection", "https");
	}

	public void setSpectroServerProtocoll(String protocoll) {
		setProperty("secureconnection", protocoll);
	}

	public String getSpectroServerName() {
		return getProperty("servername");
	}

	public void setSpectroServerName(String name) {
		setProperty("servername", name);
	}

	public String getSpectroServerUrlPath() {
		return getProperty("URLpath", "spectrum");
	}

	public void setSpectroServerUrlPath(String path) {
		setProperty("URLpath", path);
	}

	public String getUsername() {
		return getProperty("username");
	}

	public void setUsername(String username) {
		setProperty("username", username);
	}

	public String getPassword() {
		return getProperty("password");
	}

	public void setPassword(String password) {
		setProperty("password", password);
	}

	public int getThrottlesize() {
		return -1;
	}

	@Override
	public int getServerPort() {
		return getProperty("serverport", -1);
	}

	public void setServerPort(int port) {
		setProperty("serverport", port);
	}

	public SpectrumAttibute getSpectrumAttibute() {
		if (spectrumAttibute == null) {
			spectrumAttibute = new SpectrumAttibute();
		}
		return spectrumAttibute;
	}

	public String getAlarmColor(String severity) {
		switch (Integer.parseInt(severity)) {
		case 3:
			return "red";
		case 2:
			return "orange";
		case 1:
			return "yellow";
		case 0:
			return "greenl";
		}
		return "";
	}

}
