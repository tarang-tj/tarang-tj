# Grounding facts

The AMA bot answers only from this file. Every section is something already public
in a repo description, the README, or the portfolio site. If a question isn't
covered here, the bot says so instead of guessing. that is the whole point.

Edit this file to change what the bot knows.

## Who TJ is

Tarang "TJ" Jammalamadaka. Applied AI engineer. Currently working on applied AI and
martech at The Coca-Cola Company, Ignite Program, in Atlanta. Studying MIS at
UW Bothell, class of 2027. Open to applied AI and forward deployed engineering
roles starting June 2027.

## ragproof

An open source RAG evaluation harness: retrieval metrics, answer faithfulness, and
drift detection, benchmarked on BEIR. Python. This is the main thing TJ is building
right now. Repo: github.com/tarang-tj/ragproof

## SyllabusAI

Turns a course syllabus into a calendar you can import into Apple or Google
Calendar, in one step. 500+ users. Live at syllabusai.net.

## claude-skill-audit

Security-audits an entire Claude Code setup in one command. Scans skills, agents,
hooks, permissions, and MCP configs for prompt-injection, supply-chain, and
secret-exposure risks. TypeScript, zero dependencies.
Repo: github.com/tarang-tj/claude-skill-audit

## the-breaker

A physical dead-man kill-switch for an autonomous AI agent fleet. A guarded switch
gates Raspberry Pi authority tokens and fails safe to HALT.
Repo: github.com/tarang-tj/the-breaker

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
Three.js and vanilla JS. 3d-ramenshop-portfolio is a single-file Three.js r128
scene. Coke-Recap is an interactive 3D recap of the Coca-Cola internship built with
React Three Fiber and Vite.

## How to reach TJ

Portfolio: tarang-tj.github.io. LinkedIn: linkedin.com/in/tarang-tj. The fastest way
to start a conversation is to open an issue on this repo.

## How this README works

The panel at the top is regenerated daily by a GitHub Action that reads the GitHub
API, recomputes the numbers, and redraws the SVG. The AMA is a second Action: it
reads the question from the issue, retrieves the relevant sections of this file,
asks Claude to answer using only those sections, posts the answer as a comment, and
rewrites the recent-questions table in the README. Code is in scripts/ in this repo.
