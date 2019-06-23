#!/Users/kmilam/Documents/google-repo/professional-services/examples/cloudml-churn-prediction/venv/bin/python
import sys
import argparse
import pkg_resources

import vcf
from vcf.parser import _Filter

def create_filt_parser(name):
    parser = argparse.ArgumentParser(description='Parser for %s' % name,
            add_help=False
            )
    parser.add_argument('rest', nargs=argparse.REMAINDER, help=argparse.SUPPRESS)

    return parser

def create_core_parser():
    # we have to use custom formatted usage, because of the
    # multi-stage argument parsing (otherwise the filter arguments
    # are grouped together with the other optionals)
    parser = argparse.ArgumentParser(description='Filter a VCF file',
            add_help=False,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter,
            usage="""%(prog)s [-h] [--no-short-circuit] [--no-filtered]
              [--output OUTPUT] [--local-script LOCAL_SCRIPT]
              input filter [filter_args] [filter [filter_args]] ...
            """
            )
    parser.add_argument('-h', '--help', action='store_true',
            help='Show this help message and exit.')
    parser.add_argument('input', metavar='input', type=argparse.FileType('rb'), nargs='?', default=None,
            help='File to process (use - for STDIN)')
#    parser.add_argument('filters', metavar='filter', type=str, nargs='*', default=None,
#            help='Filters to use')
    parser.add_argument('--no-short-circuit', action='store_true',
            help='Do not stop filter processing on a site if any filter is triggered')
    parser.add_argument('--output', action='store', default=sys.stdout,
            help='Filename to output [STDOUT]')
    parser.add_argument('--no-filtered', action='store_true',
            help='Output only sites passing the filters')
    parser.add_argument('--local-script', action='store', default=None,
            help='Python file in current working directory with the filter classes')
    parser.add_argument('rest', nargs=argparse.REMAINDER, help=argparse.SUPPRESS)

    return parser

# argument parsing strategy
# loading a script given at the command line poses a difficulty
# for using the argparse in a simple way -- the command line arguments
# are not completely known the first time command line is parsed
# requirements:
#  - display all filters with options grouped by the filters in help screen
#  - check if only arguments for currently used filters are given
#  - to increase legibility when using more filters, arguments should
#    follow the filter name
#  - it is good to specify the filters explicitly by name,
#    because the order of filtering can matter
# solution
# - change the command syntax to
#   vcf_filter.py --core-options input filter1 --filter1-args filter2 filter3
# - parse the core program options with parse_known_args
# - use add_argument_group for filters (subparsers won't work, they require
#   the second command in argv[1])
# - create all-filters parser when displaying the help
# - parse the arguments incrementally on argparse.REMAINDER of the previous

    # TODO: allow filter specification by short name
    # TODO: flag that writes filter output into INFO column
    # TODO: argument use implies filter use
    # TODO: parallelize
    # TODO: prevent plugins raising an exception from crashing the script

def main():
    # dynamically build the list of available filters
    filters = {}

    # parse command line args
    # (mainly because of local_script)
    parser = create_core_parser()
    (args, unknown_args) = parser.parse_known_args()

    # add filter to dictionary, extend help message
    # with help/arguments of each filter
    def addfilt(filt):
        filters[filt.name] = filt
        arg_group = parser.add_argument_group(filt.name, filt.__doc__)
        filt.customize_parser(arg_group)

    # look for global extensions
    for p in pkg_resources.iter_entry_points('vcf.filters'):
        filt = p.load()
        addfilt(filt)

    # add all classes from local script, if present
    if args.local_script != None:
        import inspect
        import os
        sys.path.insert(0, os.getcwd())
        module_name = args.local_script.replace('.py', '')
        mod = __import__(module_name)
        classes = inspect.getmembers(mod, inspect.isclass)
        for name, cls in classes:
            addfilt(cls)

    # go through the filters on the command line
    # one by one, trying to consume only the declared arguments
    used_filters = []
    while len(args.rest):
        filter_name = args.rest.pop(0)
        if filter_name not in filters:
            sys.exit("%s is not a known filter (%s)" % (filter_name, str(filters.keys())))

        # create a parser only for arguments of current filter
        filt_parser = create_filt_parser(filter_name)
        filters[filter_name].customize_parser(filt_parser)
        (known_filt_args, unknown_filt_args) = filt_parser.parse_known_args(args.rest)
        if len(unknown_filt_args):
            sys.exit("%s has no arguments like %s" % (filter_name, unknown_filt_args))

        used_filters.append((filter_name, known_filt_args))
        args.rest = known_filt_args.rest

    # print help using the 'help' parser, so it includes
    # all possible filters and arguments
    if args.help or len(used_filters) == 0 or args.input == None:
        parser.print_help()
        parser.exit()

    inp = vcf.Reader(args.input)

    # build filter chain
    chain = []
    for (name, filter_args) in used_filters:
        f = filters[name](filter_args)
        chain.append(f)
        # add a filter record to the output
        short_doc = f.__doc__ or ''
        short_doc = short_doc.split('\n')[0].lstrip()
        inp.filters[f.filter_name()] = _Filter(f.filter_name(), short_doc)

    # output must be created after all the filter records have been added
    output = vcf.Writer(args.output, inp)

    # apply filters
    short_circuit = not args.no_short_circuit
    drop_filtered = args.no_filtered

    for record in inp:
        output_record = True
        for filt in chain:
            result = filt(record)
            if result == None: continue

            # save some work by skipping the rest of the code
            if drop_filtered:
                output_record = False
                break

            record.add_filter(filt.filter_name())
            if short_circuit: break

        if output_record:
            # use PASS only if other filter names appear in the FILTER column
            #FIXME: is this good idea?
            if record.FILTER is None and not drop_filtered: record.FILTER = 'PASS'
            output.write_record(record)

if __name__ == '__main__': main()
