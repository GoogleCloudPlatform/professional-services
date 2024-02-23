# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.


import functools
import pathlib
import sys
import yaml
import logging
import logging.config


# Set PythonPath if not done in Terminal
root_dir = pathlib.Path(__file__).parent.parent.resolve()
sys.path.append(root_dir)

# create logger
logging.config.fileConfig(root_dir / "logging.conf")
logger = logging.getLogger(__name__)

# Fetch Configs
with open(root_dir / "config/base.yaml") as f:
    base_config = yaml.safe_load(f)

with open(root_dir / "config/predict.yaml") as f:
    predict_config = yaml.safe_load(f)

with open(root_dir / "config/train.yaml") as f:
    train_config = yaml.safe_load(f)


def log(func):
    """Use as Decorator to add Function level Logging"""

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        args_repr = [repr(a) for a in args]
        kwargs_repr = [f"{k}={v!r}" for k, v in kwargs.items()]
        signature = ", ".join(args_repr + kwargs_repr)
        logger.info(f"Started function {func.__name__}")
        logger.debug(f"function {func.__name__} called with args {signature}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"Completed function {func.__name__}")
            return result
        except Exception as exp:
            logger.info(f"Aborted function {func.__name__}")
            logger.exception(f"Exception raised in {func.__name__}. exception: {str(exp)}")
            raise exp

    return wrapper
