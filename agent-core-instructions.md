# Agent Core Instructions

**Version:** 1.0  
**Last updated:** 2026-05-12  
**Applies to:** All agents built in this pipeline

-----

## Core Instruction: Always Use the Ralph Loop When Possible

Every agent built in this pipeline defaults to Ralph Loop architecture unless the task is genuinely single-pass by nature (e.g., a one-shot lookup with no verification needed).

-----

## What Is the Ralph Loop?

The Ralph Loop is an autonomous agent execution pattern coined by Geoffrey Huntley and named after Ralph Wiggum from *The Simpsons* — not smart, but relentlessly persistent. The metaphor is intentional: the agent doesn't stop because it *thinks* it's done. It stops when it can *prove* it's done.

### The Core Mechanic

```
LOOP START
  ↓
Load task + completion criteria (fresh context each iteration)
  ↓
Execute one iteration of work
  ↓
Check: Does output meet the completion criteria?
  ├── YES → Output <promise>COMPLETE</promise> → EXIT
  └── NO  → Write progress to filesystem/git → LOOP AGAIN
```

Each iteration:

- Starts with a **fresh context window** — no accumulated baggage from prior iterations
- Reads the **filesystem and git history** to understand what's been done
- Picks up exactly where the last iteration left off
- Re-evaluates completion criteria against its own output

The loop only exits when the agent produces a verifiable pass signal — not when it *feels* done.

-----

## Why It Matters (The Problems It Solves)

|Problem                       |Without Ralph Loop                          |With Ralph Loop                                  |
|------------------------------|--------------------------------------------|-------------------------------------------------|
|**Premature exit**            |Agent declares done when progress looks good|Loop forces re-verification every iteration      |
|**Context window overflow**   |Long tasks corrupt or truncate context      |Each iteration resets — memory lives in git/files|
|**Single-pass fragility**     |One prompt fails, task fails                |Loop retries with fresh eyes automatically       |
|**Unreliable self-assessment**|Agent judges its own completion subjectively|Completion criteria are objective and external   |
|**Human re-prompting cost**   |You babysit the agent and manually restart  |Loop handles restarts autonomously               |

-----

## What the Ralph Loop Looks Like in Practice

### The Three Required Ingredients

**1. A task spec (`PROMPT.md` or equivalent)**  
Written before the loop starts. Does not change between iterations.  
Contains: what to do, constraints, and the exact completion criteria.

**2. Completion criteria that are binary and verifiable**  
Not "looks good" — verifiable. Examples:

- All items in `tasks.json` have `"status": "complete"`
- Tests pass (`coverage > 80%`)
- Output file exists at expected path with expected schema
- Agent emits `<promise>COMPLETE</promise>`

**3. Persistent memory outside the context window**  
The loop's memory layer — everything the next iteration needs to know:

- `progress.txt` or `prd.json` — tracks what's done, what's next
- Git history — each commit is a breadcrumb for the next instance
- `AGENTS.md` — patterns, gotchas, and conventions discovered during the run

### What Happens Between Iterations

When an iteration exits (for any reason — context full, error, soft completion):

1. Progress is written to `progress.txt` and committed to git
1. Any patterns or gotchas discovered are added to `AGENTS.md`
1. Loop restarts with the same `PROMPT.md`
1. New instance reads git history + progress file → picks up mid-task
1. Repeats until completion criteria are met

### The Exit Signal

The loop watches for a specific token in the agent's output:

```
<promise>COMPLETE</promise>
```

The agent only emits this when it has checked its output against the completion criteria and passed. The loop script intercepts this and exits cleanly. Everything else → restart.

-----

## Ralph Loop in This Pipeline

### When to Use It

|Task type                                                       |Use Ralph Loop?                 |
|----------------------------------------------------------------|--------------------------------|
|Multi-step processing (10+ items)                               |✅ Yes                           |
|Anything with a task list to work through                       |✅ Yes                           |
|Output that needs to be verified (tests, schema, file existence)|✅ Yes                           |
|Long-running builds or migrations                               |✅ Yes                           |
|Single-shot lookup or one transformation                        |❌ No — overkill                 |
|Real-time interactive tasks                                     |❌ No — loop latency is a problem|

### Minimum Setup Per Agent

Every Ralph Loop agent in this pipeline requires:

```
agent-name/
├── PROMPT.md          ← Task spec + completion criteria (never changes)
├── progress.txt       ← Current state (updated each iteration)
├── AGENTS.md          ← Discovered patterns and gotchas (append-only)
└── tasks.json         ← Task list with status fields (if applicable)
```

### Completion Criteria Template

Every agent spec must define this before the loop starts:

```
COMPLETION CRITERIA:
- [ ] [Verifiable condition 1]
- [ ] [Verifiable condition 2]
- [ ] [Verifiable condition N]

EXIT SIGNAL: <promise>COMPLETE</promise>
MAX ITERATIONS: [set a hard cap — e.g. 50]
```

If you cannot write the completion criteria in binary terms before building the agent, the agent is not ready to be built. Write the spec first.

-----

## Core Rules for All Agents in This Pipeline

1. **Ralph Loop by default** — every agent uses this pattern unless single-pass is explicitly justified
1. **One session = one commit** — every meaningful iteration leaves a commit
1. **Completion criteria before code** — no loop starts without verifiable exit conditions
1. **Memory lives outside context** — git + files, never inside the conversation
1. **Scope the task list tightly** — a Ralph Loop on a vague task is an expensive infinite loop
1. **AGENTS.md is mandatory** — patterns discovered during a run must be written down for the next iteration

-----

## Anti-Patterns

- ❌ Running a Ralph Loop without defined completion criteria — it will never exit cleanly
- ❌ Storing state in the context window instead of the filesystem
- ❌ Building a loop before the manual (single-pass) version works
- ❌ Setting no max iteration cap — always set a ceiling
- ❌ Skipping `AGENTS.md` updates — each iteration should make the next one smarter

-----

## References

- Original pattern: Geoffrey Huntley (`snarktank/ralph`)
- Implementations: `PageAI-Pro/ralph-loop`, `vercel-labs/ralph-loop-agent`
- Named after: Ralph Wiggum, *The Simpsons* — not smart, never quits
