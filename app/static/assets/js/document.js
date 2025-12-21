const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const downloadButton = document.getElementById("downloadButton");
const deleteButton = document.getElementById("deleteButton");
const statusLabel = document.getElementById("statusLabel");

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function getFilenames() {
  try {
    const resp = await fetch("/api/v1/documents", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) throw new Error("Network error");
    const data = await resp.json();
    statusLabel.textContent = data.file_names;
  } catch (err) {
    statusLabel.textContent = "⚠️ Error: " + escapeHtml(err.message);
  }
}

async function uploadFiles(filenames) {
  try {
    const resp = await fetch("/api/v1/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_names: filenames }),
    });
    if (!resp.ok) throw new Error("Network error");
    statusLabel.textContent = "✅ Upload successful!";
  } catch (err) {
    statusLabel.textContent = "⚠️ Error: " + escapeHtml(err.message);
  }
}

async function deleteFile(filename) {
  try {
    const resp = await fetch("/api/v1/document", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: filename }),
    });
    if (!resp.ok) throw new Error("Network error");
    const data = await resp.json();
    statusLabel.textContent = data.file_name;
  } catch (err) {
    statusLabel.textContent = "⚠️ Error: " + escapeHtml(err.message);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  //getFilenames();
});

uploadButton.addEventListener("click", () => {
  const filenames = fileInput.value;
  //uploadFiles(filenames);
});

deleteButton.addEventListener("click", () => {
  const filename = deleteButton.tag;
  deleteFile(filename);
});

