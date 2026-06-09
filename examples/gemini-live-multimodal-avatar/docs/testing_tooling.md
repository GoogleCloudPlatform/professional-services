# Testing and Tooling

To ensure code quality and prevent regressions, all code must pass the automated test suites, type checkers, and linters before being committed.
These checks are enforced by our GitHub Actions CI pipeline.

## Running the Test Suite (Recommended)

The easiest way to run the full suite of tests, type checks, and static analysis is to use the root Makefile.
This perfectly matches what runs in the CI pipeline.

From the root directory, run:
```bash
make test
```
*(This command sequentially runs backend unit tests, `go vet`, frontend type checks, frontend builds, and frontend tests.)*

## Component-Specific Testing

If you are only working on one side of the stack, you can run those specific tests.

### Frontend (React/Vite)
The frontend uses Vitest for testing.

1.  Navigate to the frontend directory: `cd frontend`
1.  Run the test suite:
    ```bash
    npm run test
    ```
    *(Note: This command automatically runs the ESLint linter before executing the Vitest suite).*

### Backend (Go)
The backend uses standard Go testing tools.

1.  Navigate to the backend directory: `cd backend`
1.  Run the test suite:
    ```bash
    make test
    ```
    *(Note: This command runs both static analysis via `go vet` and unit tests via `go test -v`).*

## Linting and Formatting

### Frontend (ESLint)
We enforce strict linting rules for TypeScript and React code.

1.  Navigate to the frontend directory: `cd frontend`
1.  Run the linter manually:
    ```bash
    npm run lint
    ```

### Backend (Go Fmt)
All Go code must be formatted according to the standard Go style guide.

1.  Navigate to the backend directory: `cd backend`
1.  Format the code:
    ```bash
    make fmt
    ```

## Type Checking (Frontend Only)

TypeScript compilation checks are required to catch type errors before runtime.

1.  Navigate to the frontend directory: `cd frontend`
1.  Run the type checker:
    ```bash
    npm run typecheck
    ```
