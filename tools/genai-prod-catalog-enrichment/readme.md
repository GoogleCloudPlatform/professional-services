# Product Catalog Extraction Tool

A GenAI driven tool utilizing Google Vertex AI to extract text and images from product catalogs.

## Objectives

* Extract product information (text, images) from product catalogs in PDF format.
* Enrich extracted data with AI-generated captions and metadata.
* Provide structured output for downstream processing.

## Solution Architecture

1. **Image/Text Extraction:**
   - Employs PyMuPDF to extract raw images and text from PDF files, including citations.

2. **Text/Image Cleaning & Enrichment:**
   - Sanitizes extracted text and images.
   - Leverages a GEN AI (like Imagen) for caption generation ("specific captions").
   - Stores enriched data in an intermediate bucket for traceability.

3. **Dynamic Prompt Generation & LLM Interaction:**
   - Generates prompts for tasks: Product ISQ, FAQ generation, Image Labeling, Image Captions.
   - Submits prompts to a Large Language Model (LLM).
   - Implements auto-reflection for refining output if needed.
   - Aggregates results into a final JSON.

4. **Storage:**
   - Stores the final JSON in Google Cloud Storage (GCS) for downstream use.

## Project Structure

* `src/`: Contains the core Python modules for the extraction, cleaning, and LLM interaction components.
* `tests/`: Test suites ensuring correctness and robustness (TDD principles).

## Setup

1. **Prerequisites:**
   - Python 3.x 
   - Google Cloud Platform account with Vertex AI configured
   - API keys for GEN AI (if applicable)

2. **Installation:**
   ```bash
   pip install -r requirements.txt