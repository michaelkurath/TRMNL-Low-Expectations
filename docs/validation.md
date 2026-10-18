# Validation of version 0.5.0

## Daily selection

13 automated tests pass against the actual Shared and layout Liquid files using LiquidJS 10.21.1, plus the generated settings.

The tests cover:
- all 365 entries in catalogue order before repetition, with the correct local dates across New Year;
- unchanged output on repeat refreshes during one local date;
- local midnight in Zurich, New York, and Nepal;
- spring and autumn DST transitions with the offset supplied by TRMNL;
- leap days, year boundaries, and Gregorian century rules;
- paired English/German entries and localized date labels;
- unknown language and empty-data fallbacks;
- escaped quote text;
- consistent date and entry across all four layouts;
- generated settings matching the current catalogue;
- TRMNL YAML reformatting accepted while changed content or language fields are rejected.

## Browser layout review

11,680 combinations pass without detected content overflow or script errors:
365 entries x 2 languages x 4 layouts x 4 screen profiles.

The profiles are:
- OG: 800 x 480 CSS pixels, 1-bit.
- X: 1040 x 780 CSS pixels, 4-bit.
- X portrait: 780 x 1040 CSS pixels.
- Additional compatibility check: 1024 x 768 CSS pixels.

These figures describe full screens. Native framework margins and mashup gaps reduce the plugin view area. X has a native pixel ratio of 1.8, so captured bitmap dimensions differ from its CSS dimensions.

Framework 3.4.3 and its official TRMNL font bundle were used with Chromium 153.0.8010.0. The browser loads the real native framework stylesheet, not a replacement layout shim. The check measures date, quote, and masthead bounds within the calendar, and the calendar within the view.

The visual design uses a bold Inter date, a narrow black binding, and fine page edges. Entries with a line break have a smaller sans-serif setup and a larger italic serif punchline. Single-line entries remain one serif block. Longer text receives a smaller quote size. German long words may hyphenate or wrap when needed. X portrait quadrants stack the date and quote. Small layouts omit the internal masthead; the native title bar displays Low Expectations in every layout.

The full and small layouts were also reviewed as screenshots in both languages. [Before and after](design/comparison.png) shows the same date and English entry on OG at the same scale. This edition changes presentation; the catalogue remains version 0.4.0 with its original entry order and anchor date.

The machine-readable result is docs/render-results.json.

## Repeat the layout checks

Download and extract the Framework 3.4.3 ZIP and TRMNL font ZIP from the official release page. The framework directory should contain css/plugins.min.css; the font directory should contain the font files themselves.

    npx playwright install chromium
    LE_FRAMEWORK_DIR=/absolute/path/framework \
    LE_FONTS_DIR=/absolute/path/fonts \
    npm run render

Optional environment variables:
- LE_BROWSER_PATH: a Chromium executable, if the default Playwright browser is unavailable.
- LE_LIQUIDJS_PATH: a LiquidJS module, for an existing external runtime.

The script generates local PNGs for visual inspection, static HTML reference previews, and render-results.json. The previews directory's PNGs are ignored by Git. Selected design reference images in docs/design are committed.

For a quick visual pass, replace `npm run render` with `npm run preview` using the same environment variables. It creates the 32 reference screenshots and refreshes the HTML previews, skips the catalogue sweep, and leaves render-results.json unchanged.

## Limits

The checks use LiquidJS, not TRMNL's hosted Ruby Liquid renderer. All template features used are ordinary Liquid assignments, captures, arithmetic, date formatting, conditionals, loops, escaping, and array indexing.

Ruby and Docker were unavailable in the build environment, so trmnlp itself was not run. Do not treat these results as a completed native hosted review or physical device test.

This edition has a 365-day cycle. The rotation continues through New Year and leap days, without mapping entries to fixed month/day dates. Verify the installation and several daily transitions on a real TRMNL before publication. The actual screen update follows the account and device refresh schedule.
