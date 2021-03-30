import pytest


def pytest_addoption(parser):
    parser.addoption("--project_id",
                     action="store",
                     help="ID of project to hold test resources")


@pytest.fixture(scope='session')
def project_id(request):
    return request.config.getoption("--project_id")
