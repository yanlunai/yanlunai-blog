#!/usr/bin/env bash
set -euo pipefail

BASE="hugo --gc --cleanDestinationDir --minify"

if [[ "${VERCEL_ENV:-}" == "preview" ]]; then
  echo "Building Preview (including drafts)"
  $BASE -D
else
  echo "Building Production (no drafts)"
  $BASE
fi