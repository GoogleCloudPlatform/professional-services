import logging
import random
import string
import subprocess

import tableprint as tp

logger = logging.getLogger('Hive2BigQuery')


def calculate_time(start, end):
    """Pretty prints the time taken for an operation

    Args:
        start (float): Start time of an operation
        end (float): End time of an operation

    Returns:
        str: Pretty format the time taken for an operation
    """

    time_taken = int(round((end - start), 0))
    day = time_taken // 86400
    hour = (time_taken - (day * 86400)) // 3600
    minutes = (time_taken - ((day * 86400) + (hour * 3600))) // 60
    seconds = time_taken - ((day * 86400) + (hour * 3600) + (minutes * 60))
    if day != 0:
        return '{} days {} hours {} min {} sec'.format(str(day), str(hour),
                                                       str(minutes),
                                                       str(seconds))
    elif hour != 0:
        return '{} hours {} min {} sec'.format(str(hour), str(minutes),
                                               str(seconds))
    elif minutes != 0:
        return '{} min {} sec'.format(str(minutes), str(seconds))
    else:
        return '{} sec'.format(str(seconds))


def print_and_log(output, level=logging.DEBUG):
    """Pretty prints the statement and logs it to the log file using the
    provided log level"""

    tp.banner(output)
    if level == logging.INFO:
        logger.info(output)
    elif level == logging.ERROR:
        logger.error(output)
    elif level == logging.WARNING:
        logger.warning(output)
    elif level == logging.CRITICAL:
        logger.critical(output)
    else:
        logger.debug(output)


def get_random_string():
    """Generates a random string of 15 characters"""

    return ''.join(
        random.choice(string.ascii_uppercase + string.digits) for _ in
        range(15))


def execute_command(cmd):
    """Executes system command using subprocess module and logs the stdout
    and stderr
    
    Args:
        cmd (List): Command to execute, split into a list
    """

    process = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT)
    while process.poll() is None:
        while True:
            output = process.stdout.readline().decode()
            if output:
                logger.info(output)
            else:
                break
