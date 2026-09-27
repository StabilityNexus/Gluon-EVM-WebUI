# Gluon-EVM WebUI Brand Guide

Gluon-EVM and Gluon-EVM WebUI are two repositories for the same Gluon EVM project.

They share the same Gluon project logo, favicon, and Stability Nexus organization logo.

## Shared Brand Assets
- `logo.svg` — primary Gluon logo
- `favicon.svg` — Gluon favicon
- `org-logo.svg` — Stability Nexus organization logo

These assets should match the canonical files in the Gluon-EVM repository.

## WebUI Theme
`app/globals.css` is the implementation source of truth for the WebUI light/dark theme.

### Light
- white background
- black primary text
- light-gray surfaces
- black primary actions with white text
- light neutral borders

### Dark
- black background
- white text
- near-black cards
- gray secondary surfaces
- white primary actions with black text
- dark neutral borders

### Ambient Accent
The current WebUI uses subtle ambient values such as `#FFFFFF` and `#D9E2FF`.

`#D9E2FF` is an ambient highlight, not the primary action color.

## Typography
General UI: Inter, Helvetica Neue, Arial, system sans-serif.

Technical/display: Space Mono, Orbitron, Courier New.

## Logo Rules
- use the same Gluon logo as the contract repository
- use the same favicon
- use the same Stability Nexus organization logo
- do not distort or arbitrarily recolor the marks
- prefer SVG
- do not create a separate WebUI-only Gluon identity without maintainer approval

## Theme Review
Every global visual change should be checked in light mode, dark mode, mobile, and desktop.
