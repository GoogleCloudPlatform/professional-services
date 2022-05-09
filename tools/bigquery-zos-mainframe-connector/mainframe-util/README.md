# Mainframe Utility

This library is used by the Mainframe Connector and Mainframe Utility Interpreter. It is added as a
dependency to provide interfaces to commonly used services like Cloud Storage, BigQuery, and Cloud Logging. It also includes a custom SSLSocketFactory which forces use of TLS ciphers supported by IBM Hardware Crypto cards.

The most useful feature of this code is the Update functionality it provides. There is a main class which is meant to be called from a Batch Job via JCL which checks a GCS bucket for updated jars and downloads them to an install directory for the Mainframe Connector and Utility Interpreter. This greatly simplifies deployment for operators who previously needed to download the jars individually to their local workstation then FTP the jars to the mainframe and also delete previous versions of jars.

## Usage

Install the [Example PROC](BQUPDT) to a mainframe dataset added to PROCLIB. Call the PROC using

```
//JAVA EXEC PROC=BQUPDT
```

