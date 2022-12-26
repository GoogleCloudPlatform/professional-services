# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import itertools
import sys
import threading
import time

NORMAL = '\033[0m'
BOLD = '\033[1m'
GREEN = '\033[0;32m'
RED = '\033[0;91m'
BLINKING_YELLOW = '\033[33;5m'

ANIMATION = False
ACTIVE_THREAD = None
ACTIVE_TEXT = ''


def fprint(color='', bold=False, text=''):
    print(f"{color}{BOLD if bold else ''}{text}{NORMAL}")


def print_error(text: str):
    print_error_line()
    fprint(color=RED, text=text)


def process_user_input():
    user_agreement = input("Do you want to proceed [y/n]?")
    if user_agreement.lower() in ['n', 'no']:
        exit()
    if user_agreement.lower() in ['y', 'yes']:
        return
    print_error("invalid input.")
    exit(1)


def show_warning_input():
    print(f"{BLINKING_YELLOW}⚠ WARNING! ⚠{NORMAL}")
    print(
        f"{BOLD}Make sure the account you are using to run this script is part of the")
    print("protected principals (see README.md), else you could be locked out of")
    print(f"the organization{NORMAL}")
    print(f"{BLINKING_YELLOW}⚠ WARNING! ⚠{NORMAL}\n")
    process_user_input()


def print_section_title(title: str):
    print(f"\n{BOLD}:: {title.upper()}{NORMAL}")


def print_text_line(text: str):
    global ANIMATION
    global ACTIVE_THREAD
    global ACTIVE_TEXT
    dots = '.' * (72 - len(text))
    ACTIVE_TEXT = f"> {text} {dots} "
    ANIMATION = True
    ACTIVE_THREAD = threading.Thread(target=animate, args=[ACTIVE_TEXT])
    ACTIVE_THREAD.start()


def print_text_line_without_animation(text: str):
    dots = '.' * (72 - len(text))
    print(f"> {text} {dots} ")


def print_success_line():
    global ANIMATION
    ANIMATION = False
    sys.stdout.write(f'\r{ACTIVE_TEXT}{GREEN}{BOLD}DONE{NORMAL}\n')
    sys.stdout.flush()
    ACTIVE_THREAD.join()


def print_error_line():
    global ANIMATION
    ANIMATION = False
    sys.stdout.write(f'\r{ACTIVE_TEXT}{BOLD}{RED}{BOLD}ERROR{NORMAL}\n')
    sys.stdout.flush()
    ACTIVE_THREAD.join()


def animate(text: str):
    for c in itertools.cycle(['|', '/', '-', '\\']):
        if not ANIMATION:
            break
        sys.stdout.write(f'\r{text}{c}')
        sys.stdout.flush()
        time.sleep(0.5)
