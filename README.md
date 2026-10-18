# Low Expectations

A fresh disappointment. Every day.

[GitHub repository](https://github.com/michaelkurath/TRMNL-Low-Expectations) · [All 365 entries](docs/quotes.md) · [Setup and validation](docs/validation.md) · [Recipe assets](docs/recipe.md)

A TRMNL tear-off calendar with a black binding, fine page edges, a bold date, and one dry line of advice per local day.

![Low Expectations recipe preview](assets/recipe-preview.png)

[Before and after the visual redesign](docs/design/comparison.png)

## What is included

- 365 paired English/German entries, written for this calendar.
- Full, half-horizontal, half-vertical, and quadrant Liquid templates.
- Layout rules for OG, X, and X portrait.
- Deterministic daily rotation using the TRMNL account's UTC offset.
- Native title bars and Framework 3.4.3.
- Static data: no quote API, external feed, API key, Serverless function, or daily AI generation.
- Source catalogue, generated settings, HTML previews, and automated checks.
- SVG and PNG recipe icons, reference screenshots, and public listing text.

This edition has a full year of content: 365 entries, repeating after 365 local days. The two languages show the same entry on the same local date. The rotation continues through New Year and treats 29 February as an ordinary day; entries are not tied to fixed month/day dates.

Version 0.5.0 revises the calendar's visual design: a bold sans-serif date, a restrained binding, and a smaller setup followed by a larger italic punchline. All four layouts retain the native TRMNL title bar. The 365 bilingual entries, their order, and the anchor date remain as in catalogue version 0.4.0.

Version 0.5.1 removes automatic quote hyphenation after TRMNL's generated device PNG split an ordinary English word that remained intact in the live preview.

The collection mixes everyday frustrations, bad advice, technology, travel, shopping, domestic chores, and work.

## Import from the linked GitHub repository

This repository is linked to TRMNL plugin **510794**. Its ID is retained in src/settings.template.yml and the generated src/settings.yml.

1. Open Low Expectations in TRMNL and find its GitHub section.
2. Import the latest changes from GitHub. For this single-plugin repository, leave Folder in the repository blank.
3. Confirm that Strategy is Static, the Static Data contains the catalogue, and the language field is available.
4. Force Refresh and check the calendar.

GitHub-to-TRMNL updates require a manual import. Saving settings or markup in TRMNL automatically exports them in the opposite direction, to GitHub. Import the repository version before saving a newly created blank plugin; otherwise its defaults replace the prepared repository settings.

See [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync) for the sync directions and setup.

## Install manually on TRMNL

1. Create a Private Plugin named Low Expectations.
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

For a quick set of browser screenshots, use `npm run preview` with the framework and font environment variables described in [validation](docs/validation.md). This skips the full catalogue sweep and preserves its validation report.

## Edit the content

Edit data/quotes.json, then run:

    npm run build

This updates src/settings.yml, data/static_data.json, docs/custom-fields.yml, and docs/quotes.md. Entry counts in generated metadata follow the source catalogue. The display payload excludes editorial topic labels; the build reports its byte size.

Keep the 365-entry length and order stable within this edition. Correct text in place while retaining its ID. Changing length or order belongs in a new edition because it can change which line a date selects. There are no invented celebrity author credits.

See [the editorial guide](docs/editorial.md) for tone, translation, and repetition checks before adding more entries.

## Validate

    npm ci --ignore-scripts
    npm run build
    npm run check
    npm test

GitHub Actions checks generated files and runs the daily-selection tests on every push and pull request. Settings are compared by value, so TRMNL's YAML formatting and extra strategy defaults do not trigger a false failure. Catalogue changes and missing form fields still fail validation.

For layout rendering, install Playwright Chromium and download the official Framework 3.4.3 and TRMNL font bundles. See docs/validation.md for the environment variables and the limits of local checks.

## Current status

The daily-selection tests, full-catalogue browser checks, and [24 hosted preview combinations](docs/validation.md#hosted-trmnl-review) pass. The current version and custom icon are installed in TRMNL plugin 510794. Its generated device image and marketplace previews have been reviewed. Physical device verification remains pending; the recipe has not been published.

The full-year catalogue and [publication assets](docs/recipe.md) are complete. Public submission and Chef review await confirmation of TRMNL's plugin licence. Weekday-specific and seasonal lines remain outside this continuous rotation.

## References

- [TRMNL strategies](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [Local time in Liquid](https://help.trmnl.com/en/articles/10693981-advanced-liquid)
- [TRMNL Framework releases and font bundles](https://trmnl.com/framework/releases)
- [trmnlp](https://github.com/usetrmnl/trmnlp)
