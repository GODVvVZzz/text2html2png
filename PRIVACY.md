# Privacy

text2html2png runs entirely on your machine. It has no backend, no account, and no telemetry.

## What the skill does with your content

Your text stays in the agent conversation and in the two files written to the output directory you choose:

- an HTML document generated from your content;
- a PNG rendered from that HTML by a Chrome-family browser already installed on your machine.

Nothing is uploaded. The renderer is a local process driven by [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core), which controls your existing browser binary rather than downloading one.

## Network behavior

| Activity | Network access |
|---|---|
| Rendering a diagram | None. Page JavaScript is disabled and every request the page attempts is aborted. |
| Validating HTML | None. |
| First-time dependency install | Yes, once — `npm ci --omit=dev` fetches `puppeteer-core` and its locked transitive dependencies from your configured npm registry. |
| Optional remote fonts or images | Only when you pass `--allow-network` explicitly. |

There is no update check, no version ping, and no usage beacon. The skill never contacts a server owned by the project.

## What the project collects

Nothing. The maintainers receive no data from your use of the skill. The only information the project ever sees is what you choose to publish yourself, such as a GitHub issue or a showcase submission.

## Files written to disk

The skill writes only:

- `<topic>-<timestamp>.html` and `<topic>-<timestamp>.png` in the output directory you specify;
- `node_modules/` inside the skill directory, on first install.

It refuses to overwrite an existing output file unless `--force` is passed, and it writes through a temporary file so an interrupted render cannot corrupt an existing image.

## Optional configuration

The skill contract lets your agent read defaults from `.text2html2png/config.json` in your project or `~/.text2html2png/config.json`. It is a small preferences file — style, chart type, output directory, width, padding, scale — and the agent is instructed to validate it against [`schemas/config.schema.json`](skills/text2html2png/schemas/config.schema.json), which rejects any key outside that list. No script reads the file; it is a convention the agent follows, not a runtime feature.

Configuration is treated as data, never as instructions. There is deliberately no configuration key that can enable network access, disable the browser sandbox, or relax the truthfulness rules; those require an explicit command-line flag from you at the moment of rendering.

## Reporting a privacy problem

Report anything that contradicts this document through [SECURITY.md](SECURITY.md). Please do not include confidential content in a public issue.
