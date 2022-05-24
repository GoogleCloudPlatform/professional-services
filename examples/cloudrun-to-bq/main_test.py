# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,

"""
Unit test for main module
"""
import pytest

import main


@pytest.fixture
def _client():
    main.app.testing = True
    return main.app.test_client()


def test_handler_ping(_client):
    '''Test Ping'''
    response = _client.get("/")
    assert response.data.decode() == "BQ insertion Service"
    assert response.status_code == 200
