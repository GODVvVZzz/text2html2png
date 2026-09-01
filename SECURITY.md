# Security policy

## Supported versions

Security fixes are applied to the latest release and the default branch.

## Report a vulnerability

Use GitHub's private vulnerability reporting for this repository. Please do not open a public issue for a suspected vulnerability or include secrets, private documents, or exploit payloads in a public discussion.

Include:

- the affected version and platform;
- a minimal reproduction using synthetic data;
- the expected and observed behavior;
- impact and any known mitigations.

## Rendering trust boundary

text2html2png opens local HTML in a Chrome-family browser. Its validator and renderer reduce risk by rejecting active content, disabling page JavaScript, blocking network requests, preserving the browser sandbox, and limiting output size. These controls are defense in depth, not a guarantee that arbitrary hostile HTML is safe.

Render HTML produced by this skill or content the user explicitly trusts. Do not use the renderer as a general-purpose browser. Avoid `--allow-network` and `--no-sandbox` unless the use case clearly requires them and the environment is trusted.

## Secrets and privacy

Never include API keys, cookies, browser profiles, internal URLs, customer data, employee data, or private source documents in issues, fixtures, screenshots, or community showcases.
