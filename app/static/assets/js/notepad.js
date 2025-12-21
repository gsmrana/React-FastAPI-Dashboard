const noteWindow = document.getElementById("noteWindow");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const noteInput = document.getElementById("noteInput");
const noteStatus = document.getElementById("noteStatus");

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadNote() {
  try {
    const resp = await fetch("/api/v1/notepad", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) throw new Error("Network error");
    const data = await resp.json();
    noteInput.value = data.content;
  } catch (err) {
    noteStatus.textContent = "⚠️ Error: " + escapeHtml(err.message);
  }
}

async function saveNote(inputText) {
  try {
    const resp = await fetch("/api/v1/notepad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: inputText }),
    });
    if (!resp.ok) throw new Error("Network error");
    noteStatus.textContent = "✅ Saved";
    setTimeout(() => {
      noteStatus.textContent = "";
    }, 3000);
  } catch (err) {
    noteStatus.textContent = "⚠️ Error: " + escapeHtml(err.message);
  }
}

saveBtn.addEventListener("click", () => {
  const inputText = noteInput.value;
  saveNote(inputText);
});

clearBtn.addEventListener("click", () => {
  noteInput.value = "";
});

document.addEventListener("DOMContentLoaded", function() {
  loadNote();
});
