#!/usr/bin/make
# WARN: gmake syntax
########################################################
# Makefile for $(NAME)
#
# useful targets:
#	make check -- manifest checks
#	make clean -- clean distutils
#	make coverage_report -- code coverage report
#	make flake8 -- flake8 checks
#	make pylint -- source code checks
#	make rpm -- build RPM package
#	make sdist -- build python source distribution
#	make systest -- runs the system tests
#	make tests -- run all of the tests
#	make unittest -- runs the unit tests
#
# Notes:
# 1) flake8 is a wrapper around pep8, pyflakes, and McCabe.
########################################################
# variable section

NAME = "slo_generator"

PIP=pip

PYTHON=python
TWINE=twine
COVERAGE=coverage
NOSE_OPTS = --with-coverage --cover-package=$(NAME)
SITELIB = $(shell $(PYTHON) -c "from distutils.sysconfig import get_python_lib; print get_python_lib()")

VERSION := $(shell awk '/__version__/{print $$NF}' $(NAME)/__init__.py | sed "s/'//g")

FLAKE8_IGNORE = E302,E203,E261

########################################################

all: clean flake8 pylint tests

flake8:
	flake8 --ignore=$(FLAKE8_IGNORE) $(NAME)/
	flake8 --ignore=$(FLAKE8_IGNORE),E402 tests/

pylint:
	find ./$(NAME) ./tests -name \*.py | xargs pylint --rcfile .pylintrc

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
	$(PIP) install flake8 mock coverage nose

tests: unittest coverage_report

unittest: clean
	nosetests $(NOSE_OPTS) tests/unit/*

coverage_report:
	$(COVERAGE) report --rcfile=".coveragerc"
