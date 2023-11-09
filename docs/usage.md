| [Home](../README.md) |
|----------------------|

# Usage
The following image illustrates how the Connector Health widget is displayed on the dashboard page:

![Edit View](./res/Connectors.png)

Each connector configuration row will display the number of configurations that are being monitored, for example, in the image above, all the connectors have 1 Configuration Monitored.

If any of the configurations of a connector is unavailable, then the widget will display "Unavailable" in the red color and the Health Check will be Unavailable. For example, in the above image the configuration of the Virus Total connector is unavailable. To view the details of the configuration being unavailable, click the down arrow on the connector row, to display the Health Check Status of that configuration. You will see that the Health Check Status of this configuration is "Disconnected". You can hover on the warning icon to know the reason for the configuration being disconnected.

If all the configurations of the connector are available, then the widget will display "All Available" in green color and the Health Check will be "Available". If any configuration is unavailable, then the widget will display "1 Unavailable" in the red color and when you click the down arrow the Health Check Status will display "Available" for the configurations that are available, and display "Disconnected" for the configuration that is unavailable.

If any connector is deactivated, then it will appear as "Deactivated" in red color and the Health Check will display as "Deactivated".




| [Installation](./setup.md#installation) | [Configuration](./setup.md#configuration) |
|-----------------------------------------|-------------------------------------------|