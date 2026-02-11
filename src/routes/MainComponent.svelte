<script lang="ts">
  import { onMount } from "svelte";
  import {puter} from "@heyputer/puter.js"

  let cvFile:any = $state(null);
  let cvText:string | ArrayBuffer | null = $state("");
  let jobUrl = $state("");
  let jobText = $state("");
  let messages:any = $state([]);
  let cvUploaded = $state(false);
  let jobLoaded = $state(false);
  let assistantThinking = $state(false);
  let userMessage = $state("");
  let chatBox:HTMLDivElement|null = $state(null); //ref to chat container
  let cvInput:HTMLInputElement|null = $state(null); // ref to cv input field

  function scrollChatToBottom() {
  if (chatBox) {
    const threshold = 50; // px tolerance
    const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
    if (isAtBottom) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }
}



  // --- CV Upload ---
  async function handleCVUpload(event:any) {
    cvFile = event.target.files[0];
    if (!cvFile) return;
    const fileSize = cvInput?.files?.item(0)?.size;
    const fileMb = fileSize !== undefined ? fileSize / 1024**2 : 1.5;
    if (fileMb >= 2) {
      console.log(`FileSize: ${fileMb.toFixed(1)}MB`)
      alert("Please, select a file that's less than 2MB!");
      return;
    } else {
      console.log(`FileSize: ${fileMb.toFixed(1)}MB`)
    }

    if (cvFile.name.endsWith(".jpg") || cvFile.name.endsWith(".png")) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      const text = await puter.ai.img2txt(blob);
      cvText = text.replace(/\s+/g, " ").trim();
    } else {
      const formData = new FormData();
      formData.append("cv", cvFile);

      const res = await fetch("https://jobsgpt-sv-server.onrender.com/upload-cv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        cvText = data.text;
      } else {
        console.error(data.error);
      }
    }
    cvUploaded = true; // show confirmation
  }

  // --- Job URL Fetch ---
  let loadingJob = $state(false);
  async function handleJobUrl() {
    if (!jobUrl) {
      alert("Provide a URL first!")
      return;
    }
    try {
      loadingJob = true;
      //https://jobsgpt-sv-server.onrender.com
      //const res = await fetch(`http://localhost:3333/fetch-job?url=${encodeURIComponent(jobUrl)}`);
      const res = await fetch(`https://jobsgpt-sv-server.onrender.com/fetch-job?url=${encodeURIComponent(jobUrl)}`);
      const html = await res.text();
      jobText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      jobLoaded = true; // show confirmation
    } catch (error) {
      console.error(error)
    } finally {
      loadingJob = false;
    }
  }

  // --- Chat ---
  async function sendMessage(e:any) {
    // const userMessage = e.target.value || e;
    // if (!userMessage.trim()) return;
    const msg = typeof e === "string" ? e : e.target.value;
    if (!msg.trim()) return;

    messages.push({ role: "user", content: msg });
    assistantThinking = true; // shows indicator
   // e.target.value = "";
     userMessage = ""


    let systemPrompt = "You are a helpful assistant.";
    let contextMessages:any = [];

    if (cvUploaded && !jobLoaded) {
      systemPrompt = "You are a helpful assistant. Answer questions based only on the uploaded CV.";
      contextMessages.push({ role: "user", content: `CV:\n${cvText}` });
    } else if (cvUploaded && jobLoaded) {
      systemPrompt = "You are a helpful assistant. Summarize how the CV matches the job description in plain English, then invite the user to ask further questions.";
      contextMessages.push({ role: "user", content: `CV:\n${cvText}` });
      contextMessages.push({ role: "user", content: `Job description:\n${jobText}` });
    } else if (!cvUploaded && jobLoaded) {
      systemPrompt = "You are a helpful assistant. The user has provided a job description but no CV. Ask them to upload their CV.";
      contextMessages.push({ role: "user", content: `Job description:\n${jobText}` });
    } else {
      systemPrompt = "You are a helpful assistant. Ask the user to upload a CV or provide a job link.";
    }

    const response = await puter.ai.chat([
      { role: "system", content: systemPrompt },
      ...contextMessages,
      ...messages
    ]);

    messages.push({ role: "assistant", content: response });
    assistantThinking = false; // hides indicator
    // auto scroll to bottom
    // setTimeout(() => {
    //   if (chatBox) chatBox.scrollTop = chatBox.scrollHeight
    // }, 0);
    scrollChatToBottom()
  }

  // Load history on startup
onMount(() => {
  const saved = localStorage.getItem("chatHistory");
  if (saved) {
    messages = JSON.parse(saved);
  }
});

