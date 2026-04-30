# Bulk empty commits (local cheat sheet)

This file is listed in `.gitignore` so it stays on your machine only. Copy it elsewhere if you want it on another computer.

## When to use

- Try CI, hooks, or branch protection with many commits.
- Use a **throwaway branch**; do **not** merge noise into `main` unless you mean to.

## 1. Create a branch

```bash
cd ~/Desktop/Tycoon   # or your clone path
git checkout main
git pull
git checkout -b commit-test
```

## 2. Create empty commits (no file changes)

**Same message every time (50 commits):**

```bash
for _ in $(seq 1 50); do git commit --allow-empty -m "chore: noop"; done
```

**Rotate a few mundane messages (50 commits):**

```bash
i=0; msgs=( "chore: formatting" "chore: whitespace" "docs: tweak wording" "chore: cleanup" "refactor: minor tidy" "chore: lint" "docs: clarify comment" "chore: align spacing" "style: consistency" "chore: noop" ); while [ "$i" -lt 50 ]; do git commit --allow-empty -m "${msgs[$((i % ${#msgs[@]}))]}"; i=$((i+1)); done
```

Change `50` to any count. Running the loop twice doubles the commits.

## 3. Check

```bash
git log --oneline -10
```

## 4. Put the branch on GitHub

```bash
git push -u origin commit-test
```

Use HTTPS + token, `gh auth login`, or SSH depending on your setup.

## 5. Cleanup (when finished)

**Delete remote branch:**

```bash
git push origin --delete commit-test
```

**Switch back and delete local branch:**

```bash
git checkout main
git branch -D commit-test
```

## Undo before push (reset branch to match remote main)

If you have not pushed yet and want to drop all those commits:

```bash
git checkout commit-test
git reset --hard origin/main
```

(Replace `main` with your default branch name if different.)
