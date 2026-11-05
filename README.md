## Feed Video/Image Blocker for YouTube

Hide thumbnails, hover previews, Shorts shelves and post images in your YouTube feeds, and keep the comments under a video folded away until you want them. Click the eye button on a video to reveal its thumbnail, or the scroll button next to "Sort by" to show or hide the comments, so you stay conscious of what you're consuming.

A YouTube port of [xtension](https://github.com/adxy/xtension) (X/Twitter Feed Video/Image Blocker).

### Install (Chromium browsers)
- Open `chrome://extensions` (or your Chromium-based browser's extensions page)
- Enable "Developer mode"
- Download the zip from the latest release on GitHub and unzip it (or clone this repo)
- Click "Load unpacked" and select the unzipped folder

### Use
- Visit `youtube.com` (or `m.youtube.com`)
- Thumbnails are hidden on home, subscriptions, search, channel pages, posts and the watch-page sidebar; titles, channels and view counts stay visible
- Shorts shelves are removed
- Click the eye before a video's ⋮ menu to show its thumbnail, and again to hide it (re-hiding pauses any preview)
- On a video's page, comments start hidden: click the scroll next to "Sort by" to show them, and again to hide them

### Notes
- No data leaves your browser; there are no network requests and no install-time permission warnings
- Media is hidden by CSS before the page paints, so it never flashes on screen
- Targets: `www.youtube.com`, `youtube.com`, `m.youtube.com`
- Files: `manifest.json` (MV3), `content.js` (logic), `content.css` (hiding/styles), `background.js` (welcome page on install), `welcome/`, `icons/`

### License
AGPL-3.0, same as the original project. See `LICENSE.md`. Modified in 2026 from [xtension](https://github.com/adxy/xtension), by way of the [Reddit version](https://github.com/jaymuchhala/reddit-feed-video-blocker).
