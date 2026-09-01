# ADK2 Graph Asset - PR Preparation Guide for Google Cloud Professional Services

This guide walks you through preparing your adk2graph_asset for contribution to the [Google Cloud Professional Services](https://github.com/GoogleCloudPlatform/professional-services) repository.

## 📋 Pre-Submission Checklist

### 1. Legal Requirements ✅ CLA (Contributor License Agreement)

**Status**: ⚠️ **Required before PR**

```bash
# Step 1: Sign the CLA at https://cla.developers.google.com/
# This must be done with the same Google account used for your GitHub commits

# Step 2: Verify your git configuration matches your CLA
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Step 3: Verify identity
git config --list | grep user
```

**Important**: 
- CLA is required for EVERY Google project
- Sign with the SAME email as your commits
- You only need to sign once per Google account

---

### 2. Repository Structure

**Target Location in professional-services**:
```
professional-services/
└── tools/
    └── adk2-graph-asset/          ← Your tool goes here
        ├── README.md
        ├── agent/
        │   ├── adk_agent.py
        │   ├── config.py
        │   ├── gcp_config.py
        │   ├── graph_builder.py
        │   ├── __init__.py
        │   └── requirements.txt
        ├── tests/
        │   ├── __init__.py
        │   ├── conftest.py
        │   ├── test_graph_builder.py
        │   ├── test_gcp_config.py
        │   └── test_adk_agent.py
        ├── localtest.py
        ├── main.py
        ├── sample_graph.yaml
        ├── cloudbuild.yaml
        ├── deployment-agent.sh
        └── Makefile                ← NEW: Required for repo build
```

---

### 3. License Headers

**Status**: 🔴 **CRITICAL: Missing on all Python files**

Every source file MUST have a Google LLC license header.

#### Required Header (Add to TOP of every .py file):

```python
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
```

**Files that NEED headers**:
- [ ] `agent/__init__.py`
- [ ] `agent/adk_agent.py`
- [ ] `agent/agent.py`
- [ ] `agent/config.py`
- [ ] `agent/gcp_config.py`
- [ ] `agent/graph_builder.py`
- [ ] `localtest.py`
- [ ] `main.py`
- [ ] `tests/conftest.py`
- [ ] `tests/test_graph_builder.py`
- [ ] `tests/test_gcp_config.py`
- [ ] `tests/test_adk_agent.py` (if created)

#### Script to Add Headers

```bash
#!/bin/bash
# save as add_licenses.sh

HEADER='# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
'

for file in agent/*.py localtest.py main.py tests/test_*.py tests/conftest.py; do
    if [ -f "$file" ]; then
        if ! head -1 "$file" | grep -q "Copyright"; then
            echo "Adding header to $file"
            echo "$HEADER" | cat - "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        fi
    fi
done

echo "✓ Headers added"
```

---

### 4. Code Style & Quality

**Status**: 🟡 **Needs verification**

The repo uses Google style guides and automated checking.

#### 4.1 Format Code with Black

```bash
pip install black==24.1.1 isort==5.13.2

# Format all Python files
black agent/ localtest.py main.py tests/

# Sort imports
isort agent/ localtest.py main.py tests/
```

#### 4.2 Lint with Pylint

```bash
pip install pylint==3.0.3

# Check code quality
pylint agent/ localtest.py main.py
```

Expected score: 8.0+ out of 10

#### 4.3 Type Checking

```bash
pip install mypy==1.8.0

# Check types
mypy agent/ localtest.py main.py
```

---

### 5. Unit Tests

**Status**: ✅ **Done! But needs running**

You already have comprehensive tests in `tests/` directory.

#### Run Tests Locally

```bash
# Install pytest
pip install pytest==7.4.4 pytest-cov==4.1.0

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=agent --cov-report=html

# Check coverage (should be 80%+)
pytest tests/ --cov=agent --cov-report=term-missing
```

**Expected Output**:
```
tests/test_graph_builder.py::TestYamlLoading::test_load_yaml_success PASSED
tests/test_graph_builder.py::TestYamlLoading::test_load_yaml_missing_file PASSED
tests/test_gcp_config.py::TestVertexAiInitialization::test_init_vertex_ai_success PASSED
...
======================== 30 passed in 2.45s =========================
```

#### Coverage Report

```bash
# Generate HTML coverage report
pytest tests/ --cov=agent --cov-report=html:htmlcov

# View in browser
open htmlcov/index.html  # macOS
# or xdg-open htmlcov/index.html  # Linux
```

Target: **Minimum 80% code coverage**

---

### 6. Documentation

**Status**: ✅ **README.md done! Validate structure**

#### Checklist

- [x] Main README.md exists
- [x] Clear project description
- [x] Architecture diagram/explanation
- [x] Prerequisites listed
- [x] Quick start section
- [x] Installation instructions
- [x] Configuration guide
- [x] Usage examples
- [x] Troubleshooting section
- [ ] License attribution (will be inherited)

#### Validate README Quality

```bash
# Check README formatting
pip install mdformat==0.7.16

mdformat README.md

# Spell check (optional but recommended)
pip install pyspelling

# Create .spellcheck file
cat > .spellcheck << 'EOF'
matrix:
  - name: Markdown
    aspell:
      lang: en
    dictionary:
      wordlists:
        - .wordlist
    pipeline:
      - pyspelling.filters.markdown
      - pyspelling.filters.url
    sources:
      - '*.md'
EOF

pyspelling
```

---

### 7. Special Files

#### 7.1 NO LICENSE File Required ✅

```bash
# Make sure you DON'T have a LICENSE file
rm -f LICENSE LICENSE.txt

# The repo-level Apache 2.0 license covers all contributions
```

#### 7.2 Create Makefile

**Status**: 🔴 **Required**

The repo uses Makefiles for build automation. Create this:

```makefile
# Makefile for adk2-graph-asset

.PHONY: help fmt test lint typecheck clean install

help:
	@echo "ADK2 Graph Asset - Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make fmt        - Format code with black"
	@echo "  make lint       - Lint code with pylint"
	@echo "  make typecheck  - Type check with mypy"
	@echo "  make test       - Run pytest tests"
	@echo "  make clean      - Clean build artifacts"

install:
	pip install -q black==24.1.1 isort==5.13.2
	pip install -q pylint==3.0.3 mypy==1.8.0
	pip install -q pytest==7.4.4 pytest-cov==4.1.0
	pip install -r agent/requirements.txt

fmt:
	black agent/ localtest.py main.py tests/
	isort agent/ localtest.py main.py tests/

lint:
	pylint agent/ localtest.py main.py || echo "Lint warnings found"

typecheck:
	mypy agent/ localtest.py main.py || echo "Type check warnings"

test:
	pytest tests/ -v --cov=agent --cov-report=term-missing

clean:
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -delete
	find . -type d -name '*.egg-info' -delete
	rm -rf .pytest_cache .mypy_cache .coverage htmlcov/

.DEFAULT_GOAL := help
```

Save as: `Makefile`

#### 7.3 .gitignore File

```bash
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo
*.sublime-workspace

# Configuration (secrets!)
.env
.env.local
.env.*.local
service-account-key.json

# GCP
.gcp_credentials
credentials.json

# Testing
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/

# ADK/Vertex AI
*.sqlite
*.sqlite-shm
*.sqlite-wal

# OS
.DS_Store
Thumbs.db
EOF
```

---

### 8. Pre-Submission Verification

#### Step-by-Step Checklist

```bash
# 1. Install dependencies
make install

# 2. Format code
make fmt

# 3. Run linter
make lint

# 4. Type checking
make typecheck

# 5. Run tests
make test

# 6. Check coverage
pytest tests/ --cov=agent --cov-report=term-missing | grep -E "TOTAL|^agent"

# 7. Verify no LICENSE file
[ ! -f LICENSE ] && echo "✓ No LICENSE file (correct)" || echo "✗ Remove LICENSE file"

# 8. Verify license headers
grep -l "Copyright 2026 Google LLC" agent/*.py localtest.py main.py

# 9. Run local deployment test
python localtest.py sample_graph.yaml
```

Expected output:
```
✓ No LICENSE file (correct)
agent/__init__.py
agent/adk_agent.py
agent/agent.py
... (all files should be listed)
```

---

## 🚀 Creating the Pull Request

### Step 1: Fork Repository

```bash
# Open https://github.com/GoogleCloudPlatform/professional-services
# Click "Fork" button in top-right

# Clone your fork
git clone https://github.com/YOUR_USERNAME/professional-services.git
cd professional-services
```

### Step 2: Create Branch

```bash
# Create feature branch
git checkout -b add-adk2-graph-asset

# Or follow their convention
git checkout -b tools/adk2-graph-asset
```

### Step 3: Add Your Code

```bash
# Create directory structure
mkdir -p tools/adk2-graph-asset/agent
mkdir -p tools/adk2-graph-asset/tests

# Copy files
cp -r /path/to/adk2graph_asset/* tools/adk2-graph-asset/

# Verify structure
tree tools/adk2-graph-asset/ -L 2
```

### Step 4: Commit Code

```bash
# Stage files
git add tools/adk2-graph-asset/

# Verify changes
git status

# Commit with clear message
git commit -m "feat: Add ADK2 Graph Asset tool for Vertex AI Agent Engine deployment

- Enables YAML-based LLM agent workflows
- Supports local testing and cloud deployment
- Includes comprehensive test suite
- Provides Cloud Build integration

Fixes #XXX (if applicable)"
```

### Step 5: Push to Fork

```bash
# Push to your fork
git push origin tools/adk2-graph-asset

# Verify on GitHub
echo "Check: https://github.com/YOUR_USERNAME/professional-services/tree/tools/adk2-graph-asset"
```

### Step 6: Create Pull Request

1. Go to https://github.com/GoogleCloudPlatform/professional-services
2. Click "Compare & pull request" (should appear automatically)
3. Fill in PR template:

```markdown
# ADK2 Graph Asset - YAML-based LLM Agent Deployment Tool

## Description
Brief description of what this tool does and why it's useful for PSO team.

## Type of Change
- [x] New tool
- [ ] Bug fix
- [ ] Feature enhancement
- [ ] Documentation update

## How Has This Been Tested?
- [x] Local tests: `pytest tests/ -v`
- [x] Coverage: 85%+
- [x] Code style: `black`, `pylint`, `mypy`
- [x] Linting: All checks pass
- [x] Manual testing: `python localtest.py sample_graph.yaml`

## Checklist
- [x] CLA signed
- [x] License headers added to all source files
- [x] README.md with clear usage instructions
- [x] Unit tests with 80%+ coverage
- [x] Code formatted with black
- [x] Linting passes
- [x] No LICENSE file
- [x] Updated top-level README.md (alphabetical order)

## Related Issues
Closes #XXX

## Additional Context
Link to original issue or discussion if applicable.
```

### Step 7: Update Top-Level README

**Important**: Add your tool to professional-services/README.md in alphabetical order

```bash
# Open professional-services/README.md
# Find the "tools" section
# Add entry in alphabetical order:

- [adk2-graph-asset](./tools/adk2-graph-asset) - Deploy LLM agent workflows to Vertex AI Agent Engine using YAML definitions. Includes local testing, multi-node workflows, and automatic session management.
```

---

## 📋 Pre-PR Checklist

```bash
#!/bin/bash
# save as pre_pr_check.sh
# chmod +x pre_pr_check.sh

echo "=== ADK2 Graph Asset - Pre-PR Verification ==="
echo ""

# 1. License headers
echo "1. Checking license headers..."
missing=0
for file in agent/*.py localtest.py main.py tests/test_*.py tests/conftest.py; do
    if [ -f "$file" ]; then
        if ! grep -q "Copyright 2026 Google LLC" "$file"; then
            echo "   ✗ Missing header: $file"
            ((missing++))
        fi
    fi
done
[ $missing -eq 0 ] && echo "   ✓ All files have license headers" || echo "   ✗ $missing files missing headers"

# 2. Code formatting
echo ""
echo "2. Checking code format..."
black --check agent/ localtest.py main.py tests/ 2>&1 | grep -q "would reformat" && {
    echo "   ✗ Code needs formatting. Run: make fmt"
} || echo "   ✓ Code is properly formatted"

# 3. Tests
echo ""
echo "3. Running tests..."
pytest tests/ -q && echo "   ✓ All tests pass" || echo "   ✗ Tests failed"

# 4. Coverage
echo ""
echo "4. Checking test coverage..."
coverage=$(pytest tests/ --cov=agent --cov-report=term-missing 2>&1 | grep "TOTAL" | awk '{print $NF}' | sed 's/%//')
if [ "${coverage%.*}" -ge 80 ]; then
    echo "   ✓ Coverage: $coverage%"
else
    echo "   ✗ Coverage: $coverage% (need 80%+)"
fi

# 5. No LICENSE file
echo ""
echo "5. Checking for LICENSE file..."
[ ! -f LICENSE ] && echo "   ✓ No LICENSE file" || echo "   ✗ Remove LICENSE file"

# 6. README exists
echo ""
echo "6. Checking README.md..."
[ -f README.md ] && echo "   ✓ README.md exists" || echo "   ✗ README.md missing"

# 7. Requirements
echo ""
echo "7. Checking requirements.txt..."
[ -f agent/requirements.txt ] && echo "   ✓ requirements.txt exists" || echo "   ✗ requirements.txt missing"

# 8. Makefile
echo ""
echo "8. Checking Makefile..."
[ -f Makefile ] && echo "   ✓ Makefile exists" || echo "   ✗ Makefile missing"

echo ""
echo "=== Check Complete ==="
```

Run:
```bash
bash pre_pr_check.sh
```

---

## 🔧 Quick Command Reference

```bash
# Full pre-PR setup
make install && make fmt && make lint && make typecheck && make test

# Format code
black agent/ localtest.py main.py tests/
isort agent/ localtest.py main.py tests/

# Run tests with coverage
pytest tests/ --cov=agent --cov-report=html

# Check for issues
pylint agent/ localtest.py main.py
mypy agent/ localtest.py main.py

# Local test
python localtest.py sample_graph.yaml
```

---

## ❓ FAQ

### Q: Do I need to sign the CLA?
**A**: Yes, absolutely. Go to https://cla.developers.google.com/ and sign with the same account you use for GitHub commits.

### Q: Can I have a LICENSE file?
**A**: No. The entire repository is covered by the top-level Apache 2.0 license. Remove any LICENSE files.

### Q: What if tests fail?
**A**: Fix the failing tests before submitting. The CI/CD pipeline will re-run all tests on PR.

### Q: How long does review take?
**A**: Usually 1-2 weeks. Google PSO team reviews code for quality, safety, and usability.

### Q: Can I have multiple commits?
**A**: Yes, but keep them logical. The reviewer may ask you to squash commits before merge.

### Q: What if they request changes?
**A**: Make requested changes, commit, and push to the same branch. The PR will automatically update.

---

## 📞 Support & Questions

- **Issues**: https://github.com/GoogleCloudPlatform/professional-services/issues
- **Discussions**: https://github.com/GoogleCloudPlatform/professional-services/discussions
- **CLA Help**: https://cla.developers.google.com/
- **Contributing Guide**: https://github.com/GoogleCloudPlatform/professional-services/blob/main/CONTRIBUTING.md

---

## Summary: Your Next Steps

1. ✅ Sign CLA at https://cla.developers.google.com/
2. ✅ Add license headers to all Python files
3. ✅ Create Makefile
4. ✅ Update .gitignore
5. ✅ Run: `make install && make fmt && make lint && make typecheck && make test`
6. ✅ Verify all checks pass
7. ✅ Fork professional-services repo
8. ✅ Create feature branch
9. ✅ Copy code to `tools/adk2-graph-asset/`
10. ✅ Update professional-services/README.md
11. ✅ Create pull request
12. ✅ Wait for review (1-2 weeks)

**Good luck! 🚀**

