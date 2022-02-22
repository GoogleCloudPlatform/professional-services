# Cloud AI Vision Utils

This package contains tools for preparing data for Cloud AI Vision APIs.
Currently available:
- Tool to convert a directory of PASCAL VOC files into AutoML dataset CSV.
- Tool to generate an AutoML dataset CSV from nested directory of images.

## Installation

To install with pip, change to this packages's top directory and run:
```
pip install .
```

## Basic Usage

This package uses [Python Fire](https://github.com/google/python-fire) for
handling command-line execution.

Run `cvutil` the following to get a list of supported commands.

Example: To generate an AutoML Object Detection (OD) CSV from PASCAL VOC files:

```
cvutil annotations pascal-to-csv <input_dir>  <output CSV file path>
```

You can find more information about a command by running
`cvutil <subcommand path> -- --help`.
Example:
```
cvutil annotations pascal-to-csv  -- --help
```

## Running the tests

To run all Python unit tests using nose.
In the top directory, run:
```
nosetests
```

Using `unittest`:
```
python -m unittest discover -s cloud_vision_utils -p '*_test.py'
```

## License

Licensed under the Apache 2.0 License.
