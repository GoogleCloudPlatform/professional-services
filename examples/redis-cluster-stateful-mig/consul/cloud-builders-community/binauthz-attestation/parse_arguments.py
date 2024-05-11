"""Parses the arguments passed to the bash script and returns them back to the bash script."""
from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

import argparse
import re
import sys


# Technique for printing custom error and help
# Source: https://stackoverflow.com/a/4042861/862857
class CustomParser(argparse.ArgumentParser):

  def error(self, message):
    print('{}: error: {}'.format(self.prog, message), file=sys.stderr)
    self.print_help()
    sys.exit(1)


parser = CustomParser(prog='create_binauthz_attestation')

# By default, arguments with "--" are optional, so we have
# to make our own argument group so they are required
required_arguments = parser.add_argument_group('required arguments')
required_arguments.add_argument(
    '--artifact-url',
    type=str,
    help='Registry URL for container image',
    required=True)

attestor_args = parser.add_argument_group('Attestor arguments')
attestor_args.add_argument(
    '--attestor',
    type=str,
    help='Fully qualified attestor name or just the attestor name',
    required=True)
attestor_args.add_argument(
    '--attestor-project',
    type=str,
    help='The project that the attestor is a part of')

pgp_args = parser.add_argument_group('PGP key arguments')
pgp_args.add_argument(
    '--pgp-key-fingerprint',
    type=str,
    help='The fingerprint of the PGP key you plan to use')

# If the user is using KMS, they should provide:
kms_args = parser.add_argument_group('KMS key arguments')
kms_args.add_argument(
    '--keyversion',
    type=str,
    help='The fully qualified keyversion or the version number of the KMS key')
kms_args.add_argument(
    '--keyversion-key', type=str, help='The name of the KMS key')
kms_args.add_argument(
    '--keyversion-keyring', type=str, help='The keyring for the KMS key')
kms_args.add_argument(
    '--keyversion-location', type=str, help='The location of the KMS key')
kms_args.add_argument(
    '--keyversion-project',
    type=str,
    help='The project that the KMS key belongs to')

args = parser.parse_args()

# Validate and parse attestor resource flags.
if '/' not in args.attestor:
  if not args.attestor_project:
    parser.error('The --attestor-project option is required if '
                 '--attestor is not a fully qualified '
                 'Attestor resource identifier')
  else:
    args.attestor = 'projects/{project}/attestors/{attestor}'.format(
        project=args.attestor_project, attestor=args.attestor)

attestor_regex = re.compile(r'^projects/[a-z0-9-]*/attestors/[a-zA-Z0-9-_]*$')
if not attestor_regex.search(args.attestor):
  parser.error('Attestor "{attestor}" is not '
               'a valid attestor name'.format(attestor=args.attestor))

# Enforce mutual exclusion of key flag types.
keyversion_args = [
    args.keyversion, args.keyversion_key, args.keyversion_keyring,
    args.keyversion_location, args.keyversion_project
]

if args.pgp_key_fingerprint and any(keyversion_args):
  parser.error('You cannot set --pgp-key-fingerprint and --keyversion related'
               ' options at the same time.')
if not args.pgp_key_fingerprint and not any(keyversion_args):
  parser.error('Either --pgp-key-fingerprint or --keyversion related'
               ' options must be set.')

# Validate and parse keyversion resource flags.
if args.keyversion is not None and '/' not in args.keyversion:
  if not all(keyversion_args):
    parser.error(
        'The --keyversion-key, --keyversion-keyring, --keyversion-location, '
        'and --keyversion-project options are required if --keyversion '
        'is not a fully qualified KMS key resource identifier.')
  else:
    args.keyversion = (
        'projects/{project}/locations/{location}/keyRings/{keyRing}/'
        'cryptoKeys/{cryptoKey}/cryptoKeyVersions/{keyversion}').format(
            project=args.keyversion_project,
            location=args.keyversion_location,
            keyRing=args.keyversion_keyring,
            cryptoKey=args.keyversion_key,
            keyversion=args.keyversion)

keyversion_regex = re.compile(r'^projects/[a-z0-9-]*/locations/[a-z0-9-]*'
                              r'/keyRings/[a-zA-Z0-9-_]*/cryptoKeys/'
                              r'[a-zA-Z0-9-_]*/cryptoKeyVersions/[1-9][0-9]*$')

if args.keyversion is not None and not keyversion_regex.search(args.keyversion):
  parser.error('"{}" is not a valid fully qualified KMS key identifier.'.format(
      args.keyversion))

arguments_list = []
for arg_name, value in args.__dict__.items():
  arguments_list.append('[{name}]="{value}"'.format(
      name=arg_name, value=value or ''))

print('\n'.join(arguments_list))
