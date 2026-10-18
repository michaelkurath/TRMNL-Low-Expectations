# LOW EXPECTATIONS

A fresh disappointment. Every day.

[GitHub repository](https://github.com/michaelkurath/TRMNL-Low-Expectations) · [All 30 entries](docs/quotes.md) · [Setup and validation](docs/validation.md)

A working TRMNL calendar prototype with a paper binding, perforation, stacked page edges, a large date, and one dry line of advice per local day.

## What is included

- 30 paired English/German entries, written for this prototype.
- Full, half-horizontal, half-vertical, and quadrant Liquid templates.
- Layout rules for OG, X, and X portrait.
- Deterministic daily rotation using the TRMNL account's UTC offset.
- Native title bars and Framework 3.4.3.
- Static data: no quote API, external feed, API key, Serverless function, or daily AI generation.
- Source catalogue, generated settings, HTML previews, and automated checks.

This is a 30-day prototype, not a full-year edition. After 30 local days, the sequence repeats. The two languages show the same entry on the same local date.

## Install manually on TRMNL

1. Create a Private Plugin named LOW EXPECTATIONS.
2. Select the Static strategy. Paste the complete contents of data/static_data.json into Static Data.
3. Set Framework to 3.4.3, dark mode off, and normal screen padding. Use a 60-minute refresh interval initially.
4. Paste docs/custom-fields.yml into the custom form fields editor.
5. Open Edit Markup. Paste src/shared.liquid into Shared.
6. Paste each matching src/*.liquid file into Full, Half Horizontal, Half Vertical, and Quadrant.
7. Select English or Deutsch in the plugin settings and save.
8. Add the plugin to a playlist. Review its output on your actual device before publishing.

The account timezone controls the date. TRMNL supplies utc_offset in seconds; the template adds it to the UTC timestamp before calculating the calendar day. The device displays the new day on its next scheduled update, not necessarily at exactly 00:00.

Static data stays unchanged between refreshes; the Liquid template selects today's line when TRMNL renders the screen. A Force Refresh does not advance the rotation.

A Developer add-on or BYOD licence is required to create a Private Plugin. Installing a future published recipe is a separate flow.

## Preview with trmnlp

The directory follows the usual trmnlp source structure. The supplied .trmnlp.yml selects Europe/Zurich and English for local previews.

    trmnlp serve

Change custom_fields.language to de for German. Change time_zone for another preview location. Do not put account API keys into this project.

The HTML files in previews/ are fixed renders of 17 October 2026, with links to the pinned native framework stylesheet. Open previews/index.html to choose one. They are visual references; the installed Liquid plugin uses the current date.

## Edit the content

Edit data/quotes.json, then run:

    npm run build

This updates src/settings.yml, data/static_data.json, docs/custom-fields.yml, and docs/quotes.md. The display payload excludes editorial topic labels to keep it below 5 KB.

Keep the catalogue length and order stable within a release. Changing either can change which line a date selects. There are no invented celebrity author credits.

## Validate

    npm ci --ignore-scripts
    npm run build
    npm test

GitHub Actions runs the build and daily-selection tests on every push and pull request, and checks that generated catalogue files are current.

For layout rendering, install Playwright Chromium and download the official Framework 3.4.3 and TRMNL font bundles. See docs/validation.md for the environment variables and the limits of local checks.

## Current status

The daily-selection tests and native-framework browser layout checks pass. The prototype has not been uploaded to a live TRMNL account, published as a recipe, or tested on physical hardware. Native hosted rendering remains a release check.

The next content milestone is a carefully edited full-year collection. Weekday-specific and seasonal lines are intentionally deferred until the daily calendar itself has been tested on a device.

## References

- [TRMNL strategies](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [Local time in Liquid](https://help.trmnl.com/en/articles/10693981-advanced-liquid)
- [TRMNL Framework releases and font bundles](https://trmnl.com/framework/releases)
- [trmnlp](https://github.com/usetrmnl/trmnlp)
