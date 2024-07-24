import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "HTML Table to Excel",
  description: "Export HTML tables to Excel files",
  version: "1.0",
  icons: {
    "16": "images/icon-16.png",
    "32": "images/icon-32.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png",
  },
  permissions: ["contextMenus", "activeTab"],
  background: {
    service_worker: "scripts/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      js: ["scripts/content.ts"],
      matches: ["<all_urls>"],
    },
  ],
});
