## ComfyUI Vertex AI Nodes

This custom node pack for ComfyUI provides seamless integration with Google Cloud's Vertex AI services, allowing you to leverage powerful AI models directly within your ComfyUI workflows.

### Nodes Included

This pack currently includes the following nodes:

* **ImageGen 3:** Generates images using a Vertex AI image generation model
* **Gemini Flash:** Interacts with the Google Gemini Flash model for fast and efficient text generation.
* **Veo 2:** Generates video using a Vertex AI video model.


### Installation
1.  Navigate to your ComfyUI `custom_nodes` directory.
2.  Add the contents of the `comfyui_custom_nodes` directory to the `custom_nodes` directory.
3.  Set the values of PROJECT_ID and REGION in your environment variables or directly in the const.py file located at `src/vertexai_nodes/const.py`. These values are required for the nodes to function correctly.

    ```python
    PROJECT_ID = "your-project-id"
    REGION = "your-region"  # e.g., "us-central1"
    ```
    Alternatively, you can set these environment variables in your terminal before starting ComfyUI:

    ```bash
    export PROJECT_ID="your-project-id"
    export REGION="your-region"  # e.g., "us-central1"
    ```


4.  Install the dependencies present in the `requirements.txt` file. You can do this by running the following command in your terminal:

    ```bash
    pip install -r requirements.txt
    ```
5.  **Restart the ComfyUI server.**


### Usage
After installing and restarting ComfyUI, you will find the "VertexAI" category added to the node menu.
