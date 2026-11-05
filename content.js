// Feed items on www.youtube.com and m.youtube.com. Keep in sync with content.css.
const ITEM_SELECTOR = [
  'yt-lockup-view-model',
  'ytm-shorts-lockup-view-model',
  'ytd-video-renderer',
  'ytd-rich-grid-media',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-playlist-renderer',
  'ytd-compact-playlist-renderer',
  'ytd-radio-renderer',
  'ytd-compact-radio-renderer',
  'ytd-playlist-video-renderer',
  'ytd-playlist-panel-video-renderer',
  'ytd-reel-item-renderer',
  'ytd-backstage-post-renderer',
  'ytd-post-renderer',
  'ytm-video-with-context-renderer',
  'ytm-compact-video-renderer',
  'ytm-compact-playlist-renderer',
  'ytm-playlist-video-renderer',
  'ytm-backstage-post-renderer',
  'ytm-post-renderer'
].join(',');

// Thumbnails, which content.css already hides. Here they're used to find the
// wrapper around each one, and to decide whether an item needs a button.
const THUMB_SELECTOR = [
  'ytd-thumbnail',
  'ytd-playlist-thumbnail',
  'yt-thumbnail-view-model',
  'yt-collection-thumbnail-view-model',
  'ytm-thumbnail-cover',
  'ytm-playlist-thumbnail'
].join(',');

// Post attachments content.css hides. An attached video is a nested item.
const POST_MEDIA_SELECTOR = [
  'ytd-backstage-image-renderer',
  'ytd-post-multi-image-renderer',
  'ytm-backstage-image-renderer',
  'ytm-post-multi-image-renderer',
  'ytd-backstage-poll-renderer img',
  'ytm-backstage-poll-renderer img'
].join(',');

// The item's title and details; a thumbnail's wrapper never contains these.
const TEXT_SELECTOR = 'h3, h4, #video-title, #meta, #details, yt-lockup-metadata-view-model, [role="heading"]';

// Where the ⋮ menu lives, most specific first: posts, the older ytd-* items,
// m.youtube.com items, then lockups (the wrapper around their menu button) and
// Shorts lockups, whose menu has no element of its own to match.
const MENU_SELECTORS = [
  '#action-menu',
  '#menu',
  'ytm-bottom-sheet-renderer',
  'ytm-menu-renderer',
  'yt-lockup-metadata-view-model > :has(> button-view-model)',
  '[class*="MetadataMenu"]'
];

const EYE_OPEN_PATH = 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const EYE_CLOSED_PATH = 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z';

/* ---------- Items ---------- */

// The thumbnail element can sit inside a link or frame that keeps its size
// once the thumbnail is gone. Walk up while the ancestor adds no text of its
// own (the duration badge is the thumbnail's own text) and holds no title, and
// mark the largest such wrapper. Class names change often, so this is
// structural. Skipped until the title has rendered, so a half-built item
// can't be mistaken for one big thumbnail.
function markThumbnails(item) {
  if (!item.querySelector('h3, #video-title')) return;
  item.querySelectorAll(THUMB_SELECTOR).forEach((thumb) => {
    if (thumb.closest('.yfvb-media') || thumb.closest(ITEM_SELECTOR) !== item) return;
    const text = thumb.textContent.trim();
    let block = thumb;
    let node = thumb.parentElement;
    while (node && node !== item && !node.querySelector(TEXT_SELECTOR) && node.textContent.trim() === text) {
      block = node;
      node = node.parentElement;
    }
    if (block !== thumb) block.classList.add('yfvb-media');
  });
}

function hasMedia(item) {
  return !!item.querySelector(THUMB_SELECTOR + ', ' + POST_MEDIA_SELECTOR + ', .yfvb-media');
}

// YouTube reuses item elements for other videos (sidebar on a new watch page,
// feed refreshes), so a reveal is tied to the video's link and dropped when
// that changes.
function itemKey(item) {
  const link = item.querySelector('a[href*="/post/"], a[href*="/watch"], a[href*="/shorts/"], a[href*="list="]');
  return link ? link.getAttribute('href') : '';
}

function setIcon(button, revealed) {
  button.classList.toggle('content-visible', revealed);
  button.setAttribute('aria-pressed', String(revealed));
  button.setAttribute('aria-label', revealed ? 'Hide media' : 'Show hidden media');
  button.title = revealed ? 'Hide media' : 'Show media';
  const path = button.querySelector('svg path');
  if (path) path.setAttribute('d', revealed ? EYE_CLOSED_PATH : EYE_OPEN_PATH);
}

// Hidden players can keep playing; best-effort pause on re-hide.
function pauseMedia(root) {
  root.querySelectorAll('video, audio').forEach((el) => {
    try { el.pause(); } catch (_) { /* ignore */ }
  });
}

// A post's attached video is an item of its own; it follows the post.
function setRevealed(item, revealed) {
  [item, ...item.querySelectorAll(ITEM_SELECTOR)].forEach((el) => {
    if (revealed) el.setAttribute('data-yfvb-revealed', itemKey(el));
    else el.removeAttribute('data-yfvb-revealed');
  });
}

