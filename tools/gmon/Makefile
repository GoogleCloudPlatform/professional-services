#!/usr/bin/make
# WARN: gmake syntax
########################################################
# Makefile for $(NAME)
#
# useful targets:
#	make clean -- clean distutils
#	make coverage_report -- code coverage report
#	make flake8 -- flake8 checks
#	make pylint -- source code checks
#	make tests -- run all of the tests
#	make unittest -- runs the unit tests
########################################################
# variable section

NAME = "gmon"

PIP=pip

PYTHON=python
TWINE=twine
COVERAGE=coverage
NOSE_OPTS = --with-coverage --cover-package=$(NAME)
SITELIB = $(shell $(PYTHON) -c "from distutils.sysconfig import get_python_lib; print get_python_lib()")

VERSION := $(shell awk '/__version__/{print $$NF}' $(NAME)/__init__.py | sed "s/'//g")

FLAKE8_IGNORE = E302,E203,E261

########################################################

all: clean install_test tests

flake8:
	flake8 --ignore=$(FLAKE8_IGNORE) $(NAME)/ --max-line-length=80
	flake8 --ignore=$(FLAKE8_IGNORE),E402 tests/ --max-line-length=80

pylint:
	find ./$(NAME) ./tests -name \*.py | xargs pylint --rcfile .pylintrc --ignore-patterns=test_.*?py

clean:
	@echo "Cleaning up distutils stuff"
	rm -rf build
	rm -rf dist
	rm -rf MANIFEST
	rm -rf *.egg-info
	@echo "Cleaning up byte compiled python stuff"
	find . -type f -regex ".*\.py[co]$$" -delete
	@echo "Cleaning up doc builds"
	rm -rf docs/_build
	rm -rf docs/api_modules
	rm -rf docs/client_modules
	@echo "Cleaning up test reports"
	rm -rf report/*

build: clean
	$(PYTHON) setup.py sdist bdist_wheel

deploy:
	$(TWINE) upload dist/*

develop:
	$(PYTHON) setup.py develop

install: clean
	$(PYTHON) setup.py install

install_test:
	$(PIP) install flake8 mock coverage nose pylint pyyaml

tests: flake8 pylint unittest coverage_report

unittest: clean
	nosetests $(NOSE_OPTS) tests/unit/*

coverage_report:
	$(COVERAGE) report --rcfile=".coveragerc"
