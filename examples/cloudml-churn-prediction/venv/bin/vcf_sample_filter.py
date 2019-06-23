#!/Users/kmilam/Documents/google-repo/professional-services/examples/cloudml-churn-prediction/venv/bin/python

# Author: Lenna X. Peterson
# github.com/lennax
# arklenna at gmail dot com

import argparse
import logging

from vcf import SampleFilter


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="VCF file to filter")
    parser.add_argument("-o", metavar="outfile",
                       help="File to write out filtered samples")
    parser.add_argument("-f", metavar="filters",
                       help="Comma-separated list of sample indices or names \
                        to filter")
    parser.add_argument("-i", "--invert", action="store_true",
                       help="Keep rather than discard the filtered samples")
    parser.add_argument("-q", "--quiet", action="store_true",
                       help="Less output")

    args = parser.parse_args()

    if args.quiet:
        log_level = logging.WARNING
    else:
        log_level = logging.INFO
    logging.basicConfig(format='%(message)s', level=log_level)

    sf = SampleFilter(infile=args.file, outfile=args.o,
                      filters=args.f, invert=args.invert)
    if args.f is None:
        print "Samples:"
        for idx, val in enumerate(sf.samples):
            print "{0}: {1}".format(idx, val)
