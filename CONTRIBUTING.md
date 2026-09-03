# Contributing

Thanks for helping make text2html2png more useful and trustworthy.

## Good contributions

- a reproducible rendering bug with a synthetic fixture;
- a chart or style improvement that preserves the shared token contract;
- safer cross-platform browser discovery or HTML validation;
- an accessible layout improvement;
- a public example with prompt, HTML, PNG, and clear asset rights;
- documentation for a tested agent or platform.

## Adding a public example

An example is a marketing asset and a regression fixture at the same time, so it has a hard bar. Unless stated otherwise, run these commands from `skills/text2html2png`:

1. Create `examples/<id>.html` following [`references/rendering-contract.md`](skills/text2html2png/references/rendering-contract.md) exactly: inline CSS, one `.wrap` root, the CSP meta tag, no scripts or remote assets.
2. Create `examples/<id>.meta.json` with `id`, `title`, `chart`, `style`, `summary`, `prompt`, `width`, `background`, and `scale`. The `prompt` must plausibly produce the diagram you built.
3. Every visible string must be traceable to the recorded `prompt`. If the diagram shows a subtitle, a scope line, or a reading note, the prompt has to ask for it. This is not automated — reviewers check it by hand — and it is the same no-invention rule the skill applies to real user content.
4. Content must be entirely synthetic and internally consistent. Percentages must match the numbers they derive from, totals must add up, dates must not contradict each other. Use role titles rather than personal names.
5. Reach zero errors **and** zero warnings:

   ```bash
   node scripts/validate-html.mjs --html examples/<id>.html
   node scripts/audit-layout.mjs --html examples/<id>.html --width <width> --strict
   ```

   Fix the HTML. Do not lower a threshold with a flag and do not edit the auditor to make an example pass.
6. Render it and regenerate the gallery:

   ```bash
   npm run render:examples -- --only <id>
   node ../../scripts/build-gallery.mjs
   ```

7. Look at the PNG. The audit measures geometry and colour; it cannot tell you that a label is wrong, a flow direction is ambiguous, or a number is implausible.

## Before opening a pull request

1. Create a branch and keep the change focused.
2. Run:

   ```bash
   cd skills/text2html2png
   npm ci
   npm run check
   ```

3. Inspect every changed PNG at normal document scale.
4. Confirm that user-supplied text is escaped and no new remote request is required by default.
5. Confirm that all examples are synthetic or unquestionably public.

## Privacy and IP checklist

Do not submit:

- company names, logos, design systems, internal domains, or private registries;
- real customer, employee, applicant, incident, financial, or production data;
- document tokens, chat IDs, email addresses, phone numbers, user home paths, logs, or secrets;
- fonts, icons, templates, or screenshots without redistribution rights;
- generated images whose source prompt or embedded metadata contains private information.

For showcase images, state that you own or have permission to publish the prompt, HTML, PNG, and any included assets.

## Style and chart changes

All five style references must define the token contract checked by `scripts/validate-style-contract.mjs`. A chart example must treat coordinates and data as illustrative; do not hard-code values that silently become universal instructions.

Do not add rules that cause the agent to invent data for visual completeness.

## Pull request expectations

- Explain the user-facing problem and why the change solves it.
- Include before/after images for visual changes.
- Add or update a test for behavior changes.
- Keep unrelated formatting and generated files out of the diff.

By contributing, you agree that your contribution is licensed under the MIT License.
