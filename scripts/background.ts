// background.ts

let isTablePresent = false;

chrome.runtime.onMessage.addListener((request, _, __) => {
  if (request.action === "tablePresence") {
    isTablePresent = request.present;
    updateContextMenu();
  }
});

function updateContextMenu() {
  if (isTablePresent) {
    chrome.contextMenus.create(
      {
        id: "downloadTableAsExcel",
        title: "Download table as Excel",
        contexts: ["all"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error creating context menu:",
            chrome.runtime.lastError
          );
        }
      }
    );
  } else {
    chrome.contextMenus.remove("downloadTableAsExcel", () => {
      if (chrome.runtime.lastError) {
        console.error("Error removing context menu:", chrome.runtime.lastError);
      }
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, _) => {
  if (changeInfo.status === "complete") {
    chrome.tabs.sendMessage(tabId, { action: "checkTablePresence" });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "downloadTableAsExcel" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "downloadTable" });
  }
});
