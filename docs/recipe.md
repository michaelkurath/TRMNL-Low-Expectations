# Low Expectations: recipe publication package

![Recipe overview](../assets/recipe-preview.png)

The artwork and listing text are prepared for version 0.5.1. The latest version and icon are installed in TRMNL, and the [hosted review](validation.md#hosted-trmnl-review) passes. Physical device verification remains pending. The recipe has not been submitted: public submission accepts TRMNL's plugin licence, so that final action awaits the creator's confirmation.

## Listing

| Field | Value |
| --- | --- |
| Name | Low Expectations |
| Short description | A fresh disappointment. Every day. |
| Categories | humor, calendar |
| Languages | English, Deutsch |
| Repository | https://github.com/michaelkurath/TRMNL-Low-Expectations |
| Strategy | Static |
| Reference plugin | 510794 |

The full public description is the `author_bio` field in [settings.template.yml](../src/settings.template.yml). It is included in the generated [custom fields](custom-fields.yml) and [settings](../src/settings.yml). The About text explains the daily rotation, language options, layouts, and self-contained data. It exceeds the 100-word threshold described in [TRMNL's recipe guidance](https://help.trmnl.com/en/articles/11395668-recipe-best-practices) for search-engine eligibility; that threshold does not affect TRMNL's own search.

## Artwork

| File | Purpose |
| --- | --- |
| [icon.svg](../assets/icon.svg) | Editable vector: a tear-off calendar with a minus sign |
| [icon-512.png](../assets/icon-512.png) | 512 × 512 PNG with transparency, suitable for icon upload |
| [recipe-preview.png](../assets/recipe-preview.png) | Overview artwork, 1280 × 840 |
| [OG Full, English](../assets/screenshots/og-full-en.png) | Main full-view reference |
| [OG Full, German](../assets/screenshots/og-full-de.png) | German full-view reference |
| [OG Half Horizontal, German](../assets/screenshots/og-half_horizontal-de.png) | Wide mashup reference |
| [OG Half Vertical, English](../assets/screenshots/og-half_vertical-en.png) | Tall mashup reference |
| [OG Quadrant, German](../assets/screenshots/og-quadrant-de.png) | Small mashup reference |
| [X Full, English](../assets/screenshots/x-full-en.png) | Large landscape reference |
| [X portrait Full, German](../assets/screenshots/x-portrait-full-de.png) | Large portrait reference |

The screenshots are actual local browser renders of the Liquid source with TRMNL Framework 3.4.3 and its fonts. They show 17 October 2026, while the installed calendar uses the current local date. They are not photographs of a device or captures from TRMNL's hosted renderer. Native margins and scaling explain why their bitmap sizes differ from nominal screen dimensions; see [validation](validation.md). The source SVG uses only paths and solid black/white fills, with no font or network dependency.

TRMNL accepts a custom [PNG or SVG icon](https://help.trmnl.com/en/articles/17507250-draw-a-plugin-icon-with-ai). The 512-pixel size is this project's export choice; the cited guidance does not specify a mandatory size.

## Finish in TRMNL

Already completed on 18 October 2026: import of the corrected markup, icon upload, the English/German review across 24 hosted layout/profile combinations, restoration of English, and generation of marketplace previews. These results are recorded in [hosted-review.json](hosted-review.json).

The [prepared publication dialog](hosted/publication-dialog-2026-10-18.jpg) remains at the final choice of public visibility; no submission has been made.

1. Open plugin 510794 and import the latest GitHub changes. Keep the repository folder blank.
2. Click the plugin's icon and upload `assets/icon.svg` or `assets/icon-512.png`.
3. Force Refresh in English and confirm the full-view render is current. Check Full and Quadrant on OG, and landscape/portrait on X. Review a German render as well.
4. Set the master instance to English for the listing preview and Force Refresh again. The official recipe preview uses the master instance's latest generated full-view screen; the repository artwork does not replace it automatically.
5. Use **Publish as a Recipe** and read the linked [TRMNL plugin licence](https://trmnl.com/plugin-license). In the current interface, **Public** submits a POST request; it is not a standalone Chef preview. Publishing applies CC BY 4.0 to the design, parsing logic, and markup, together with the licence's support and maintenance terms. Confirm acceptance before that action, then address any Chef findings during submission. A GitHub push does not submit the recipe.

After publication, keep the Recipe Master suitable for its public preview and install the recipe separately for personal use, as [TRMNL recommends](https://help.trmnl.com/en/articles/12772238-demo-data-for-publishing-plugins). [Recipe publishing and preview behaviour](https://help.trmnl.com/en/articles/10122094-plugin-recipes) are documented by TRMNL.

## Regenerate the assets

Use the same framework, font, and browser setup as [the layout checks](validation.md):

    LE_FRAMEWORK_DIR=/absolute/path/framework \
    LE_FONTS_DIR=/absolute/path/fonts \
    npm run recipe-assets

Set `LE_BROWSER_PATH` when using a Chromium executable outside Playwright's default installation. The command first creates fresh reference previews, then exports the icon and artwork. It preserves `docs/render-results.json`, which belongs to the full catalogue sweep. The generated [asset manifest](recipe-assets.json) records the bitmap dimensions, reference date, About word count, and pending release checks.
