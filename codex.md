
# Codex CLI Usage Guide (Limit Saving)

This document contains guidelines for using Codex CLI efficiently while minimizing
token usage and preserving weekly limits.

Place this file in the **root of your repository** and name it:

CODEX.md

Many Codex CLI setups automatically read repository instructions from CODEX.md
when starting a session.

---

## Repository scanning rules

## Repository scanning rules

Never scan dependency folders.

Ignore directories:
node_modules
dist
build
.cache
coverage
uploads

Ignore media files:
*.mp4
*.webm
*.mov
*.jpg
*.png
*.zip
*.tar
*.gz

# 1. Prefer Planning Before Execution

Avoid running large automatic actions immediately.

Instead follow this workflow:

1. Ask Codex to explain the required change.
2. Ask for a step‑by‑step plan.
3. Only then apply the changes.

Example prompt:

Explain what needs to change.
Show a plan.
Then apply the changes.

Why:

Planning reduces repeated analysis and can reduce token usage by 2–3×.

---

# 2. Limit File Scanning

Do NOT allow Codex to scan the entire repository unless necessary.

Always specify the files that should be modified.

Example:

Only modify these files:
- src/newsEditor.ts
- src/videoUpload.ts

Do not scan the entire repository.

This can reduce token usage by up to 10×.

---

# 3. Provide Context Manually

If you know which code section is relevant,
paste it directly into the prompt instead of asking Codex to search for it.

Bad:

Check how video uploads work in the project.

Better:

Here is the upload handler:

[paste code]

Modify it to support video compression.

---

# 4. Break Large Tasks Into Steps

Large tasks cause Codex to read more files.

Better workflow:

Step 1 — implement upload endpoint  
Step 2 — add ffmpeg compression  
Step 3 — add thumbnail generation

Smaller tasks reduce context size.

---

# 5. Ignore Heavy Folders

Codex should never analyze build artifacts or dependencies.

Always ignore folders like:

node_modules  
dist  
build  
uploads  
.cache

Example instruction:

Ignore folders:
node_modules
dist
uploads

---

# 6. Request Short Responses

If explanations are not needed, request only code changes.

Example:

Return only the code patch.
Do not explain.

This reduces output tokens.

---

# 7. Avoid Iterative Fix Cycles

Repeated cycles like:

edit → fix → edit → fix

consume large amounts of tokens.

Prefer a single request:

Implement the full feature.
Return the complete code.

---

# 8. Typical Token Consumption

Without optimization:

100 CLI actions ≈ 2–3 million tokens

With optimization:

100 CLI actions ≈ 200k–400k tokens

This can extend the usable limit by **5–10×**.

---

# Summary

Best practices:

• Plan first, execute second  
• Limit file scanning  
• Provide code context manually  
• Break tasks into steps  
• Ignore heavy folders  
• Request short responses  

These practices significantly reduce Codex CLI token usage and
allow much longer development sessions within the weekly limit.
