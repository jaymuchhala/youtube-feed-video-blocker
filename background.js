// Show the welcome page once, on first install. Updates stay silent.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  setTimeout(injectIntoOpenTabs, 3000);
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome/welcome.html') });
  }
});

// Chrome doesn't put a new version's content scripts into tabs that are already
// open, and the old copy is cut off (content.js notices and steps aside), so
// inject the new version: open YouTube tabs keep working without a refresh. The
// CSS goes in too, since Chrome drops the old copy's stylesheet with it.
async function injectIntoOpenTabs() {
  const scripts = chrome.runtime.getManifest().content_scripts || [];
  for (const cs of scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.discarded) continue;
      const target = { tabId: tab.id };
      if (cs.css) chrome.scripting.insertCSS({ target, files: cs.css }).catch(() => {});
      if (cs.js) chrome.scripting.executeScript({ target, files: cs.js }).catch(() => {});
    }
  }
}

// Development: when loaded unpacked (no update_url), reload when build.txt changes,
// so edits on disk take effect without a trip to chrome://extensions. Each page load
// pings the worker to trigger the check. The stamp seen at load is kept in session
// storage, which outlives the worker going idle but is cleared by a reload.
async function checkBuild() {
  if ('update_url' in chrome.runtime.getManifest()) return;
  try {
    const stamp = (await (await fetch(chrome.runtime.getURL('build.txt'), { cache: 'no-store' })).text()).trim();
    const { build } = await chrome.storage.session.get('build');
    if (build === undefined) await chrome.storage.session.set({ build: stamp });
    else if (stamp !== build) chrome.runtime.reload();
  } catch (_) { /* no build.txt */ }
}
chrome.runtime.onMessage.addListener((msg) => {
  if (msg === 'yfvb:checkBuild') checkBuild();
});
checkBuild();
