"""Locust file for load testing Vector Search endpoints (both public HTTP and private PSC/gRPC)."""

import random
import time
from typing import Any, Callable

import google.auth
import google.auth.transport.requests
import google.auth.transport.grpc
from google.cloud.aiplatform_v1 import MatchServiceClient
from google.cloud.aiplatform_v1 import FindNeighborsRequest
from google.cloud.aiplatform_v1 import IndexDatapoint
from google.cloud.aiplatform_v1.services.match_service.transports import grpc as match_transports_grpc
import grpc
import grpc.experimental.gevent as grpc_gevent
import grpc_interceptor
import locust
from locust import env, FastHttpUser, User, task, events, wait_time, tag
import logging

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s: %(message)s')

# Patch grpc so that it uses gevent instead of asyncio
grpc_gevent.init_gevent()

# gRPC channel cache
_GRPC_CHANNEL_CACHE = {}


class LocustInterceptor(grpc_interceptor.ClientInterceptor):
    """Interceptor for Locust which captures response details."""

    def __init__(self, environment, *args, **kwargs):
        """Initializes the interceptor with the specified environment."""
        super().__init__(*args, **kwargs)
        self.env = environment

    def intercept(
        self,
        method: Callable[[Any, grpc.ClientCallDetails], Any],
        request_or_iterator: Any,
        call_details: grpc.ClientCallDetails,
    ) -> Any:
        """Intercepts message to store RPC latency and response size."""
        response = None
        exception = None
        end_perf_counter = None
        response_length = 0
        start_perf_counter = time.perf_counter()
        try:
            # Response type
            #  * Unary: `grpc._interceptor._UnaryOutcome`
            #  * Streaming: `grpc._channel._MultiThreadedRendezvous`
            response_or_responses = method(request_or_iterator, call_details)
            end_perf_counter = time.perf_counter()

            if isinstance(response_or_responses, grpc._channel._Rendezvous):
                responses = list(response_or_responses)
                # Re-write perf counter to account for time taken to receive all messages.
                end_perf_counter = time.perf_counter()

                # Total length = sum(messages).
                total_length = 0
                for message in responses:
                    message_pb = message.__class__.pb(message)
                    response_length = message_pb.ByteSize()
                    total_length += response_length

                # Re-write response to return the actual responses since above logic has
                # consumed all responses.
                def yield_responses():
                    for rsp in responses:
                        yield rsp

                response_or_responses = yield_responses()
            else:
                response = response_or_responses
                # Unary
                message = response.result()
                message_pb = message.__class__.pb(message)
                response_length = message_pb.ByteSize()
        except grpc.RpcError as e:
            exception = e
            end_perf_counter = time.perf_counter()

        self.env.events.request.fire(
            request_type='grpc',
            name=call_details.method,
            response_time=(end_perf_counter - start_perf_counter) * 1000,
            response_length=response_length,
            response=response_or_responses,
            context=None,
            exception=exception,
        )
        return response_or_responses


def _create_grpc_auth_channel(host: str) -> grpc.Channel:
    """Create a gRPC channel with SSL and auth."""
    credentials, _ = google.auth.default()
    request = google.auth.transport.requests.Request()
    CHANNEL_OPTIONS = [
        ('grpc.use_local_subchannel_pool', True),
    ]
    return google.auth.transport.grpc.secure_authorized_channel(
        credentials,
        request,
        host,
        ssl_credentials=grpc.ssl_channel_credentials(),
        options=CHANNEL_OPTIONS,
    )


def _cached_grpc_channel(host: str,
                         auth: bool,
                         cache: bool = True) -> grpc.Channel:
    """Return a cached gRPC channel for the given host and auth type."""
    key = (host, auth)
    if cache and key in _GRPC_CHANNEL_CACHE:
        return _GRPC_CHANNEL_CACHE[key]

    new_channel = (_create_grpc_auth_channel(host)
                   if auth else grpc.insecure_channel(host))
    if not cache:
        return new_channel

    _GRPC_CHANNEL_CACHE[key] = new_channel
    return _GRPC_CHANNEL_CACHE[key]


def intercepted_cached_grpc_channel(
    host: str,
    auth: bool,
    env: locust.env.Environment,
    cache: bool = True,
) -> grpc.Channel:
    """Return a intercepted gRPC channel for the given host and auth type."""
    channel = _cached_grpc_channel(host, auth=auth, cache=cache)
    interceptor = LocustInterceptor(environment=env)
    return grpc.intercept_channel(channel, interceptor)


