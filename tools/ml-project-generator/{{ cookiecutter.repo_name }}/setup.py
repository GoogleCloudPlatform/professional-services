from pathlib import Path

from setuptools import setup

BASE_DIR = Path(__file__).parent

# Load packages from requirements.txt
with open(Path(BASE_DIR, "requirements.txt")) as file:
    required_packages = [ln.strip() for ln in file.readlines()]

test_packages = [
    "pytest",
    "pytest-cov",
    "asyncio",
]

dev_packages = [
    "black",
    "pylint",
    "isort",
    "jupyter",
    "jupyterlab",
    "pre-commit",
]

docs_packages = [
    "mkdocs",
    "mkdocs-macros-plugin",
    "mkdocs-material",
    "mkdocstrings",
]

setup(
    name="{{ cookiecutter.repo_name }}",
    version="{{ cookiecutter.version }}",
    description="{{ cookiecutter.description }}",
    author="{{ cookiecutter.author_name }}",
    author_email="{{ cookiecutter.author_email }}",
    url="",
    keywords=[
        "{{ cookiecutter.project_name }}",
    ],
    py_modules=[],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Data Scientists",
        "Topic :: Software Development :: Build Tools",
        "Programming Language :: Python :: 3",
    ],
    python_requires=">=3.8",
    install_requires=[required_packages],
    extras_require={
        "test": test_packages,
        "dev": test_packages + dev_packages + docs_packages,
        "docs": docs_packages,
    },
    entry_points={
        "console_scripts": [],
    },
)
