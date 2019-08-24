# Document Understanding Demo

## Step order
```
1. Execute requirements.sh
2. Execute automl.sh
```

requirements.sh installs all Google & 3rd party libraries

automl.sh executes several python scripts
-   pdf2png.py
	- Convert PDF document to PNG. Output PNG files to specified files.
-   classify.py
    - Classify the PNG file as a US, EU, or non-patent. Write classification results to BigQuery.
-   gcs_bucket_pdf_ocr.py
    - Perform OCR on to extract text from patent documents. Store output json in GCS.
-   predict_automl_ner.py
    - Apply NER model to OCR json output. Write extracted entities to BigQuery.
-   predict_automl_objdetect.py
    - Apply Object Detection model to PDF patent documents. Store cropped images of diagrams in GCS and write location to BigQuery
-   create_final_view.py
    - Join tables created above to create a single table in BigQuery will all elements.
-   evaluate.py
    - Evaluate the end-to-end performance of the pipeline using grouind truth document. Write results to BigQuery
