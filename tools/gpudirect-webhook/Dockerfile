# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

FROM cgr.dev/chainguard/rust:latest-dev as build
USER root
RUN apk update && apk add libssl3 openssl-dev libcrypto3
COPY src src
COPY Cargo.* .
RUN cargo build --release

FROM cgr.dev/chainguard/glibc-dynamic
COPY --from=build /usr/lib/libssl.so.3 /usr/lib/libssl.so.3
COPY --from=build /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.3
COPY --from=build /work/target/release/gpudirect-webhook /usr/local/bin/gpudirect-webhook
ENTRYPOINT ["gpudirect-webhook"]