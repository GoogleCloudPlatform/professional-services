# Triton and JetStream on Google Cloud TPU

This repo contains reference code and deployment instructions for an experimental
triton backend enabling tpu-based inference for llama 2 and gemma models.

## WARNING - NOT FOR PRODUCTION USE

This reference implementation is only intended to unblock initial testing and benchmarking. 
The container used contains an early alpha build of a TPU live inference backend 
This early alpha backend is provided **for testing purposes only**.

## Deployment instructions

1. Set appropriate environment variables for your project and zone:
    ```
    export ZONE="us-west1-c"
    export PROJECT="your_project_id"
    export TPUVM="my-tpu-1"
    ```

2. Provision a TPU instance of the appropriate size. Refer to the provided
   benchmarking results slides and TDD to determine what the ideal TPU instance
   size is for your desired model. For this example, we will be using a
   `v5e-8` and the `Llama2-7b` model:

   ```
   gcloud alpha compute tpus tpu-vm create $TPUVM --zone $ZONE --accelerator-type v5e-8 --version v2-alpha-tpuv5-lite --project $PROJECT
   ```

3. Install Jetstream (SSH to the VM you just created):

   ```
   sudo su -
   git clone https://github.com/google/jetstream-pytorch
   cd
   chmod 755 ./install_everything.sh
   ./install_everything.sh

   ```

4. Download and configure models checkpoints and convert to Jetstream ready safetensor: 
(prior to these steps, you must request access to llama if you haven’t already at https://llama.meta.com/llama-downloads - you will receive a URL to use )
   
   ```
   # download Llama2 checkpt 
   cd /root
   git clone https://github.com/meta-llama/llama.git
   cd /root/llama
   ./download.sh
   #paste the url from your email
   #select '7B-chat'
   
   #Merge weights
   export input_ckpt_dir=/root/llama/llama-2-7b-chat
   export output_ckpt_dir=/root/model/model_disk/data/jet-llama2-7b
   export output_safetensor=True
   export quantize=True
   export PYTHONPATH=$PYTHONPATH:$(pwd)
   
   cd jetstream-pytorch
   python3 convert_checkpoints.py --input_checkpoint_dir=$input_ckpt_dir --output_checkpoint_dir=$output_ckpt_dir --output_safetensors=$output_safetensor --quantize=$quantize
   
   cd /root/model/model_disk/model_repository
   
   # You can also copy the samples/model_repository and modify the configuration file
   # the following code shows create and modify the configuration directly
   mkdir llama7b
   cd llama7b
   vi config.pbtxt
   #include this in config.pbtxt
   #backend: "jetstream"
   #
   #instance_group [
   #  {
   #    count: 1
   #    kind: KIND_MODEL
   #  }
   #]
   
   mkdir 1
   cd 1
   vi model.json
   #include this in model.json
   #{
   #    "checkpoint_path":"/data/jet-llama2-7b/model.safetensors",
   #    "tokenizer_path":"/data/jet-llama2-7b/tokenizer.model",
   #    "param_size": "7b",
   #    "batch_size": 40,
   #    "max_cache_length": 2408,
   #    "quantize_weights": "True",
   #    "quantize_kv_cache": "True",
   #    "context_size": 1024,
   #    "platform": "tpu=8"
   #}

   ```

5. Copy llama2 model tokenizer: 

   ```
   cp /root/llama/tokenizer.model /root/model/model_disk/data/jet-llama2-7b/
   ```

6. Start Triton Server

   Once the TPU VM is provisioned and started successfully, clone the repositry and build the container image.

   ```
   docker build -t triton-jetstram -f docker/Dockerfile .
   ```
   
   Optional: You can push the container image to managed container registry like GCP artifactory repository
   Configure docker authentication to allow the TPU workers to access the docker image using application default credentials:
   
   ```
   gcloud compute tpus tpu-vm ssh $TPUVM --project=$PROJECT --zone=$ZONE --worker=all --command \
   "sudo gcloud auth configure-docker -q us-west1-docker.pkg.dev"
   sudo docker tag triton-jetstram:latest us-west1-docker.pkg.dev/your_project/triton/triton-jetstram:pytorch
   sudo docker push us-west1-docker.pkg.dev/$PROJECT/triton/triton-jetstram:latest
   ```
   
   Run the Triton docker container on all TPU workers:   
   
   ```
   # Run docker
   export TRITON_IMAGE="triton-jetstram:latest"
   export MODEL_REPO=/root/model/model_disk/model_repository
   export safetensor_ckp=/root/model/model_disk/data/jet-llama2-7b/model.safetensors
   
   docker run --rm -p8000:8000 -p8001:8001 -p8002:8002 --shm-size=16gb --privileged -v/root/model/model_disk/data:/data -v$MODEL_REPO:/models $TRITON_IMAGE tritonserver --model-repository=/models 
   ```

7. Once the Triton server has finished initializing, you can open a new terminal and verify it's working by sending worker 0 a request over the local network on the typical Triton endpoint:

   ```
   export ZONE="us-west1-c"
   export PROJECT="your-project"
   export TPUVM="my-tpu-1"
   gcloud compute tpus tpu-vm ssh --zone $ZONE $TPUVM --project $PROJECT --worker=0

   $ curl -X POST http://localhost:8000/v2/models/llama7b/generate -d '{"text_input": "Triton is ", "parameters": {"stream": false, "max_tokens": 250, "temperature": "0.8"}}' 
   ```

   The first request will usually take longer than usual due to cold start.
   Please manually send a few requests to ensure the server is warmed up before
   beginning any benchmarks.

## Benchmarking

Benchmarking can be conducted using any standard tooling. We primarily used the
fw-ai llm-bench scripts.
We've included a modified version of the llm-bench script `locust/load_test.py`
so that it is compatible with the Triton Jetstream backend Input and Output
tensor format.

In order to get token counts, you will need to explicitly specify a tokenizer.
If you are running the benchmark locally from one of the TPU workers, you can
specify this using the relevant model weights directory, i.e.:

```
locust -t 3min -u 100 -r 100 -p 100 -o 250 --qps 1 --tokenizer /mnt/weights/llama2-70b-chat-hf --summary-file trt1d.csv --provider triton-generate -H http://localhost:8000
```
