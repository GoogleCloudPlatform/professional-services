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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from textwrap import indent
import click
import json
import random
from faker import Faker

ENCODING = 'UTF8'

FIELD_USER_FIRST_NAME = 'first_name'
FIELD_USER_LAST_NAME = 'last_name'
FIELD_USER_USERNAME = 'username'
FIELD_USER_PASSWORD = 'password'

FIELD_MEMBERSHIP_GROUP = 'group'
FIELD_MEMBERSHIP_MEMBER = 'member'

fake = Faker()

@ click.group()
def cli():
    pass

@ cli.command()
@ click.option(
    "--num-users",
    help="Number of users to create",
    default=10,
)
@click.option(
    "--output-file",
    help="Output file",
    default="users.json",
)
def create_users(num_users, output_file):
    rows = []
    for i in range(1, num_users):
        row = {}
        row[FIELD_USER_FIRST_NAME] = fake.first_name()
        row[FIELD_USER_LAST_NAME] = fake.last_name()
        row[FIELD_USER_USERNAME] = row[FIELD_USER_FIRST_NAME].lower() + "." + \
            row[FIELD_USER_LAST_NAME].lower()
        row[FIELD_USER_PASSWORD] = fake.password()
        rows.append(row)
    write_json(output_file, rows)

@cli.command()
@click.option(
    "--users-file",
    help="Users file",
    default="users.json",
)
@click.option(
    "--groups-file",
    help="Groups file",
    default="groups.json",
)
@click.option(
    "--output-file",
    help="Output file",
    default="memberships.json",
)
def create_memberships(users_file, groups_file, output_file):
    users = read_json(users_file)
    groups = read_json(groups_file)
    rows = []
    for group in groups:
        members = random.sample(users, random.randint(0, len(users) - 1))
        for member in members:
            row = {}
            row[FIELD_MEMBERSHIP_GROUP] = group
            row[FIELD_MEMBERSHIP_MEMBER] = member[FIELD_USER_USERNAME]
            rows.append(row)
    write_json(output_file, rows)

def write_json(file, rows):
    with open(file, 'w') as f:
        json.dump(rows, f, indent=2)

def read_json(file):
    with open(file, 'r',  encoding='UTF8') as f:
        return json.load(f)

if __name__ == "__main__":
    cli()
