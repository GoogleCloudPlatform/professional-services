import datetime

import pytest

from dagfactory import utils


class TestGetStartDate(object):
    now = datetime.datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)

    def test_date_no_timezone(self):
        expected = datetime.datetime(2018, 2, 1, 0, 0)
        actual = utils.get_start_date(datetime.date(2018, 2, 1))
        assert actual == expected

    def test_datetime_no_timezone(self):
        expected = datetime.datetime(2018, 2, 1, 0, 0)
        actual = utils.get_start_date(datetime.datetime(2018, 2, 1))
        assert actual == expected

    def test_bad_date(self):
        with pytest.raises(Exception):
            utils.get_start_date("bad_date")


class TestGetTimeDelta(object):
    def test_seconds(self):
        expected = datetime.timedelta(0, 25)
        actual = utils.get_time_delta("25 seconds")
        assert actual == expected

    def test_minutes(self):
        expected = datetime.timedelta(0, 60)
        actual = utils.get_time_delta("1 minute")
        assert actual == expected

    def test_hours(self):
        expected = datetime.timedelta(0, 18000)
        actual = utils.get_time_delta("5 hours")
        assert actual == expected

    def test_days(self):
        expected = datetime.timedelta(10)
        actual = utils.get_time_delta("10 days")
        assert actual == expected

    def test_combo(self):
        expected = datetime.timedelta(0, 3600)
        actual = utils.get_time_delta("1 hour 30 minutes")
        assert actual == expected

    def test_bad_date(self):
        with pytest.raises(Exception):
            utils.get_time_delta("bad_date")


class TestMergeConfigs(object):
    def test_same_configs(self):
        dag_config = {"thing": "value1"}
        default_config = {"thing": "value2"}

        expected = {"thing": "value1"}
        actual = utils.merge_configs(dag_config, default_config)
        assert actual == expected

    def test_different_configs(self):
        dag_config = {"thing": "value1"}
        default_config = {"thing2": "value2"}

        expected = {"thing": "value1", "thing2": "value2"}
        actual = utils.merge_configs(dag_config, default_config)
        assert actual == expected

    def test_nested_configs(self):
        dag_config = {"thing": {"thing3": "value3"}}
        default_config = {"thing2": "value2"}

        expected = {"thing": {"thing3": "value3"}, "thing2": "value2"}
        actual = utils.merge_configs(dag_config, default_config)
        assert actual == expected