# Create a global config class that will be used throughout the application
class Config:
    """Singleton configuration class that loads from config file just once."""
    _instance = None

    def __new__(cls, config_file_path=None):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, config_file_path=None):
        if self._initialized:
            return

        if config_file_path:
            self._load_config(config_file_path)
        self._initialized = True

        # Determine endpoint access type from configuration
        self._determine_endpoint_access_type()

        logging.info(
            f"Loaded configuration: ENDPOINT_ACCESS_TYPE={self.endpoint_access_type}, "
            f"PSC_ENABLED={self.psc_enabled}, MATCH_GRPC_ADDRESS={self.match_grpc_address}, "
            f"ENDPOINT_HOST={self.endpoint_host}, PROJECT_NUMBER={self.project_number}"
        )

    def _load_config(self, file_path):
        """Load configuration from a bash-style config file."""
        self.config = {}

        with open(file_path, 'r') as f:
            for line in f:
                # Skip comments and empty lines
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                # Parse variable assignment
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()

                    # Remove surrounding quotes if present
                    if (value.startswith('"') and
                            value.endswith('"')) or (value.startswith("'") and
                                                     value.endswith("'")):
                        value = value[1:-1]

                    self.config[key] = value

        # Set attributes from the config
        self.project_id = self.config.get('PROJECT_ID')
        self.project_number = self.config.get('PROJECT_NUMBER', self.project_id)
        self.dimensions = int(self.config.get('INDEX_DIMENSIONS', 768))
        self.deployed_index_id = self.config.get('DEPLOYED_INDEX_ID')
        self.index_endpoint_id = self.config.get('INDEX_ENDPOINT_ID')
        self.endpoint_host = self.config.get('ENDPOINT_HOST')

        # Support both old and new config formats
        # New format: ENDPOINT_ACCESS_TYPE
        self.endpoint_access_type = self.config.get('ENDPOINT_ACCESS_TYPE')

        # Old format: PSC_ENABLED
        self.psc_enabled = self.config.get('PSC_ENABLED',
                                           'false').lower() in ('true', 'yes',
                                                                '1')

        # PSC Configuration
        self.match_grpc_address = self.config.get('MATCH_GRPC_ADDRESS')
        self.service_attachment = self.config.get('SERVICE_ATTACHMENT')
        self.psc_ip_address = self.config.get('PSC_IP_ADDRESS')

        # Embedding configuration
        self.sparse_embedding_num_dimensions = int(
            self.config.get('SPARSE_EMBEDDING_NUM_DIMENSIONS', 0))
        self.sparse_embedding_num_dimensions_with_values = int(
            self.config.get('SPARSE_EMBEDDING_NUM_DIMENSIONS_WITH_VALUES', 0))
        self.num_neighbors = int(self.config.get('NUM_NEIGHBORS', 20))
        self.num_embeddings_per_request = int(
            self.config.get('NUM_EMBEDDINGS_PER_REQUEST', 1))
        self.return_full_datapoint = self.config.get(
            'RETURN_FULL_DATAPOINT', 'False').lower() in ('true', 'yes', '1')

        # Network configuration
        self.network_name = self.config.get('NETWORK_NAME', 'default')

        # If we have PSC_IP_ADDRESS but not MATCH_GRPC_ADDRESS, construct it
        if self.psc_ip_address and not self.match_grpc_address:
            self.match_grpc_address = f"{self.psc_ip_address}"

        # Get a clean numeric ID from the full endpoint ID
        self.endpoint_id_numeric = None
        if self.index_endpoint_id and "/" in self.index_endpoint_id:
            self.endpoint_id_numeric = self.index_endpoint_id.split("/")[-1]
        else:
            self.endpoint_id_numeric = self.index_endpoint_id

    def _determine_endpoint_access_type(self):
        """Determine the endpoint access type from configuration."""
        # If ENDPOINT_ACCESS_TYPE is directly specified, use it
        if self.endpoint_access_type:
            # Ensure it's one of the valid options
            if self.endpoint_access_type not in [
                    "public", "vpc_peering", "private_service_connect"
            ]:
                logging.warning(
                    f"Invalid ENDPOINT_ACCESS_TYPE '{self.endpoint_access_type}', defaulting to 'public'"
                )
                self.endpoint_access_type = "public"
        else:
            # Otherwise, derive it from PSC_ENABLED
            if self.psc_enabled:
                self.endpoint_access_type = "private_service_connect"
                logging.info(
                    "Derived endpoint_access_type='private_service_connect' from PSC_ENABLED=true"
                )
            else:
                self.endpoint_access_type = "public"
                logging.info(
                    "Derived endpoint_access_type='public' from PSC_ENABLED=false"
                )

    def get(self, key, default=None):
        """Get a configuration value by key."""
        return getattr(self, key.lower(), self.config.get(key, default))