// Save history whenever messages change
$effect(() => {
  localStorage.setItem("chatHistory", JSON.stringify(messages));
}) 

// Clear history
function clearHistory() {
  localStorage.removeItem("chatHistory");
  messages = [];
  cvFile = null;
}

// Called on X clicked
function clearJobUrl() {
  jobUrl = "";
  jobText = "";
  jobLoaded = false;
}

</script>

<div class="wrapper">
  <aside>
    <div class="row">
      <h3>Upload CV</h3>
      <input type="file" accept=".txt,.pdf,.docx,.png,.jpg,.jpeg" bind:this={cvInput} onchange={handleCVUpload} />
      <span style="font-size: x-small;color:gray;font-style:italic">Max FileSize: 2MB</span>
      {#if cvUploaded}
        <p>CV successfully uploaded.</p>
      {/if}
    </div>

    <div class="row posting">
      <h3>Job Posting</h3>
      <div>
        <input type="url" class="urlInput" bind:value={jobUrl} pattern="https://.*" placeholder="https://joblink.domain" />
        {#if jobUrl}
          <span style="cursor: pointer;color:red;font-weight:700;" role="button" tabindex="-1" onkeydown={clearJobUrl} onclick={clearJobUrl}>X</span>
        {/if}

      </div>
      <button class="loadJob" onclick={handleJobUrl}>{loadingJob ? 'Loading' : 'Load Job'}</button>
      {#if jobLoaded}
        <p>Job description loaded ({jobText.length} chars)</p>
      {/if}
    </div>
  </aside>

  <aside>
    <div class="row">
      <h3>Chat</h3>
      {#if messages.length > 0}
      <div class="chat-box" bind:this={chatBox}>
        {#each messages as m}
          <p><strong>{m.role}:</strong> {m.content}</p>
        {/each}
        {#if assistantThinking}
          <!-- <p><em>Assistant is thinking…</em></p> -->
           <p class="thinking">Assistant is thinking<span>.</span><span>.</span><span>.</span></p>
        {/if}
      </div>
      <div class="chat-controls">
        <button onclick={clearHistory}>Clear Chat History</button>
      </div>
        
      {/if}

      <!-- <input type="text" placeholder="Ask something..." 
             onkeydown={(e) => e.key === 'Enter' && sendMessage(e)} /> -->
             <!-- <div class="chat-input">
  <input type="text" bind:value={userMessage} placeholder="Ask something..."
         onkeydown={(e) => e.key === 'Enter' && sendMessage(e)} />
  <button onclick={() => sendMessage({ target: { value: userMessage } })}>
    Send
  </button>
</div> -->
      <div class="chat-input">
  <input type="text" bind:value={userMessage} placeholder="Ask something..."
         onkeydown={(e) => e.key === 'Enter' && !assistantThinking && sendMessage(e)}
         disabled={assistantThinking} />
         {#if userMessage}
         <button onclick={() => !assistantThinking && sendMessage(userMessage)}
                 disabled={assistantThinking}>
           Send
         </button>
          
         {/if}
</div>

    </div>
  </aside>
</div>

<style>
  button {
    margin: 6px;
  }
  .chat-controls button {
  margin-top: 0.5rem;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #e74c3c;
  color: white;
  cursor: pointer;
}
.chat-controls button:hover {
  background: #c0392b;
}

  .loadJob {
    background-color: black;
    color: white;
  }
  .loadJob:hover {
    background-color: white;
    color: black
  }
  .urlInput {
      flex: 1;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid #ccc;
  }
  .row { margin-bottom: 1rem; }
 .posting {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  }
  .posting button {
    width: 120px;
  }
  .posting input {
    width: 220px;
  }
  /* .chat-box { border: 1px solid #ccc; padding: 1rem;margin-bottom: 4px; height: 250px; overflow-y: auto; } */
  .chat-box { border: 1px solid #ccc; padding: 1rem; margin-bottom: 4px; height: 250px; overflow-y: auto; }
  .wrapper {
    /*background: rgb(207, 205, 207); */
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two equal columns */
    gap: 1rem; /* Space between columns */
  }
  .chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.chat-input button {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #6c63ff;
  color: white;
  cursor: pointer;
}
.chat-input button:hover {
  background: #574bdb;
}


  .thinking {
  font-style: italic;
  color: #666;
}

.thinking span {
  animation: blink 1.4s infinite both;
}

.thinking span:nth-child(2) {
  animation-delay: 0.2s;
}
.thinking span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}


  @media (max-width: 600px) {
    .wrapper {
      grid-template-columns: 1fr;
    }
  }
</style>
