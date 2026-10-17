# 3D Viewer assets

Static assets downloaded on demand by bPlugins' 3D Viewer plugins for
WordPress / WooCommerce, so they don't have to ship inside the plugin zip.

Plugins download from a **tag** (e.g. `v1`), never from `main`, and verify every
file against SHA-256 hashes hard-coded in the plugin. Published tags are never
moved or deleted; new or changed files go into a new tag.

## `hdri/` — environment lighting presets

| Preset      | File                        |
| ----------- | --------------------------- |
| `apartment` | `lebombo_1k.hdr`            |
| `city`      | `potsdamer_platz_1k.hdr`    |
| `dawn`      | `kiara_1_dawn_1k.hdr`       |
| `forest`    | `forest_slope_1k.hdr`       |
| `lobby`     | `st_fagans_interior_1k.hdr` |
| `night`     | `dikhololo_night_1k.hdr`    |
| `park`      | `rooitou_park_1k.hdr`       |
| `studio`    | `studio_small_03_1k.hdr`    |
| `sunset`    | `venice_sunset_1k.hdr`      |
| `warehouse` | `empty_warehouse_01_1k.hdr` |

Hashes: [`SHA256SUMS`](SHA256SUMS).

Byte-identical to [pmndrs/drei-assets](https://github.com/pmndrs/drei-assets)
`hdri/` at commit `456060a26bbeb8fdf79326f224b6d99b8bcce736`.

## URLs

```
https://raw.githubusercontent.com/bPlugins/3d-viewer-assets/v1/hdri/<file>
https://cdn.jsdelivr.net/gh/bPlugins/3d-viewer-assets@v1/hdri/<file>
```

## `landing-page/` — product landing page

Three versions of a standalone, animated landing page for **3D Product
Configurator for WooCommerce**. Open them in a browser:

| File | Version |
| --- | --- |
| `index.html` | Scroll story: a live 3D product recolors, comes apart, gets engraved, gets priced and drops into AR as you scroll |
| `v2.html` | Studio (light): a working configurator, conditional-logic, placement and click-to-interact demos, FAQ |
| `v3.html` | Night (dark): hotspots, lighting and exploded-view studio, sideways feature chapters, share-link QR builder |

`v2.html` and `v3.html` share `assets/studio3d.js`. All three load three.js
r128, qrcode-generator 1.4.4 and Hanken Grotesk from public CDNs, and all carry
`noindex, nofollow`.

The plugins never download anything from this folder, and it is not part of
any tag's HDRI set.

## License

The HDR images are by [Poly Haven](https://polyhaven.com/hdris) and released
under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public
domain). See [LICENSE](LICENSE).

`landing-page/` is not CC0: it is © bPlugins, and its screenshots show CC BY 4.0
models credited in the page footer and in [LICENSE](LICENSE).
