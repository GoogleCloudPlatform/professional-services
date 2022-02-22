
from migrator import uri
from unittest import TestCase
from migrator.exceptions import InvalidFormatException
import pytest


class ProjectRegion(TestCase):

    def test_region(self):
        project = 'my-project-id'
        region = 'europe-west3'
        uri_value = 'projects/{}/regions/{}'.format(project, region)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        project_region_uri = uri.ProjectRegion(project, region)
        self.assertEqual(project, project_region_uri.project)
        self.assertEqual(region, project_region_uri.region)
        self.assertEqual(uri_value, str(project_region_uri))
        self.assertEqual(uri_value, project_region_uri.uri)
        self.assertEqual(abs_beta_uri_value, project_region_uri.abs_beta_uri)


class ProjectZone(TestCase):

    def test_zone(self):
        project = 'my-project-id'
        zone = 'europe-west4-c'
        region = 'europe-west4'
        uri_value = 'projects/{}/zones/{}'.format(project, zone)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        project_zone_uri = uri.ProjectZone(project, zone)
        self.assertEqual(project, project_zone_uri.project)
        self.assertEqual(zone, project_zone_uri.zone)
        self.assertEqual(region, project_zone_uri.region)
        self.assertEqual(uri_value, str(project_zone_uri))
        self.assertEqual(uri_value, project_zone_uri.uri)
        self.assertEqual(abs_beta_uri_value, project_zone_uri.abs_beta_uri)

    def test_zone_wrong(self):
        with pytest.raises(InvalidFormatException):
            uri.ProjectZone('', 'europe-west3')
        with pytest.raises(InvalidFormatException):
            uri.ProjectZone('', '')


class Instance(TestCase):

    def test_instance(self):
        project = 'my-project-id'
        zone = 'europe-west5-b'
        region = 'europe-west5'
        name = 'instance-id'
        uri_value = 'projects/{}/zones/{}/instances/{}'.format(project, zone,
                                                               name)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        instance_uri = uri.Instance(project, zone, name)
        self.assertEqual(project, instance_uri.project)
        self.assertEqual(zone, instance_uri.zone)
        self.assertEqual(region, instance_uri.region)
        self.assertEqual(name, instance_uri.name)
        self.assertEqual(uri_value, str(instance_uri))
        self.assertEqual(uri_value, instance_uri.uri)
        self.assertEqual(abs_beta_uri_value, instance_uri.abs_beta_uri)

    def test_instance_from_uri(self):
        project = 'my-project-id'
        zone = 'europe-west5-b'
        name = 'instance-id'
        uri_value = 'projects/{}/zones/{}/instances/{}'.format(project, zone,
                                                               name)
        self.assertEqual(uri_value, uri.Instance.from_uri(uri_value).uri)
        self.assertIsNone(uri.Instance.from_uri(None))
        self.assertIsNone(uri.Instance.from_uri(''))

    def test_instance_wrong(self):
        with pytest.raises(InvalidFormatException):
            uri.Instance.from_uri('some string')


class Subnet(TestCase):

    def test_subnet(self):
        project = 'my-project-id'
        region = 'europe-west6'
        name = 'subnet-name'
        uri_value = 'projects/{}/regions/{}/subnetworks/{}'.format(project,
                                                                   region,
                                                                   name)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        subnet_uri = uri.Subnet(project, region, name)
        self.assertEqual(project, subnet_uri.project)
        self.assertEqual(region, subnet_uri.region)
        self.assertEqual(name, subnet_uri.name)
        self.assertEqual(uri_value, str(subnet_uri))
        self.assertEqual(uri_value, subnet_uri.uri)
        self.assertEqual(abs_beta_uri_value, subnet_uri.abs_beta_uri)

    def test_subnet_from_uri(self):
        project = 'my-project-id'
        region = 'europe-west6'
        name = 'subnet-name'
        uri_value = 'projects/{}/regions/{}/subnetworks/{}'.format(project,
                                                                   region,
                                                                   name)
        self.assertEqual(uri_value, uri.Subnet.from_uri(uri_value).uri)
        self.assertIsNone(uri.Subnet.from_uri(None))
        self.assertIsNone(uri.Subnet.from_uri(''))

    def test_subnet_wrong(self):
        with pytest.raises(InvalidFormatException):
            uri.Subnet.from_uri('some string')


class Disk(TestCase):

    def test_disk(self):
        project = 'my-project-id'
        zone = 'europe-west1-d'
        region = 'europe-west1'
        name = 'disk-id'
        uri_value = 'projects/{}/zones/{}/disks/{}'.format(project, zone,
                                                           name)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        disk_uri = uri.Disk(project, zone, name)
        self.assertEqual(project, disk_uri.project)
        self.assertEqual(zone, disk_uri.zone)
        self.assertEqual(region, disk_uri.region)
        self.assertEqual(name, disk_uri.name)
        self.assertEqual(uri_value, str(disk_uri))
        self.assertEqual(uri_value, disk_uri.uri)
        self.assertEqual(abs_beta_uri_value, disk_uri.abs_beta_uri)

    def test_disk_from_uri(self):
        project = 'my-project-id'
        zone = 'europe-west1-d'
        name = 'disk-id'
        uri_value = 'projects/{}/zones/{}/disks/{}'.format(project, zone,
                                                           name)
        self.assertEqual(uri_value, uri.Disk.from_uri(uri_value).uri)
        self.assertIsNone(uri.Disk.from_uri(None))
        self.assertIsNone(uri.Disk.from_uri(''))

    def test_disk_wrong(self):
        with pytest.raises(InvalidFormatException):
            uri.Disk.from_uri('some string')


class MachineType(TestCase):

    def test_machine_type(self):
        project = 'my-project-id'
        zone = 'europe-west1-d'
        region = 'europe-west1'
        machine_type = 'machine_type'
        uri_value = 'projects/{}/zones/{}/machineTypes/{}' \
            .format(project, zone, machine_type)
        abs_beta_uri_value = \
            'https://www.googleapis.com/compute/beta/{}'.format(uri_value)
        machine_type_uri = uri.MachineType(project, zone, machine_type)
        self.assertEqual(project, machine_type_uri.project)
        self.assertEqual(zone, machine_type_uri.zone)
        self.assertEqual(region, machine_type_uri.region)
        self.assertEqual(machine_type, machine_type_uri.machine_type)
        self.assertEqual(uri_value, str(machine_type_uri))
        self.assertEqual(uri_value, machine_type_uri.uri)
        self.assertEqual(abs_beta_uri_value, machine_type_uri.abs_beta_uri)

    def test_machine_type_from_uri(self):
        project = 'my-project-id'
        zone = 'europe-west1-d'
        machine_type = 'machine_type-id'
        uri_value = 'projects/{}/zones/{}/machineTypes/{}' \
            .format(project, zone, machine_type)
        self.assertEqual(uri_value, uri.MachineType.from_uri(uri_value).uri)
        self.assertIsNone(uri.MachineType.from_uri(None))
        self.assertIsNone(uri.MachineType.from_uri(''))

    def test_machine_type_wrong(self):
        with pytest.raises(InvalidFormatException):
            uri.MachineType.from_uri('some string')