# Load the config once at startup
config = Config('./locust_config.env')

# Determine if we're using gRPC or HTTP based on endpoint_access_type
USE_GRPC = config.endpoint_access_type in [
    "private_service_connect", "vpc_peering"
]
logging.info(
    f"Using gRPC mode: {USE_GRPC} based on endpoint_access_type={config.endpoint_access_type}"
)


@events.init_command_line_parser.add_listener
def _(parser):
    """Add command line arguments to the Locust environment."""
    # Add user-focused test parameters
    parser.add_argument(
        "--num-neighbors",
        type=int,
        default=config.num_neighbors,
        help="Number of nearest neighbors to find in each query")

    # Add QPS per user control
    parser.add_argument(
        "--qps-per-user",
        type=int,
        default=10,
        help=
        ('The QPS each user should target. Locust will try to maintain this rate, '
         'but if latency is high, actual QPS may be lower.'),
    )

    # Advanced parameters
    parser.add_argument(
        "--fraction-leaf-nodes-to-search-override",
        type=float,
        default=0.0,
        help=
        "Advanced: Fraction of leaf nodes to search (0.0-1.0). Higher values increase recall but reduce performance."
    )

    parser.add_argument(
        "--return-full-datapoint",
        action="store_true",
        default=config.return_full_datapoint,
        help=
        "Whether to return full datapoint content with search results. Increases response size but provides complete vector data."
    )


@events.init.add_listener
def on_locust_init(environment, **kwargs):
    """Set up the host and tags based on configuration."""
    # Determine test mode based on endpoint access type
    is_grpc_mode = config.endpoint_access_type in [
        "private_service_connect", "vpc_peering"
    ]

    # Set default tags based on endpoint access type if no tags were specified
    if hasattr(environment.parsed_options,
               'tags') and not environment.parsed_options.tags:
        if is_grpc_mode:
            environment.parsed_options.tags = ['grpc']
            logging.info(
                "Auto-setting tags to 'grpc' based on endpoint access type 'private_service_connect'"
            )
        else:
            environment.parsed_options.tags = ['http']
            logging.info(
                f"Auto-setting tags to 'http' based on endpoint access type '{config.endpoint_access_type}'"
            )

    # Set host based on endpoint access type if no host was specified
    if not environment.host:
        if is_grpc_mode:
            # PSC/gRPC mode
            grpc_address = config.match_grpc_address
            if grpc_address:
                logging.info(
                    f"Auto-setting host to gRPC address: {grpc_address}")
                environment.host = grpc_address
            else:
                logging.warning(
                    "No MATCH_GRPC_ADDRESS found in configuration, host must be specified manually for PSC/gRPC mode"
                )
        else:
            # HTTP mode
            endpoint_host = config.endpoint_host
            if endpoint_host:
                host = f"https://{endpoint_host}"
                logging.info(f"Auto-setting host to HTTP endpoint: {host}")
                environment.host = host
            else:
                logging.warning(
                    "No ENDPOINT_HOST found in configuration, host must be specified manually for HTTP mode"
                )


# Base class with common functionality
class BaseVectorSearchUser:
    """Base class with common functionality for vector search users."""

    def __init__(self, environment: env.Environment):
        # Read technical parameters from config
        self.deployed_index_id = config.deployed_index_id
        self.index_endpoint_id = config.index_endpoint_id
        self.project_id = config.project_id
        self.project_number = config.project_number
        self.dimensions = config.dimensions
        self.endpoint_id_numeric = config.endpoint_id_numeric

        # Store parsed options needed for requests
        self.num_neighbors = environment.parsed_options.num_neighbors
        self.fraction_leaf_nodes_to_search_override = environment.parsed_options.fraction_leaf_nodes_to_search_override
        self.return_full_datapoints = environment.parsed_options.return_full_datapoint

    def generate_random_vector(self, dimensions):
        """Generate a random vector with the specified dimensions."""
        return [random.randint(-1000000, 1000000) for _ in range(dimensions)]

    def generate_sparse_embedding(self):
        """Generate random sparse embedding based on configuration."""
        values = [
            random.uniform(-1.0, 1.0)
            for _ in range(config.sparse_embedding_num_dimensions_with_values)
        ]
        dimensions = random.sample(
            range(config.sparse_embedding_num_dimensions),
            config.sparse_embedding_num_dimensions_with_values)
        return values, dimensions


