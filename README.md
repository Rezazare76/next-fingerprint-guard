# next-fingerprint-guard

A lightweight CLI tool to obfuscate Next.js build fingerprints after production builds.

next-fingerprint-guard helps prevent exposing the exact Next.js version through
static build artifacts and common fingerprinting tools, without modifying runtime behavior.

## Installation

Install as a development dependency:

npm install --save-dev next-fingerprint-guard

## Usage

Run the tool AFTER `next build`.

Basic usage:

NEXT_TARGET_VERSION=13.4.0 next-fingerprint-guard

This rewrites known Next.js version fingerprints inside the `.next` build output.

### Usage with package.json

Add this to your scripts section:

{
"scripts": {
"build": "next build && cross-env NEXT_TARGET_VERSION=13.4.0 next-fingerprint-guard"
}
}

Then run:

npm run build

## What this tool does

- Scans the `.next` production build output
- Rewrites known Next.js version fingerprints
- Does NOT change application logic
- Does NOT affect runtime behavior
- Safe to use in CI/CD pipelines

## Requirements

- Node.js 18 or newer
- A completed `next build` output

## Notes

- This tool is intended for build-time hardening only
- It should always be executed AFTER `next build`
- The package version matches the supported Next.js version

## License

MIT
