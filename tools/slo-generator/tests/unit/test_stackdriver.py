# # Copyright 2019 Google Inc.
# #
# # Licensed under the Apache License, Version 2.0 (the "License");
# # you may not use this file except in compliance with the License.
# # You may obtain a copy of the License at
# #
# #            http://www.apache.org/licenses/LICENSE-2.0
# #
# # Unless required by applicable law or agreed to in writing, software
# # distributed under the License is distributed on an "AS IS" BASIS,
# # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# # See the License for the specific language governing permissions and
# # limitations under the License.
# """
# `test_stackdriver.py`
# Stackdriver backend / exporter tests.
# """
# import os
# import stubs
# from stubs import load_fixture, make_grpc_stub
#
# from google.cloud.monitoring_v3.proto import metric_service_pb2
#
# from slo_generator.backends.stackdriver import StackdriverBackend
# from slo_generator.exporters.stackdriver import StackdriverExporter
#
# ERROR_BUDGET_POLICY = load_fixture('error_budget_policy.yaml')
# TIMESERIE_RESPONSE = load_fixture('time_series_proto.json')
# SLO_REPORT = load_fixture('slo_report.json')
#
# @mock.patch("google.api_core.grpc_helpers.create_channel",
#             return_value=make_grpc_stackdriver_timeseries_stub(nresp=2))
# class TestStackdriver(TestCompute):
#     def setUp(self):
#         self.timestamp = time.time()
#         self.good_event_count = 99
#         self.bad_event_count = 1
#
#     def test_good_bad_ratio():
#
#
#     def test_distribution_cut():
#         pass
#
#
