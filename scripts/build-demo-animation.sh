#!/usr/bin/env bash
# Builds the animated README strip from the committed gallery PNGs.
#
# Every frame is a real rendered example, not a mockup. Only examples whose
# aspect ratio is close to the shared canvas are used, so nothing is letterboxed
# into a thin sliver.
#
# Requires ffmpeg. Run from the repository root:
#   bash scripts/build-demo-animation.sh

set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install it, then rerun." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
gallery="${repo_root}/skills/text2html2png/assets/gallery"
output="${repo_root}/assets/demo.gif"

width=900
height=600
seconds_per_frame=1.5

frames=(
  launch-plan-en-paper
  support-snapshot-en-glass
  signup-funnel-en-neon
  studio-org-en-warm
  plan-comparison-en-minimal
  service-architecture-en-dark
)

work="$(mktemp -d)"
trap 'rm -rf "${work}"' EXIT

index=0
for frame in "${frames[@]}"; do
  source_png="${gallery}/${frame}.png"
  if [[ ! -f "${source_png}" ]]; then
    echo "Missing ${source_png}. Run 'npm run render:examples' inside skills/text2html2png first." >&2
    exit 1
  fi
  printf -v padded "%02d" "${index}"
  ffmpeg -loglevel error -y -i "${source_png}" \
    -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0B1020" \
    "${work}/frame-${padded}.png"
  index=$((index + 1))
done

frame_rate="$(python3 -c "print(1/${seconds_per_frame})")"

ffmpeg -loglevel error -y -framerate "${frame_rate}" -i "${work}/frame-%02d.png" \
  -vf "palettegen=max_colors=192:stats_mode=diff" "${work}/palette.png"

ffmpeg -loglevel error -y -framerate "${frame_rate}" -i "${work}/frame-%02d.png" -i "${work}/palette.png" \
  -lavfi "paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
  -loop 0 "${output}"

echo "Wrote ${output}"
ls -l "${output}"
