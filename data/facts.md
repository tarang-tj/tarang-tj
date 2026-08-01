# Grounding facts

the retrieval harness answers only from this file. every section is something
already public in a repo description, the README, or the portfolio site. if a
question isn't covered here, the harness says so instead of guessing. that is the
whole point.

edit this file to change what it can answer.

## Who TJ is

Tarang "TJ" Jammalamadaka. Applied AI engineer. Spent summer 2026 working on applied
AI at The Coca-Cola Company, Ignite Program, in Atlanta; that internship has ended.
Studying MIS at UW Bothell, class of 2027. Open to applied AI and forward deployed
engineering roles starting June 2027.

The through line in his work: language models are good at language and unreliable at
arithmetic, so he puts the math in code, the judgement in the model, and a test
between them.

## ragproof

An open source RAG evaluation harness: retrieval metrics, answer faithfulness, and
drift detection, benchmarked on BEIR. Python. This is the main thing TJ is building
right now. Repo: github.com/tarang-tj/ragproof

## SyllabusAI

Turns a course syllabus into a calendar you can import into Apple or Google
Calendar, in one step.

## claude-skill-audit

Security-audits an entire Claude Code setup in one command. Scans skills, agents,
hooks, permissions, and MCP configs for prompt-injection, supply-chain, and
secret-exposure risks. TypeScript, zero dependencies.
Repo: github.com/tarang-tj/claude-skill-audit

## the-breaker

A physical dead-man kill-switch for an autonomous AI agent fleet. A guarded switch
gates Raspberry Pi authority tokens and fails safe to HALT: switch off, dead process
and dropped network all halt the agents. The design is complete and open sourced, but
the hardware has NOT been built yet, so it is a design rather than a running system.
Repo: github.com/tarang-tj/the-breaker

## starship-flow-control

An interactive constraint model over a multi-level bill of materials. Pick a build
target and it walks the BOM, finds the binding constraint, and shows what actually
gates completion rather than what merely looks late. Baseline, expedite and
switched-constraint scenarios recompute live. Built on synthetic data to learn the
planning model end to end, not as a claim about any company's operations. Vanilla
JavaScript and WebGL2, 37 tests, no build step.
Live: tarang-tj.github.io/starship-flow-control/

## Data and analytics work

ecommerce-sql: end-to-end SQL analytics on a normalized e-commerce schema: revenue
KPIs, customer lifetime value, market basket analysis, rolling revenue windows in
PostgreSQL. economic-pulse-dashboard: a Python pipeline pulling 7 FRED economic
indicators through a pandas ETL and statistical trend detection into a Streamlit
dashboard. Cohort-Retention-Engine: upload an event CSV, get a cohort retention
matrix, drop-off heatmap, and churn curves. Bottleneck-Simulator: discrete-event
simulation of multi-stage operational workflows with SimPy.

## 3D and frontend work

The portfolio at tarang-tj.github.io is a hand-coded interactive 3D site built with
Three.js and vanilla JS. Coke-Recap is an interactive 3D recap of the Coca-Cola
internship built with React Three Fiber and Vite.

## How to reach TJ

Portfolio: tarang-tj.github.io. LinkedIn: linkedin.com/in/tarang-tj. X: x.com/btwitstj.
HackerRank: hackerrank.com/profile/tarangtj. The fastest way to start a conversation is
to open an issue on this repo.

## How this README works

The panel at the top is an eval report the repo draws itself: one row per system, with
the evidence behind each. It is regenerated daily by a GitHub Action that reads the
GitHub API, recomputes the numbers, and redraws the SVG in a dark and a light variant,
which the README selects between with a picture element.

The retrieval harness is a second Action: it reads the question from the issue,
retrieves the relevant sections of this file, and answers using only those sections,
then posts the answer as a comment, logs the trial to data/eval.json, and redraws the
panel. When a model writes the answer it is Groq running llama-3.1-8b-instant, not
Claude, and the API key is optional: with no key set the harness answers by retrieval
alone rather than failing. The answer is scored for faithfulness with the same code
ragproof ships, using a hash embedder that only counts word overlap, so that score is
a lexical-overlap proxy and not an entailment check.

A trial counts as a break when retrieval finds nothing in the corpus, which is a
deterministic condition rather than a judgement about wording. scripts/build.test.mjs
gates the build: an unsubstituted template token or a missing theme fails there.
Code is in scripts/ in this repo.
