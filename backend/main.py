
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


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"message": "AURA backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok", "assistant": "AURA"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        return {"reply": "Please enter a message."}

    # Temporary response; we'll connect the AI model later.
    return {"reply": f"AURA received your message: {message}"}
