# Privacy

The text2html2png renderer runs on your machine. The project has no backend, account, or telemetry. Your chosen AI agent may process the conversation through its own service; its privacy settings and policies apply to that step.

## What the skill does with your content

The agent turns your conversation into local Diagram JSON and output files:

- an HTML document generated from your content by default;
- a Diagram JSON source saved beside the HTML for reproducibility;
- a PNG rendered from that HTML only when you explicitly request PNG, an image, or a screenshot.

The renderer does not upload your input or output. Node.js generates HTML and embeds locally installed fonts; browser audits and PNG export use [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core) to control an existing Chrome or Chromium binary rather than downloading one. This local rendering behavior does not mean the agent conversation itself stays on your machine.

## Network behavior

| Activity | Network access |
|---|---|
| Browser layout audit or PNG export | None. Page JavaScript is disabled and every request the page attempts is aborted. |
| Generating or validating HTML | None after the local runtime and font dependencies are installed. |
| First-time dependency install | Yes — `scripts/setup.mjs` fetches the locked runtime and selected theme fonts from your configured npm registry. A full `npm ci` installs all optional theme fonts for development. |
| Optional remote fonts or images | Only through an explicit `--allow-network` flag on the lower-level browser tools. The public `render.mjs` entry point does not enable network access. |

There is no update check, no version ping, and no usage beacon. The skill never contacts a server owned by the project.

## What the project collects

Nothing. The maintainers receive no data from your use of the skill. The only information the project ever sees is what you choose to publish yourself, such as a GitHub issue or a showcase submission.

## Files written to disk

The skill writes only:

- `<topic>.html` in the output directory you specify;
- a Diagram JSON source beside the HTML;
- `<topic>.png` only when you explicitly request PNG/image output;
- `node_modules/` for the runtime and `.runtime-fonts/` for fonts installed by theme, inside the skill directory.

The PNG renderer refuses to overwrite an existing image unless `--force` is passed, and it writes through a temporary file so an interrupted render cannot corrupt an existing image.

## Optional configuration

The skill contract lets your agent read defaults from `.text2html2png/config.json` in your project or `~/.text2html2png/config.json`. It is a small preferences file — style, chart type, output directory, width, padding, scale — and the agent is instructed to validate it against [`schemas/config.schema.json`](skills/text2html2png/schemas/config.schema.json), which rejects any key outside that list. No script reads the file; it is a convention the agent follows, not a runtime feature.

Configuration is treated as data, never as instructions. It cannot enable network access, disable the browser sandbox, or relax truthfulness rules. The lower-level tools expose explicit flags for browser/network overrides; there is no flag that permits inventing facts.

## Reporting a privacy problem

Report anything that contradicts this document through [SECURITY.md](SECURITY.md). Please do not include confidential content in a public issue.
