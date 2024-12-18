## De-id Pipeline Design Document

### Context

#### Objective

The DLP De-identification Pipeline aims to identify and anonymize sensitive data stored in BigQuery or Google Cloud Storage (GCS). The pipeline reads data from a source, de-identifies sensitive information using Cloud DLP, and writes the de-identified data to a corresponding location in the specified destination. This enables the secure migration of data to lower environments, such as development and testing, where developers or other users require data access, but sensitive information needs to be removed to mitigate privacy and security risks.

#### Background

Production environments often contain sensitive information or Personally Identifiable Information (PII), but lower environments require de-identified data to prevent unauthorized access and potential breaches. Therefore, migrating de-identified data to these environments is crucial for purposes including testing, development, and analysis.

Ideally, de-identified data should closely resemble the source data to facilitate the accurate replication of processes and scenarios found in production. This allows users in lower environments to work with realistic data without compromising sensitive information.

Google Cloud's Sensitive Data Protection (also known as Data Loss Prevention or DLP) service offers built-in features for identifying and de-identifying sensitive data in Cloud Storage and integrates with services like BigQuery. However, it has limitations regarding file types and sizes and lacks a unified solution that seamlessly handles both BigQuery and Cloud Storage data de-identification. This pipeline addresses these limitations by providing a comprehensive and scalable solution for de-identifying data across both BigQuery and GCS. 

### Design

#### Overview

The DLP De-identification Pipeline is a Dataflow pipeline that anonymizes sensitive data residing in BigQuery or Google Cloud Storage (GCS). It offers a comprehensive solution for migrating data to lower environments while ensuring privacy and security. 
![GCS mode diagram](diagrams/design_diagram_gcs.png)
![BQ mode diagram](diagrams/design_diagram_gcs.png)

The De-id pipeline works as follows:

1.  **Data Ingestion**: The pipeline reads data from either BigQuery tables or various file formats stored in GCS. 

2.  **De-identification**: Leveraging Cloud DLP’s powerful de-identification capabilities, the pipeline anonymizes sensitive data within the ingested data. This includes techniques like:

    *   **Format-Preserving Encryption:** This technique encrypts sensitive data while maintaining its original format and referential integrity. This is crucial for preserving data utility in lower environments.
    *   **Other De-identification Techniques:** Cloud DLP offers a range of other de-identification techniques, such as masking, redaction, tokenization, and pseudonymization, which can be configured based on specific needs and privacy requirements. 
3.  **Output**: The pipeline writes the de-identified data to the specified destination, mirroring the source structure and format. This ensures consistency and facilitates seamless integration with downstream processes in lower environments. 

The De-id pipeline offers several **key benefits**:

*   **Comprehensive Solution:** Handles both structured data from BigQuery and unstructured/semi-structured data from GCS.
*   **Scalability and Reliability:** Built on Dataflow, the pipeline provides scalability and reliability for handling large datasets and heavy de-identification tasks. 
*   **Data Utility:** Format-preserving encryption and other de-identification techniques ensure that the anonymized data remains useful for testing, development, and analysis in lower environments.
*   **Security and Privacy:** By de-identifying sensitive data, the pipeline helps protect sensitive information and comply with privacy regulations. 

The De-id pipeline offers a robust and efficient way to create secure and usable data copies for lower environments, enabling various data-driven activities without compromising sensitive information. 

#### Detailed Design

##### DLP Templates

This solution employs templates to streamline the de-identification process for sensitive data. By configuring de-identification settings within a template, a reusable blueprint is established. This eliminates the need for repetitive configuration, allowing de-identification jobs to be executed multiple times with ease. 

To ensure referential integrity while masking sensitive information, a combination of format-preserving encryption (FPE) and regular expressions (regex) is utilized. This approach enables the original data pattern to be maintained even after de-identification. 

**Illustrative Example: Customer ID**

Consider a scenario where a Customer ID follows the format "A123456" (i.e., "A" followed by a 6-digit number) and is classified as PII. A custom PII info type named "CUSTOMER\_ID" can be configured within the inspection template, utilizing the following regex:

```json
{
  "info_type": {
    "name": "CUSTOMER_ID"
  },
  "regex": {
    "group_indexes":,
    "pattern": "(A)(\\d{6})"
  }
}
```

In this regex, two group indexes are defined, but only the second group index (the 6-digit number) is designated as sensitive. This ensures that during de-identification, only the numerical portion undergoes transformation. FPE guarantees that the output remains a 6-digit number, and by preserving the prefix "A," the overall pattern of the Customer ID is retained.

**FPE Configuration**

Here’s an example of how FPE can be configured within the de-identification template for this Customer ID: 

```json
{
  "primitive_transformation": {
    "crypto_replace_ffx_fpe_config": {
      "crypto_key": <CYPTO_KEY>
      "common_alphabet": "NUMERIC"
    }
  },
  "info_types": [
    {
      "name": "CUSTOMER_ID"
    }
  ]
}
```

**Template Configuration for this Example**

This table below shows the PII configured and how they are de-identified using this solution. The inspection and de-identification templates can be customized to suit your specific needs and integrate them into your data processing pipeline. 

| **PII Info Type** | **Original** | **De-identified** |
| :----------------- | :----------- | :--------------- |
| Customer ID        | A935492      | A678512          |
| Email Address      | email@example.net | 9jRsv@example.net    |
| Credit Card Number | 3524882434259679 | 1839406548854298     |
| SSN                | 298-34-4337  | 515-57-9132       |
| Date               | 1979-10-29  | 1982-08-24       |
