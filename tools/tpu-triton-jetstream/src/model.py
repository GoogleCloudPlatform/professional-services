# Copyright 2023-2024, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# Copyright 2024 Google LLC
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#  * Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
#  * Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
#  * Neither the name of NVIDIA CORPORATION nor the names of its
#    contributors may be used to endorse or promote products derived
#    from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ``AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
# PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
# CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
# EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
# PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
# OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import asyncio
import json
import logging
import os
import threading
import numpy as np
import triton_python_backend_utils as pb_utils

from jetstream.core import config_lib
from jetstream.core import orchestrator
from jetstream.core import server_lib
from jetstream.core.proto import jetstream_pb2
from jetstream_pt import engine as je
from jetstream.core.config_lib import ServerConfig

_JETSTREAM_ENGINE_ARGS_FILENAME = "model.json"

root = logging.getLogger()
root.setLevel(logging.INFO)


class TritonPythonModel:
    @staticmethod
    def auto_complete_config(auto_complete_model_config):
        inputs = [
            {"name": "text_input", "data_type": "TYPE_STRING", "dims": [1]},
            {
                "name": "stream",
                "data_type": "TYPE_BOOL",
                "dims": [1],
                "optional": True,
            },
            {
                "name": "max_tokens",
                "data_type": "TYPE_INT32",
                "dims": [1],
                "optional": True,
            },
            {
                "name": "temperature",
                "data_type": "TYPE_FP32",
                "dims": [1],
                "optional": True,
            },
        ]
        outputs = [{"name": "text_output", "data_type": "TYPE_STRING", "dims": [-1]}]

        # Store the model configuration as a dictionary.
        config = auto_complete_model_config.as_dict()
        input_names = []
        output_names = []
        for input in config["input"]:
            input_names.append(input["name"])
        for output in config["output"]:
            output_names.append(output["name"])

        # Add only missing inputs and output to the model configuration.
        for input in inputs:
            if input["name"] not in input_names:
                auto_complete_model_config.add_input(input)
        for output in outputs:
            if output["name"] not in output_names:
                auto_complete_model_config.add_output(output)

        # We need to use decoupled transaction policy for saturating
        # JetStream engine for max throughtput.
        auto_complete_model_config.set_model_transaction_policy(dict(decoupled=True))

        # Disabling batching in Triton, let JetStream handle the batching on its own.
        auto_complete_model_config.set_max_batch_size(0)

        return auto_complete_model_config

    def _setup_driver(self, **engine_args):
        # Create a JetStream generate engine

        # del argv
        os.environ["XLA_FLAGS"] = "--xla_dump_to=/tmp/xla_logs --xla_dump_hlo_as_text"
        # No devices for local cpu test. A None for prefill and a None for generate.
        devices = server_lib.get_devices()

        # reading model configuration
        quantize_weight_param = (
            True if engine_args["quantize_weights"] == "True" else False
        )
        quantize_kv_param = (
            True if engine_args["quantize_kv_cache"] == "True" else False
        )
        engine = je.create_pytorch_engine(
            devices=devices,
            tokenizer_path=engine_args["tokenizer_path"],
            ckpt_path=engine_args["checkpoint_path"],
            bf16_enable=True,
            param_size=engine_args["param_size"],
            context_length=engine_args["context_size"],
            batch_size=engine_args["batch_size"],
            quantize_weights=quantize_weight_param,
            quantize_kv=quantize_kv_param,
            max_cache_length=engine_args["max_cache_length"],
        )
        server_config = ServerConfig(
            interleaved_slices=(engine_args["platform"],),
            interleaved_engine_create_fns=(lambda a: engine,),
        )

        engines = config_lib.get_engines(server_config, devices=devices)
        prefill_params = [pe.load_params() for pe in engines.prefill_engines]
        generate_params = [ge.load_params() for ge in engines.generate_engines]
        shared_params = [ie.load_params() for ie in engines.interleaved_engines]
        logging.info("JetStream Engine Iniatialization Completes.")
        driver = orchestrator.Driver(
            prefill_engines=engines.prefill_engines + engines.interleaved_engines,
            generate_engines=engines.generate_engines + engines.interleaved_engines,
            prefill_params=prefill_params + shared_params,
            generate_params=generate_params + shared_params,
        )

        return driver

    def initialize(self, args):
        self.logger = pb_utils.Logger
        self.model_config = json.loads(args["model_config"])

        # assert are in decoupled mode. Currently, Triton needs to use
        # decoupled policy for asynchronously forwarding requests to
        # JetStream engine.
        self.using_decoupled = pb_utils.using_decoupled_model_transaction_policy(
            self.model_config
        )
        assert (
            self.using_decoupled
        ), "JetStream Triton backend must be configured to use decoupled model transaction policy"

        engine_args_filepath = os.path.join(
            pb_utils.get_model_dir(), _JETSTREAM_ENGINE_ARGS_FILENAME
        )
        assert os.path.isfile(
            engine_args_filepath
        ), f"'{_JETSTREAM_ENGINE_ARGS_FILENAME}' containing Jetstream engine args must be provided in '{pb_utils.get_model_dir()}'"
        with open(engine_args_filepath) as file:
            jetstream_engine_config = json.load(file)

        # Setup JetStream Driver
        self.driver = self._setup_driver(**jetstream_engine_config)
        self.jetengine = orchestrator.LLMOrchestrator(driver=self.driver)

        output_config = pb_utils.get_output_config_by_name(
            self.model_config, "text_output"
        )
        self.output_dtype = pb_utils.triton_string_to_numpy(output_config["data_type"])

        # Counter to keep track of ongoing request counts
        self.ongoing_request_count = 0

        # Starting asyncio event loop to process the received requests asynchronously.
        self._loop = asyncio.get_event_loop()
        self._loop_thread = threading.Thread(
            target=self.engine_loop, args=(self._loop,)
        )
        self._shutdown_event = asyncio.Event()
        self._loop_thread.start()

    def create_task(self, coro):
        """
        Creates a task on the engine's event loop which is running on a separate thread.
        """
        assert (
            self._shutdown_event.is_set() is False
        ), "Cannot create tasks after shutdown has been requested"

        return asyncio.run_coroutine_threadsafe(coro, self._loop)

    def engine_loop(self, loop):
        """
        Runs the engine's event loop on a separate thread.
        """
        asyncio.set_event_loop(loop)
        self._loop.run_until_complete(self.await_shutdown())

    async def await_shutdown(self):
        """
        Primary coroutine running on the engine event loop. This coroutine is responsible for
        keeping the engine alive until a shutdown is requested.
        """
        # first await the shutdown signal
        while self._shutdown_event.is_set() is False:
            await asyncio.sleep(5)

        # Wait for the ongoing_requests
        while self.ongoing_request_count > 0:
            self.logger.log_info(
                "[vllm] Awaiting remaining {} requests".format(
                    self.ongoing_request_count
                )
            )
            await asyncio.sleep(5)

        # shut down jetstream driver
        self.driver.stop()

        for task in asyncio.all_tasks(loop=self._loop):
            if task is not asyncio.current_task():
                task.cancel()
        self.logger.log_info("[vllm] Shutdown complete")

    def create_response(self, jetstream_output):
        """
        Parses the output from the JetStream engine into Triton
        response.
        """
        prompt = jetstream_output.prompt
        text_outputs = [(prompt + jetstream_output.output).encode("utf-8")]
        triton_output_tensor = pb_utils.Tensor(
            "text_output", np.asarray(text_outputs, dtype=self.output_dtype)
        )
        return pb_utils.InferenceResponse(output_tensors=[triton_output_tensor])

    async def generate(self, request):
        """
        Forwards single request to JetStream engine and returns responses.
        """
        response_sender = request.get_response_sender()
        self.ongoing_request_count += 1
        try:
            prompt = pb_utils.get_input_tensor_by_name(
                request, "text_input"
            ).as_numpy()[0]
            if isinstance(prompt, bytes):
                prompt = prompt.decode("utf-8")

            stream = pb_utils.get_input_tensor_by_name(request, "stream")
            if stream:
                stream = stream.as_numpy()[0]
            else:
                stream = False

            # Get max_tokens to generate
            in_max_tokens = pb_utils.get_input_tensor_by_name(request, "max_tokens")
            if in_max_tokens:
                in_max_tokens = in_max_tokens.as_numpy()[0]
            else:
                in_max_tokens = 100

            request = jetstream_pb2.DecodeRequest(
                session_cache="",
                additional_text=prompt,
                priority=1,
                max_tokens=in_max_tokens,
            )

            # Current implementation returns non-streaming response
            nonstreaming_output = self.RequestOutput()
            nonstreaming_output.prompt = prompt
            str_buffer = []

            async for item in self.jetengine.Decode(request):
                if response_sender.is_cancelled():
                    self.logger.log_info(
                        "[jetstream] Successfully cancelled the request"
                    )
                    break
                if stream:
                    self.logger.log_info(
                        f"[jetstream] JetEngine stream output: {bytes(item.response[0], encoding='utf-8').decode()}"
                    )
                    if item.finished:
                        response_sender.send(
                            self.create_response(item),
                            flags=pb_utils.TRITONSERVER_RESPONSE_COMPLETE_FINAL,
                        )
                    else:
                        response_sender.send(self.create_response(item))
                else:
                    str_buffer.append(item.response[0])

            if not stream:
                # fix extra whitespace bug
                nonstreaming_output.output = "".join(str_buffer)
                self.logger.log_info(
                    f"[vllm] JetEngine Non-stream output: {nonstreaming_output.output}"
                )
                response_sender.send(
                    self.create_response(nonstreaming_output),
                    flags=pb_utils.TRITONSERVER_RESPONSE_COMPLETE_FINAL,
                )

        except Exception as e:
            self.logger.log_info(f"[jetstream] Error generating stream: {e}")
            error = pb_utils.TritonError(f"Error generating stream: {e}")
            triton_output_tensor = pb_utils.Tensor(
                "text_output", np.asarray(["N/A"], dtype=self.output_dtype)
            )
            response = pb_utils.InferenceResponse(
                output_tensors=[triton_output_tensor], error=error
            )
            response_sender.send(
                response, flags=pb_utils.TRITONSERVER_RESPONSE_COMPLETE_FINAL
            )
            raise e
        finally:
            self.ongoing_request_count -= 1

    async def to_async_iterator(self, generator):
        for item in generator:
            yield item

    def execute(self, requests):
        """
        Triton core issues requests to the backend via this method.

        When this method returns, new requests can be issued to the backend. Blocking
        this function would prevent the backend from pulling additional requests from
        Triton into the JetStream engine. This can be done if the kv cache within
        JetStream engine is too loaded.
        We are pushing all the requests on JetStream and let it handle the full traffic.
        """
        for request in requests:
            self.create_task(self.generate(request))
        return None

    def finalize(self):
        """
        Triton virtual method; called when the model is unloaded.
        """
        self.logger.log_info("[jetstream] Issuing finalize to JetStream backend")
        self._shutdown_event.set()
        if self._loop_thread is not None:
            self._loop_thread.join()
            self._loop_thread = None

    # Utility class to convert JetStream response to vLLm compatibel response object
    class RequestOutput:
        def __init__(self):
            self.prompt = ""
            # self.output = bytearray()
            # string
            self.output = ""
