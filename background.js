const flatTabsToIds = (tabs) => tabs.map((tab) => tab.id);

const parseTabUrl = (tab) => {
  if (URL.canParse(tab.url)) {
    return new URL(tab.url);
  }
};

const filterTabsByHostName = (tabs, activeTabHostName) => {
  return tabs.filter((openedTab) => {
    const tabURL = parseTabUrl(openedTab);
    if (!tabURL) return false;
    return tabURL.hostname === activeTabHostName;
  });
};

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "groupTabsByHostname",
    title: "Group by Host Name",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "deleteAllButOne",
    title: "Close all but one (matched by host name)",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener(function (info, activeTab) {
  if (info.menuItemId === "groupTabsByHostname") {
    const activeTabURL = parseTabUrl(activeTab);

    if (!activeTabURL) return;
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const matchingTabs = filterTabsByHostName(tabs, activeTabURL.hostname);
      // Do nothing is there is only 1 or less
      if (matchingTabs.length <= 1) return;

      chrome.tabs.group({ tabIds: flatTabsToIds(matchingTabs) }, (groupId) => {
        chrome.tabGroups.update(groupId, { title: activeTabURL.hostname });
      });
    });
  }

  if (info.menuItemId === "deleteAllButOne") {
    const activeTabURL = parseTabUrl(activeTab);

    if (!activeTabURL) return;
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const matchingTabs = filterTabsByHostName(tabs, activeTabURL.hostname);
      // Do nothing is there is only 1 or less
      if (matchingTabs.length <= 1) return;

      // Leave one tab open
      const remainingTab = matchingTabs.shift();
      console.log('remainingTab', remainingTab)
      chrome.tabs.remove(flatTabsToIds(matchingTabs));
      chrome.tabs.update(remainingTab.id, { active: true });
    });
  }
});
