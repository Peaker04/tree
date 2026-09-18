# Source Control Workflow

## Branch Strategy

Use short-lived feature branches from `main`.

## Commit Convention

```text
feat(scope): description
fix(scope): description
docs(scope): description
chore(scope): description
refactor(scope): description
test(scope): description
```

## Submodules

`external/hermes-agent` is managed as a git submodule.

Update flow:

```powershell
git submodule update --init --recursive
cd external/hermes-agent
git fetch origin main
git checkout <approved-commit>
cd ../..
git add .gitmodules external/hermes-agent
```

Do not modify upstream files directly for product work.
