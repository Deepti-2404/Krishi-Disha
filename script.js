// Select DOM elements
const promptInput = document.querySelector("#prompt");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#image");
const imageInput = document.querySelector("#image input");
const statusIndicator = document.createElement("div");

// API URL (replace with your actual API key)
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBOMCLwOj-1lhV-VaeypAtosC40xGjl87E";

// User data object
let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

// Utility: Show loading status
function showLoading(aiBox) {
  const loadHTML = `
    <img src="https://static.vecteezy.com/system/resources/previews/010/754/321/non_2x/loading-icon-logo-design-template-illustration-free-vector.jpg" width="50" alt="Loading...">
  `;
  aiBox.querySelector(".ai-chat-area").innerHTML = loadHTML;
}

// Utility: Display error message to user
function showError(aiBox, message) {
  aiBox.querySelector(".ai-chat-area").innerHTML = `
    <div style="color:red;">❌ ${message}</div>
  `;
}

// Generate AI response with improved request structure
async function generateResponse(aiChatBox) {
  const textContainer = aiChatBox.querySelector(".ai-chat-area");
  showLoading(aiChatBox);
  
  // Construct the contents payload
  const contents = [];
  if (user.message) {
    contents.push({ text: user.message });
  }
  if (user.file.data) {
    contents.push({ inline_data: user.file });
  }
  
  // Construct request payload according to API schema
  const requestBody = {
    contents: [
      {
        parts: contents,
        // Additional parameters if needed
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";
    // Clean up response text
    aiChatBox.querySelector(".ai-chat-area").innerHTML = replyText.replace(/\*\*(.*?)\*\*/g, "$1").trim();
  } catch (error) {
    console.error("Error fetching AI response:", error);
    showError(aiChatBox, "Unable to get response. Please try again.");
  } finally {
    // Scroll to latest message
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    // Reset user file data
    user.file = { mime_type: null, data: null };
  }
}

// Create chat box element
function createChatBox(contentHTML, className) {
  const div = document.createElement("div");
  div.className = className;
  div.innerHTML = contentHTML;
  return div;
}

// Handle user message or image submission
function handleChat(userMessage = null) {
  // Determine message content
  if (user.file.data && !userMessage) {
    user.message = "Image analysis";
  } else {
    user.message = userMessage;
  }

  // Abort if no input
  if (!user.message && !user.file.data) return;

  // Create user chat bubble
  const userHTML = `
    <img src="https://www.svgrepo.com/show/89129/profile-user.svg" width="50" alt="User">
    <div class="user-chat-area">
      ${user.message}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="choosimg" width="100"/>` : ""}
    </div>
  `;
  const userBox = createChatBox(userHTML, "user-chat-box");
  chatContainer.appendChild(userBox);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
  promptInput.value = "";

  // Create AI response placeholder
  const aiHTML = `
    <img src="https://img.freepik.com/premium-vector/robot-circle-vector-icon_418020-452.jpg?w=740" width="70" alt="AI">
    <div class="ai-chat-area">
      <img src="https://static.vecteezy.com/system/resources/previews/001/826/301/original/progress-loading-bar-buffering-download-upload-and-loading-icon-vector.jpg" class="load" width="50">
    </div>
  `;
  const aiBox = createChatBox(aiHTML, "ai-chat-box");
  chatContainer.appendChild(aiBox);
  showLoading(aiBox);
  generateResponse(aiBox);
}

// Event: Enter key to send message
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (promptInput.value.trim() || user.file.data)) {
    handleChat(promptInput.value.trim());
  }
});

// Event: Image button click
imageBtn.addEventListener("click", () => imageInput.click());

// Create and display image preview with remove option
function createImagePreview(file) {
  const previewContainer = document.createElement("div");
  previewContainer.className = "image-preview";
  previewContainer.style.marginTop = "10px";

  const previewImage = document.createElement("img");
  previewImage.style.maxWidth = "100px";
  previewImage.style.maxHeight = "100px";
  previewImage.style.objectFit = "contain";

  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
  };
  reader.readAsDataURL(file);

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.style.display = "block";
  removeBtn.style.marginTop = "5px";
  removeBtn.addEventListener("click", () => {
    previewContainer.remove();
    // Clear user file data
    user.file = { mime_type: null, data: null };
    // Reset input
    imageInput.value = "";
  });

  previewContainer.appendChild(previewImage);
  previewContainer.appendChild(removeBtn);
  return previewContainer;
}

// Event: Handle image selection
imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    // Remove existing preview if any
    const existingPreview = document.querySelector(".image-preview");
    if (existingPreview) existingPreview.remove();

    // Create and append new preview
    const preview = createImagePreview(file);
    promptInput.parentNode.appendChild(preview);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      user.file.mime_type = file.type;
      user.file.data = base64Data;
    };
    reader.readAsDataURL(file);
  }
});