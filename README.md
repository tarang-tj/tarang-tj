<!--
  README.md is generated from this file. Edit README.tmpl.md, not README.md.
  Rebuild with: node scripts/build.mjs
-->

<img src="assets/hero.svg" alt="Adversarial eval scoreboard: 0 questions asked of this profile's grounded bot, 0 answered from its own facts and 0 unanswered. Updated 2026-07-26." width="880">

hi, i'm tj. i build applied AI systems, and i build the harnesses that check whether they're telling the truth.

right now that's [ragproof](https://github.com/tarang-tj/ragproof), an open source RAG evaluation harness: retrieval metrics, answer faithfulness, and drift detection, benchmarked on BEIR.

applied AI and martech at The Coca-Cola Company, Ignite Program, Atlanta. MIS at UW Bothell, class of 2027.

## try to stump it

most profiles tell you what someone is good at. this one lets you test it.

there's a bot behind this README that answers questions about me using nothing but
[`data/facts.md`](data/facts.md). it has no tools, no web access, and no permission to guess.
your job is to ask something it can't answer.

- **it answers** → the trial is logged as **held**, and you get a cited answer.
- **it can't** → you scored a **break**. your handle goes on the board, and the gap goes
  on the list below until i close it by writing the missing fact.

the score is public either way. an eval you can only pass isn't an eval.

[**→ try to stump it**](https://github.com/tarang-tj/tarang-tj/issues/new?template=stump.yml&title=stump%3A+) &nbsp;·&nbsp; **0** trials · **n/a** answered · **0** gaps still open

### gaps it hasn't closed yet

_Nothing open right now. Every question anyone has asked is covered by the facts file._

### who's broken it

_No one has stumped it yet._

## selected work

|  |  |
| --- | --- |
| **[ragproof](https://github.com/tarang-tj/ragproof)** <br> RAG evaluation harness. retrieval metrics, answer faithfulness, drift detection, benchmarked on BEIR. | **[the-breaker](https://github.com/tarang-tj/the-breaker)** <br> a physical dead-man kill-switch for an autonomous agent fleet. guarded switch to Raspberry Pi authority tokens, fails safe to HALT. |
| **[claude-skill-audit](https://github.com/tarang-tj/claude-skill-audit)** <br> audit an entire Claude Code setup in one command. prompt-injection, supply-chain, and secret-exposure risks. zero dependencies. | **[SyllabusAI](https://syllabusai.net)** <br> turns a course syllabus into a calendar import in one step.|
| **[ecommerce-sql](https://github.com/tarang-tj/ecommerce-sql)** <br> end-to-end analytics on a normalized schema: CLV, market basket, rolling revenue windows in PostgreSQL. | **[portfolio](https://tarang-tj.github.io)** <br> hand-coded interactive 3D site. Three.js, vanilla JS, no framework. |

<details>
<summary><b>how this README works</b></summary>

<br>

two GitHub Actions, no server, no third-party services. the scoreboard at the top is an
SVG this repo draws itself, one mark per trial, the way a test runner prints one
character per test.

```mermaid
flowchart LR
  A[you open an issue] --> B[run trial]
  B --> C[rank sections of<br/>data/facts.md]
  C -->|found something| D[answer, and cite it]
  C -->|found nothing| E[break: you scored]
  D --> F[log the trial]
  E --> F
  F --> G[redraw scoreboard<br/>commit to README]
```

a trial counts as a break when retrieval finds **nothing** in the corpus. that's a
deterministic condition rather than a judgement about how the model phrased itself, so
the score can't be gamed by wording, and the model can't quietly rescue a question the
facts don't actually cover.

- `scripts/collect-stats.mjs`: repo counts, stars and language mix from the GitHub API
- `scripts/render-hero.mjs`: draws the scoreboard. every element's resting state is its
  finished state, so a still frame of the panel is already complete
- `scripts/lib/retrieve.mjs`: ranks facts against the question, and doubles as the answer
  path when no model key is set, so the bot degrades to retrieval rather than to silence
- `scripts/lib/eval-log.mjs`: scoring. it replays every past break against the current
  corpus, so a gap counts as closed only once the facts genuinely cover it
- `scripts/run-trial.mjs`: one trial, start to finish

the model never gets tools, never sees anything outside `data/facts.md`, and every
question is treated as untrusted input and stripped of markup before it is written
anywhere. worst case it says "i don't know", which here is a scoring event rather than
a failure.

anything a stranger writes ends up on a page with my name on it, so moderation stays
human: a junk trial comes off the board by deleting its entry from `data/eval.json`
and closing the issue. the score is honest, not automatic.

</details>

<details>
<summary><b>more repos</b></summary>

<br>

- [economic-pulse-dashboard](https://github.com/tarang-tj/economic-pulse-dashboard): 7 FRED indicators, pandas ETL, trend detection, Streamlit
- [Cohort-Retention-Engine](https://github.com/tarang-tj/Cohort-Retention-Engine): event CSV in, retention matrix and churn curves out
- [Bottleneck-Simulator](https://github.com/tarang-tj/Bottleneck-Simulator): discrete-event simulation of multi-stage workflows with SimPy
- [Coke-Recap](https://github.com/tarang-tj/Coke-Recap): interactive 3D recap of the Coca-Cola internship, React Three Fiber
- [3d-ramenshop-portfolio](https://github.com/tarang-tj/3d-ramenshop-portfolio): single-file Three.js scene
- [operations-forecasting-model](https://github.com/tarang-tj/operations-forecasting-model): multivariate regression and a 15+ metric KPI dashboard
- [wa-housing-homelessness](https://github.com/tarang-tj/wa-housing-homelessness): R analysis of rent and homelessness in Washington State, Zillow ZORI and HUD PIT data

</details>

## elsewhere

[portfolio](https://tarang-tj.github.io) · [linkedin](https://www.linkedin.com/in/tarang-tj/) · 20 public repos · working in Python · TypeScript · JavaScript · C++

open to applied AI and forward deployed engineering roles starting June 2027.
