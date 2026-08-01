# Self-test suite
#
# Questions a recruiter or an engineer would actually ask on this profile, one
# per line. scripts/run-selftest.mjs runs every line through the same retrieval
# predicate a public trial uses and reports how many the corpus can answer.
#
# The last block is expected to FAIL. Those are questions data/facts.md has
# never covered: failures, opinions, references. They stay in the suite on
# purpose, because a coverage number that always reads 100% measures nothing.
# Salary expectations used to sit here too and were cut: the uncovered list is
# published on the profile, and a hiring manager reading "no answer on pay" is
# not a useful gap, it is a negotiating position stated by accident.
# If coverage ever reaches 1.0 here, the suite went soft, the corpus did not
# become complete.
#
# Lines starting with # are comments. Blank lines are ignored.

# --- what the work is ---
What is ragproof and what problem does it solve?
What benchmark is ragproof evaluated against?
How does SyllabusAI work?
What does claude-skill-audit scan for?
What is the-breaker and how does it fail safe?
What gates a build in starship-flow-control?
What SQL and analytics work has he shipped?
Has he built anything with Three.js in the browser?
Does he have experience with pandas ETL pipelines?
What did he build during the Coca-Cola internship?

# --- who he is and hiring ---
Which company is TJ working at, and in what program?
When does he graduate and what is he studying?
Is he available for a full-time role in 2027?
What is the fastest way to get in touch?

# --- how the profile itself works ---
How is this README generated, and how does the harness avoid making things up?

# --- expected to fail: nothing in data/facts.md covers these ---
What is a project that failed, and what did you take away from it?
Which programming paradigm do you dislike most, and defend that opinion?
Who could give a reference for your teamwork?