function toggleItem(item, button) {
  const revealed = !item.hasAttribute('data-yfvb-revealed');
  setRevealed(item, revealed);
  setIcon(button, revealed);
  if (!revealed) pauseMedia(item);
  // The row's height changes, so the eye may need lining up with the ⋮ again.
  placeButton(item, button);
}

// Buttons this script made. A copy of the markup (e.g. restored on Back)
// brings buttons back without their click handlers; those get replaced.
const ownButtons = new WeakSet();

function findButton(item) {
  const button = [...item.querySelectorAll('.yfvb-btn')].find((b) => b.closest(ITEM_SELECTOR) === item);
  if (!button || ownButtons.has(button)) return button || null;
  button.remove();
  return null;
}

// YouTube enforces Trusted Types, so icons are built node by node, never from
// markup strings.
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

// The eye's path is filled in by setIcon.
function eyeIcon() {
  const svg = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  svg.appendChild(svgEl('path'));
  return svg;
}

let scrollMasks = 0;

// A paper scroll: top curl, sheet with text lines, rolled-up bottom. Drawn as
// solid shapes with the curl holes and lines cut out by a mask, so it takes
// the button's colour like the eye. The .yfvb-slash parts (a strike-through
// with a gap cut around it, like the crossed-out eye) show while comments are
// open. Each button has its own mask, as there can be two comment sections.
function scrollIcon() {
  const svg = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  const id = 'yfvb-scroll-mask-' + ++scrollMasks;
  const mask = svgEl('mask', { id });
  [
    ['circle', { cx: 5.5, cy: 5.5, r: 3, fill: '#fff' }],
    ['rect', { x: 5.5, y: 2.5, width: 13, height: 16, rx: 2, fill: '#fff' }],
    ['rect', { x: 7.5, y: 16, width: 14.5, height: 6, rx: 3, fill: '#fff' }],
    ['circle', { cx: 5.5, cy: 5.5, r: 1.2, fill: '#000' }],
    ['circle', { cx: 10.5, cy: 19, r: 1.2, fill: '#000' }],
    ['rect', { x: 9.5, y: 6, width: 6.5, height: 1.5, rx: 0.75, fill: '#000' }],
    ['rect', { x: 9.5, y: 9, width: 6.5, height: 1.5, rx: 0.75, fill: '#000' }],
    ['rect', { x: 9.5, y: 12, width: 4, height: 1.5, rx: 0.75, fill: '#000' }],
    ['line', { x1: 2.5, y1: 2.5, x2: 21.5, y2: 21.5, stroke: '#000', 'stroke-width': 5, 'stroke-linecap': 'round', class: 'yfvb-slash' }]
  ].forEach(([tag, attrs]) => mask.appendChild(svgEl(tag, attrs)));
  svg.appendChild(svgEl('defs')).appendChild(mask);
  svg.appendChild(svgEl('rect', { width: 24, height: 24, mask: `url(#${id})` }));
  svg.appendChild(svgEl('line', { x1: 2.5, y1: 2.5, x2: 21.5, y2: 21.5, stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', class: 'yfvb-slash' }));
  return svg;
}

function createButton(onToggle, icon = eyeIcon()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'yfvb-btn';
  button.appendChild(icon);

  // Items are links (or tap targets on m.youtube.com); keep the click from
  // opening the video.
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });
  ownButtons.add(button);
  return button;
}

function findMenu(item) {
  for (const selector of MENU_SELECTORS) {
    const menu = [...item.querySelectorAll(selector)].find((el) =>
      el.closest(ITEM_SELECTOR) === item && !el.closest('.yfvb-media') && !el.contains(item.querySelector('.yfvb-btn')));
    if (menu) return menu;
  }
  return null;
}

// The button goes just before the ⋮ menu, so it sits with the item's actions.
// Falls back to just after the title.
function placeButton(item, button) {
  const menu = findMenu(item);
  if (menu) {
    if (button.nextElementSibling !== menu) menu.insertAdjacentElement('beforebegin', button);
    besideFloatingMenu(button, menu);
  } else if (!button.isConnected) {
    item.querySelector('h3, #video-title')?.insertAdjacentElement('afterend', button);
  }
}

// Lockup menus are absolutely positioned in the item's top or bottom right
// corner (the sidebar's only appears on hover), so they take no room in the
// row and would cover the eye. Keep the menu's width clear to the eye's right
// (less a few px, so the two hover circles sit close without touching) and line
// it up with the menu's corner. The menu can be placed past the row's edge (10px
// on the home grid), so the gap is measured from where it really is, not just
// its width. Any menu, floating or not, then gets the eye nudged so its centre
// is level with the ⋮ button's: on search results the ⋮ stays in the row but
// pokes 11px above its 24px box, so top-aligning them leaves the eye 9px low.
const FLOATING_MENU_OVERLAP = 6;

function besideFloatingMenu(button, menu) {
  const style = getComputedStyle(menu);
  const floating = style.position === 'absolute';
  const align = floating && parseFloat(style.bottom) < parseFloat(style.top) ? 'flex-end' : '';
  if (button.style.alignSelf !== align) button.style.alignSelf = align;

  let gap = floating ? Math.max(0, menu.offsetWidth - FLOATING_MENU_OVERLAP) : 0;
  const target = (menu.querySelector('button') || menu).getBoundingClientRect();
  if (floating && target.width) {
    const own = button.getBoundingClientRect();
    const current = parseFloat(button.style.marginRight) || 0;
    gap = Math.max(0, Math.round(current + own.right - target.left - FLOATING_MENU_OVERLAP));
  }
  gap = floating ? gap + 'px' : '';
  if (button.style.marginRight !== gap) button.style.marginRight = gap;

  let shift = '';
  if (target.height) {
    const own = button.getBoundingClientRect();
    const current = parseFloat(button.style.translate.split(' ')[1]) || 0;
    const offset = Math.round(target.top + target.height / 2 - (own.top - current + own.height / 2));
    if (offset) shift = `0px ${offset}px`;
  }
  if (button.style.translate !== shift) button.style.translate = shift;
}

function processItem(item) {
  // A nested item (a post's attached video) is handled by its post.
  if (item.parentElement?.closest(ITEM_SELECTOR)) return;

  const revealedFor = item.getAttribute('data-yfvb-revealed');
  if (revealedFor !== null && revealedFor !== itemKey(item)) setRevealed(item, false);

  markThumbnails(item);
  if (!hasMedia(item)) return;

  let button = findButton(item);
  if (!button) button = createButton(() => toggleItem(item, button));
  setIcon(button, item.hasAttribute('data-yfvb-revealed'));
  // YouTube renders the menu after the rest of the item, so re-place on later passes.
  placeButton(item, button);
}

/* ---------- Watch-page comments ---------- */

// The comment section stays hidden until the scroll button opens it. Like
// items, the <ytd-comments> element is reused for the next video, and opening
// is tied to the video it was done on.
function videoKey() {
  return new URLSearchParams(location.search).get('v') || location.pathname;
}

// Grey while comments are hidden (the default), red and struck through while
// the button has them open.
function setCommentsIcon(button, shown) {
  button.classList.toggle('content-visible', shown);
  button.setAttribute('aria-pressed', String(shown));
  button.setAttribute('aria-label', shown ? 'Hide comments' : 'Show comments');
  button.title = shown ? 'Hide comments' : 'Show comments';
}

function processComments(comments) {
  const shownFor = comments.getAttribute('data-yfvb-shown');
  if (shownFor !== null && shownFor !== videoKey()) comments.removeAttribute('data-yfvb-shown');

  // The header row is rebuilt as comments load; place after "Sort by" each
  // pass. content.css pushes it to the row's right edge.
  const sort = comments.querySelector('ytd-comments-header-renderer #sort-menu');
  if (!sort) return;
  let button = [...comments.querySelectorAll('.yfvb-comments-btn')].find((b) => ownButtons.has(b));
  comments.querySelectorAll('.yfvb-comments-btn').forEach((b) => { if (b !== button) b.remove(); });
  if (!button) {
    button = createButton(() => {
      const shown = !comments.hasAttribute('data-yfvb-shown');
      if (shown) comments.setAttribute('data-yfvb-shown', videoKey());
      else comments.removeAttribute('data-yfvb-shown');
      setCommentsIcon(button, shown);
    }, scrollIcon());
    button.classList.add('yfvb-comments-btn');
  }
  setCommentsIcon(button, comments.hasAttribute('data-yfvb-shown'));
  if (button.previousElementSibling !== sort) sort.insertAdjacentElement('afterend', button);
}

/* ---------- Driver ---------- */

function processAll() {
  document.querySelectorAll(ITEM_SELECTOR).forEach(processItem);
  document.querySelectorAll('ytd-comments').forEach(processComments);
}

let scheduled = false;
function scheduleProcess() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    processAll();
  });
}

