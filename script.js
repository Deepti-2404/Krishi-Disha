const promptInput = document.querySelector("#prompt");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#image");
const imageInput = document.querySelector("#image input");
const statusIndicator = document.createElement("div");

const API_URL = "your_secret_key_here";

let user = {
  message: null,
  file: {
    mime_type: null,
    data: null,
  },
};

function showLoading(aiBox) {
  const loadHTML = `
    <img src="https://static.vecteezy.com/system/resources/previews/010/754/321/non_2x/loading-icon-logo-design-template-illustration-free-vector.jpg" width="50" alt="Loading...">
  `;
  aiBox.querySelector(".ai-chat-area").innerHTML = loadHTML;
}

function showError(aiBox, message) {
  aiBox.querySelector(".ai-chat-area").innerHTML = `
    <div style="color:red;">❌ ${message}</div>
  `;
}

async function generateResponse(aiChatBox) {
  const textContainer = aiChatBox.querySelector(".ai-chat-area");
  showLoading(aiChatBox);
  
  const contents = [];
  if (user.message) {
    contents.push({ text: user.message });
  }
  if (user.file.data) {
    contents.push({ inline_data: user.file });
  }
  
  const requestBody = {
    contents: [
      {
        parts: contents,
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
    aiChatBox.querySelector(".ai-chat-area").innerHTML = replyText.replace(/\*\*(.*?)\*\*/g, "$1").trim();
  } catch (error) {
    console.error("Error fetching AI response:", error);
    showError(aiChatBox, "Unable to get response. Please try again.");
  } finally {
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
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


function handleChat(userMessage = null) {
  
  if (user.file.data && !userMessage) {
    user.message = "Image analysis";
  } else {
    user.message = userMessage;
  }

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

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (promptInput.value.trim() || user.file.data)) {
    handleChat(promptInput.value.trim());
  }
});

imageBtn.addEventListener("click", () => imageInput.click());

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


  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.style.display = "block";
  removeBtn.style.marginTop = "5px";
  removeBtn.addEventListener("click", () => {
    previewContainer.remove();
    
    user.file = { mime_type: null, data: null };
   
    imageInput.value = "";
  });

  previewContainer.appendChild(previewImage);
  previewContainer.appendChild(removeBtn);
  return previewContainer;
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const existingPreview = document.querySelector(".image-preview");
    if (existingPreview) existingPreview.remove();

   
    const preview = createImagePreview(file);
    promptInput.parentNode.appendChild(preview);

    // Read file 
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(",")[1];
      user.file.mime_type = file.type;
      user.file.data = base64Data;
    };
    reader.readAsDataURL(file);
  }
});
