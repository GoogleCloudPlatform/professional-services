#! /usr/bin/env bash

# Project source type. Must be passed via the yaml configuration
src_type=""

# Source directory
src_dir="${PWD}"

# Reports out directory
report_dir="${PWD}/reports"

display_help=""

while :
do
    case "$1" in
      -t | --type)
        src_type=$2
        shift 2
	    ;;
      -s | --src)
        src_dir=$2
        shift 2
	    ;;
      -o | --out_dir)
        report_dir=$2
        shift 2
	    ;;
      -h | --help)
        display_help="true"
        shift 1
        ;;
      -*)
        echo "Error: Unknown option: $1" >&2
        exit 1
        ;;
      *)  # No more options
        break
        ;;
    esac
done

# Invoke the bundled scan command with the required args
if [ ! -z "$display_help" ]; then
    /usr/local/src/scan --help
    exit 0
else
    mkdir -p ${report_dir}
    export PYTHONPATH=/usr/local/src:$PYTHONPATH:
    /usr/local/src/scan --src ${src_dir} --type $src_type --out_dir ${report_dir} --convert
fi
