# Yanolja Vision AI and MLOps Pipeline

This project focuses on developing and optimizing a cloud-based visual AI workflow on Google Cloud Platform (GCP) utilizing ComfyUI and Google's foundation models. The project includes MLOps pipeline design, short-form video generation consultation, and hybrid architecture implementation.

## Development

Please refer to [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines.


## ComfyUI Vertex AI Nodes

This custom node pack for ComfyUI provides seamless integration with Google Cloud's Vertex AI services, allowing you to leverage powerful AI models directly within your ComfyUI workflows.

### Nodes Included

This pack currently includes the following nodes:

* **ImageGen 3:** Generates images using a Vertex AI image generation model
* **Gemini Flash:** Interacts with the Google Gemini Flash model for fast and efficient text generation.
* **Veo 2:** Generates video using a Vertex AI video model.

### Authentication
1.  TODO


### Installation
1.  Navigate to your ComfyUI `custom_nodes` directory.
2.  Add the contents of this repository to the `custom_nodes` directory.
3.  Set configurations in `config.yaml` file. You can find these values in your Google Cloud Console.
4.  Install the dependencies present in the `requirements.txt` file. You can do this by running the following command in your terminal:

    ```bash
    pip install -r requirements.txt
    ```
5.  Move workflow json files from `src/vertexai_nodes/workflows` to ComfyUI `user/default/workflows`
6.  **Restart the ComfyUI server.**

### Installation from git
1.  Navigate to your ComfyUI `custom_nodes` directory.
2.  Clone the git repo under `custom_nodes` directory.
3.  Move workflow json files from `src/vertexai_nodes/workflows` to ComfyUI `user/default/workflows`
4.  **Restart the ComfyUI server.**

### Usage
After installing and restarting ComfyUI, you will find the "VertexAI" category added to the node menu.
