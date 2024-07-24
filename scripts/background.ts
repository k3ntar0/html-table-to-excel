let isContentScriptReady = false;

chrome.runtime.onMessage.addListener((request, _, __) => {
  if (request.action === "contentScriptReady") {
    isContentScriptReady = true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "downloadTableAsExcel",
    title: "Download table as Excel",
    contexts: ["all"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "downloadTableAsExcel" && tab?.id) {
    if (isContentScriptReady) {
      chrome.tabs.sendMessage(tab.id, { action: "downloadTable" });
    } else {
      console.error("Content script is not ready");
      // ここでユーザーにエラーメッセージを表示することもできます
    }
  }
});
