import * as XLSX from "xlsx";

let selectedTable: HTMLTableElement | null = null;

function getWebsiteName(): string {
  const titleElement = document.querySelector("title");
  if (titleElement && titleElement.textContent) {
    return titleElement.textContent
      .trim()
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
  }
  return window.location.hostname.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function truncateText(text: string, maxLength: number = 32000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "... (truncated)";
}

function extractTableData(table: HTMLTableElement): string[][] {
  const rows = table.querySelectorAll("tr");
  const data: string[][] = [];

  rows.forEach((row) => {
    const rowData: string[] = [];
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      const cellText = cell.textContent?.trim() || "";
      rowData.push(truncateText(cellText));
    });
    if (rowData.some((cell) => cell !== "")) {
      data.push(rowData);
    }
  });

  return data;
}

function tableToXlsx(table: HTMLTableElement): void {
  const websiteName = getWebsiteName();
  const fileName = `${websiteName}_table.xlsx`;

  const data = extractTableData(table);
  // console.log("Extracted table data:", data);

  if (data.length === 0) {
    console.log("No valid data found in the table");
    alert("No valid data found in the table");
    return;
  }

  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
    console.log(`Table exported successfully as ${fileName}`);
  } catch (error) {
    console.error("Error exporting table:", error);
    alert("Error exporting table. See console for details.");
  }
}

function adjustTableCells(table: HTMLTableElement, highlight: boolean) {
  const cells = table.querySelectorAll("th, td");
  cells.forEach((cell) => {
    if (highlight) {
      (cell as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      (cell as HTMLElement).style.transition = "background-color 0.3s ease";
    } else {
      (cell as HTMLElement).style.backgroundColor = "";
      (cell as HTMLElement).style.transition = "";
    }
  });
}

function highlightTable(table: HTMLTableElement) {
  // クラスを使用してスタイルを適用
  table.classList.add("html-table-to-excel-highlight");
  adjustTableCells(table, true);
}

function removeHighlight(table: HTMLTableElement) {
  // クラスを削除してスタイルを解除
  table.classList.remove("html-table-to-excel-highlight");
  adjustTableCells(table, false);
}

// スタイルをヘッドに追加する関数
function addStyleToHead() {
  const style = document.createElement("style");
  style.textContent = `
    .html-table-to-excel-highlight {
      box-shadow: 0 0 0 4px rgba(0, 0, 128, 0.5) !important;
      background-color: rgba(0, 0, 128, 0.1) !important;
      transition: all 0.1s ease !important;
    }
    .html-table-to-excel-highlight th,
    .html-table-to-excel-highlight td {
      background-color: rgba(255, 255, 255, 0.7) !important;
    }
  `;
  document.head.appendChild(style);
}

function handleContextMenu(event: MouseEvent) {
  addStyleToHead();
  const clickedElement = event.target as Element;
  const tableElement = clickedElement.closest("table");

  if (selectedTable) {
    removeHighlight(selectedTable);
  }

  if (tableElement) {
    selectedTable = tableElement as HTMLTableElement;
    highlightTable(selectedTable);
  } else {
    selectedTable = null;
  }
}

function handleClick(event: MouseEvent) {
  if (selectedTable) {
    const clickedElement = event.target as Element;
    if (!selectedTable.contains(clickedElement)) {
      removeHighlight(selectedTable);
      selectedTable = null;
    }
  }
}

function checkTablePresence() {
  const tablePresent = document.querySelector("table") !== null;
  chrome.runtime.sendMessage({
    action: "tablePresence",
    present: tablePresent,
  });
}

const observer = new MutationObserver(checkTablePresence);
observer.observe(document.body, { childList: true, subtree: true });
checkTablePresence();

function initializeContentScript() {
  // コンテキストメニューイベントを捕捉
  document.removeEventListener("contextmenu", handleContextMenu, true);
  document.addEventListener("contextmenu", handleContextMenu, true);

  // クリックイベントを捕捉
  document.removeEventListener("click", handleClick);
  document.addEventListener("click", handleClick);

  // メッセージリスナー
  chrome.runtime.onMessage.addListener((request, _, __) => {
    if (request.action === "downloadTable") {
      if (selectedTable) {
        console.log("Processing selected table");
        tableToXlsx(selectedTable);
        removeHighlight(selectedTable);
        selectedTable = null;
      } else {
        console.log("No table selected");
        alert("Please right-click on a table before downloading");
      }
    }
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.tagName === "TABLE") {
            // 新しく追加されたテーブルに対する処理
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ページロード時に初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeContentScript);
} else {
  initializeContentScript();
}

// 初期化メッセージを送信
chrome.runtime.sendMessage({ action: "contentScriptReady" });

console.log("HTML Table to Excel content script loaded");