class VectorSearchHttpUser(FastHttpUser):
    """HTTP-based Vector Search user using FastHttpUser."""

    abstract = True  # This is a abstract base class

    def __init__(self, environment: env.Environment):
        super().__init__(environment)

        # Initialize base functionality
        self.base = BaseVectorSearchUser(environment)

        # Set up QPS-based wait time if specified
        user_qps = environment.parsed_options.qps_per_user
        if user_qps > 0:
            # Use constant throughput based on QPS setting
            def wait_time_fn():
                fn = wait_time.constant_throughput(user_qps)
                return fn(self)

            self.wait_time = wait_time_fn

        # Set up HTTP authentication
        self.credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"])
        self.auth_req = google.auth.transport.requests.Request()
        self.credentials.refresh(self.auth_req)
        self.token_refresh_time = time.time(
        ) + 3500  # Refresh after ~58 minutes
        self.headers = {
            "Authorization": "Bearer " + self.credentials.token,
            "Content-Type": "application/json",
        }

        # Build the endpoint URL
        self.public_endpoint_url = f"/v1/projects/{self.base.project_number}/locations/us-central1/indexEndpoints/{self.base.endpoint_id_numeric}:findNeighbors"

        # Build the base request
        self.request = {
            "deployedIndexId": self.base.deployed_index_id,
        }
        self.dp = {
            "datapointId": "0",
        }
        self.query = {
            "datapoint": self.dp,
            "neighborCount": self.base.num_neighbors,
        }

        # Add optional parameters if specified
        if self.base.fraction_leaf_nodes_to_search_override > 0:
            self.query[
                "fractionLeafNodesToSearchOverride"] = self.base.fraction_leaf_nodes_to_search_override

        self.request["queries"] = [self.query]
        logging.info("HTTP client initialized")

    def on_start(self):
        """Called when a user starts."""
        # Ensure token is valid at start
        self.credentials.refresh(self.auth_req)
        self.headers["Authorization"] = "Bearer " + self.credentials.token
        self.token_refresh_time = time.time() + 3500

    @task
    @tag('http')
    def http_find_neighbors(self):
        """Execute a Vector Search query using HTTP."""
        # Check if token needs refreshing
        if time.time() > self.token_refresh_time:
            try:
                self.credentials.refresh(self.auth_req)
                self.headers[
                    "Authorization"] = "Bearer " + self.credentials.token
                self.token_refresh_time = time.time() + 3500
                logging.debug("OAuth token refreshed preemptively")
            except Exception as e:
                logging.error(f"Failed to refresh token: {str(e)}")

        # Handle sparse embedding case
        if (config.sparse_embedding_num_dimensions > 0 and
                config.sparse_embedding_num_dimensions_with_values > 0 and
                config.sparse_embedding_num_dimensions_with_values <=
                config.sparse_embedding_num_dimensions):

            values, dimensions = self.base.generate_sparse_embedding()
            self.request["queries"][0]["datapoint"]["sparseEmbedding"] = {
                "values": values,
                "dimensions": dimensions
            }
        else:
            # Standard feature vector case
            self.request["queries"][0]["datapoint"][
                "featureVector"] = self.base.generate_random_vector(
                    self.base.dimensions)

        # Set return_full_datapoint flag based on the parameter
        self.request["queries"][0][
            "returnFullDatapoint"] = self.environment.parsed_options.return_full_datapoint

        # Send the request using FastHttpUser
        with self.client.request(
                "POST",
                url=self.public_endpoint_url,
                json=self.request,
                catch_response=True,
                headers=self.headers,
        ) as response:
            if response.status_code == 401:
                # Refresh token on auth error
                self.credentials.refresh(self.auth_req)
                self.headers[
                    "Authorization"] = "Bearer " + self.credentials.token
                self.token_refresh_time = time.time() + 3500
                response.failure("Authentication failure, token refreshed")
            elif response.status_code == 403:
                # Log detailed error for permission issues
                error_msg = f"Permission denied: {response.text}"
                response.failure(error_msg)
                logging.error(f"HTTP 403 error: {response.text}")
            elif response.status_code != 200:
                # Mark failed responses
                response.failure(
                    f"Failed with status code: {response.status_code}, body: {response.text}"
                )


