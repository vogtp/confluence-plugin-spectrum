package ch.unibas.urz.confluence.spectrum.config;

import ch.unibas.urz.confluence.spectrum.SpectrumManager;

import com.atlassian.confluence.core.Administrative;
import com.atlassian.confluence.core.ConfluenceActionSupport;

public class ConfigureSpectrumAction extends ConfluenceActionSupport implements
		Administrative {

	private static final long serialVersionUID = -8786833448142699423L;

	private SpectrumManager spectrumManager;

	private String connectionType = "";
	private String spectroServerName = "";
	private String spectroServerUrlPath = "";
	private String spectroServerPort = "";
	private String username = "";
	private String password = "";

	public ConfigureSpectrumAction() {
		super();
	}

	public void setSpectrumManager(SpectrumManager spectrumManager) {
		this.spectrumManager = spectrumManager;
		loadValues();
	}

	private void loadValues() {
		setConnectionType(spectrumManager.getSpectroServerProtocoll());
		setSpectroServerName(spectrumManager.getSpectroServerName());
		setSpectroServerUrlPath(spectrumManager.getSpectroServerUrlPath());
		setSpectroServerPort(Integer.toString(spectrumManager.getServerPort()));
		setUsername(spectrumManager.getUsername());
		setPassword(spectrumManager.getPassword());
	}

	public String input() {
		loadValues();
		return INPUT;
	}

	public String save() throws Exception {
		spectrumManager.setSpectroServerProtocoll(connectionType);
		spectrumManager.setSpectroServerName(spectroServerName);
		spectrumManager.setSpectroServerUrlPath(spectroServerUrlPath);
		try {
			spectrumManager.setServerPort(Integer.parseInt(spectroServerPort));
		} catch (NumberFormatException e) {
		}
		spectrumManager.setUsername(username);
		spectrumManager.setPassword(password);
		return SUCCESS;
	}

	public String getSpectroServerName() {
		return spectroServerName;
	}

	public void setSpectroServerName(String spectroServerName) {
		this.spectroServerName = spectroServerName;
	}

	public String getConnectionType() {
		return connectionType;
	}

	public void setConnectionType(String connectionType) {
		this.connectionType = connectionType;
	}

	public String getSpectroServerUrlPath() {
		return spectroServerUrlPath;
	}

	public void setSpectroServerUrlPath(String spectroServerUrlPath) {
		this.spectroServerUrlPath = spectroServerUrlPath;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getSpectroServerPort() {
		return spectroServerPort;
	}

	public void setSpectroServerPort(String spectroServerPort) {
		try {
			if (Integer.parseInt(spectroServerPort) < 0) {
				this.spectroServerPort = "";
			}
		} catch (Exception e) {
			this.spectroServerPort = "";
		}
		this.spectroServerPort = spectroServerPort;
	}

}