// The video player rewrites its own controls and captions constantly; that's
// never a new item.
const PLAYER_SELECTOR = '.html5-video-player';

function init() {
  processAll();
  // Infinite scroll, SPA navigation and late-rendering menus all arrive as DOM
  // additions; batch them into one pass per frame.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length && !m.target.closest?.(PLAYER_SELECTOR)) {
        scheduleProcess();
        return;
      }
    }
  }).observe(document, { childList: true, subtree: true });
  window.addEventListener('pageshow', scheduleProcess);
  window.addEventListener('popstate', scheduleProcess);
  // YouTube's own SPA navigation event.
  document.addEventListener('yt-navigate-finish', scheduleProcess);
}

// m.youtube.com autoplays the feed video in view, moving a preview player into
// that item; hover previews work the same way on some desktop layouts. While
// its item is hidden, stop it. 'play' doesn't bubble, so listen in the capture
// phase.
document.addEventListener('play', (e) => {
  const item = e.target.closest?.(ITEM_SELECTOR);
  if (item && !item.closest('[data-yfvb-revealed]')) e.target.pause();
}, true);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// Lets the worker notice a new build.txt during development (see background.js).
try { chrome.runtime.sendMessage('yfvb:checkBuild').catch(() => {}); } catch (_) { /* extension reloaded */ }