class VectorSearchGrpcUser(User):
    """gRPC-based Vector Search user."""

    abstract = True  # This is a abstract base class

    def __init__(self, environment: env.Environment):
        super().__init__(environment)

        # Initialize base functionality
        self.base = BaseVectorSearchUser(environment)

        # Set up QPS-based wait time if specified
        user_qps = environment.parsed_options.qps_per_user
        if user_qps > 0:
            # Use constant throughput based on QPS setting
            def wait_time_fn():
                fn = wait_time.constant_throughput(user_qps)
                return fn(self)

            self.wait_time = wait_time_fn

        # Get the PSC address from the config
        self.match_grpc_address = config.match_grpc_address

        # Validate configuration
        if not self.match_grpc_address:
            raise ValueError(
                "MATCH_GRPC_ADDRESS must be provided for PSC/gRPC connections")

        logging.info(f"Using PSC/gRPC address: {self.match_grpc_address}")

        # Create a gRPC channel with interceptor
        channel = intercepted_cached_grpc_channel(
            self.match_grpc_address,
            auth=False,  # PSC connections don't need auth
            env=environment)

        # Create the client
        self.grpc_client = MatchServiceClient(
            transport=match_transports_grpc.MatchServiceGrpcTransport(
                channel=channel))
        logging.info("gRPC client initialized")

    @task
    @tag('grpc')
    def grpc_find_neighbors(self):
        """Execute a Vector Search query using gRPC."""
        # Create datapoint based on embedding type
        if (config.sparse_embedding_num_dimensions > 0 and
                config.sparse_embedding_num_dimensions_with_values > 0 and
                config.sparse_embedding_num_dimensions_with_values <=
                config.sparse_embedding_num_dimensions):
            # Sparse embedding case
            values, dimensions = self.base.generate_sparse_embedding()
            datapoint = IndexDatapoint(datapoint_id='0',
                                       sparse_embedding={
                                           'dimensions': dimensions,
                                           'values': values
                                       })
        else:
            # Dense embedding case
            datapoint = IndexDatapoint(
                datapoint_id="0",
                feature_vector=self.base.generate_random_vector(
                    self.base.dimensions))

        # Create a query
        query = FindNeighborsRequest.Query(
            datapoint=datapoint,
            neighbor_count=self.base.num_neighbors,
        )

        # Add optional parameters if specified
        if self.base.fraction_leaf_nodes_to_search_override > 0:
            query.fraction_leaf_nodes_to_search_override = self.base.fraction_leaf_nodes_to_search_override

        # Create the request - use the proper format with project number
        index_endpoint = f"projects/{self.base.project_number}/locations/us-central1/indexEndpoints/{self.base.endpoint_id_numeric}"

        request = FindNeighborsRequest(
            index_endpoint=index_endpoint,
            deployed_index_id=self.base.deployed_index_id,
            queries=[query],
            return_full_datapoint=self.environment.parsed_options.
            return_full_datapoint,
        )

        # The interceptor will handle performance metrics automatically
        try:
            self.grpc_client.find_neighbors(request)
        except Exception as e:
            logging.error(f"Error in gRPC call: {str(e)}")
            raise  # The interceptor will handle the error reporting


# Concrete implementation classes that dynamically set their abstract attribute
# based on the endpoint access type (grpc vs http)
class HttpVectorSearchUser(VectorSearchHttpUser):
    """Concrete HTTP-based Vector Search user class."""

    # Dynamically set abstract based on the endpoint access type
    # For HTTP endpoints, set abstract=False (available)
    # For gRPC endpoints, set abstract=True (unavailable)
    abstract = USE_GRPC  # abstract=True if using gRPC, abstract=False if using HTTP

    def __init__(self, environment):
        super().__init__(environment)
        logging.info(
            f"HttpVectorSearchUser initialized with abstract={self.abstract}")


class GrpcVectorSearchUser(VectorSearchGrpcUser):
    """Concrete gRPC-based Vector Search user class."""

    # Opposite of HttpVectorSearchUser
    # For gRPC endpoints, set abstract=False (available)
    # For HTTP endpoints, set abstract=True (unavailable)
    abstract = not USE_GRPC  # abstract=True if using HTTP, abstract=False if using gRPC

    def __init__(self, environment):
        super().__init__(environment)
        logging.info(
            f"GrpcVectorSearchUser initialized with abstract={self.abstract}")


# Log which class is being used
if USE_GRPC:
    logging.info(
        "Using gRPC mode, GrpcVectorSearchUser is active and HttpVectorSearchUser is abstract"
    )
else:
    logging.info(
        "Using HTTP mode, HttpVectorSearchUser is active and GrpcVectorSearchUser is abstract"
    )
