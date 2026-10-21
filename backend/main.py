
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AURA API", version="0.1.0")

# Allow our local React frontend to call this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)



class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []



@app.get("/")
def root():
    return {"message": "AURA backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok", "assistant": "AURA"}




@app.post("/api/chat")
def chat(request: ChatRequest):
    import requests

    message = request.message.strip()

    if not message:
        return {"reply": "Please enter a message."}

    messages = [
        {
            "role": "system",
            "content": (
                "You are AURA, a helpful personal AI assistant. "
                "Be friendly, clear, and concise."
            ),
        }
    ]

    # Include earlier messages from this conversation.
    for item in request.history:
        if item.role in ("user", "assistant") and item.content.strip():
            messages.append({
                "role": item.role,
                "content": item.content.strip(),
            })

    # Add the newest message last.
    messages.append({
        "role": "user",
        "content": message,
    })

    try:
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "qwen2.5:1.5b",
                "messages": messages,
                "stream": False,
            },
            timeout=120,
        )

        response.raise_for_status()
        data = response.json()

        return {"reply": data["message"]["content"]}

    except requests.RequestException:
        return {
            "reply": (
                "I couldn't connect to my AI model. "
                "Please check that Ollama is running."
            )
        }
