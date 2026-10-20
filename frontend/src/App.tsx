
import { useEffect, useRef, useState } from 'react'
import './App.css'

type Message = {
  id: number
  role: 'aura' | 'user'
  text: string
}

type SpeechRecognitionResult = {
  transcript: string
}

type RecognitionEvent = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>
}

function getReply(message: string): string {
  const text = message.toLowerCase()

  if (/\b(hi|hello|hey)\b/.test(text)) {
    return "Hey! I'm AURA, your personal assistant. I'm happy we're finally getting started. What shall we do today?"
  }

  if (text.includes('your name') || text.includes('who are you')) {
    return "I'm AURA, your personal AI assistant. This is my first prototype, and we're building my capabilities step by step."
  }

  if (text.includes('time')) {
    return `Your device's current time is ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}.`
  }

  if (text.includes('how are you')) {
    return "I'm running smoothly and ready to help. Well, I'm still learning, but that's what this project is all about!"
  }

  if (text.includes('help')) {
    return 'You can greet me, ask who I am, or ask for the current time. More intelligent responses will come when we connect an AI model.'
  }

  return `I heard you say: "${message}". My full AI brain isn't connected yet, but that's one of our next milestones!`
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'aura',
      text: "Hello! I'm AURA. ✨ I'm here and ready to help. Type a message or try speaking to me!",
    },
  ])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [status, setStatus] = useState('SYSTEM ONLINE')
  const [recognitionSupported, setRecognitionSupported] = useState(true)

  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => {
        lang: string
        interimResults: boolean
        onresult: ((event: RecognitionEvent) => void) | null
        onerror: (() => void) | null
        onend: (() => void) | null
        start: () => void
        stop: () => void
      }
      webkitSpeechRecognition?: new () => {
        lang: string
        interimResults: boolean
        onresult: ((event: RecognitionEvent) => void) | null
        onerror: (() => void) | null
        onend: (() => void) | null
        start: () => void
        stop: () => void
      }
    }

    const Recognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition

    if (!Recognition) {
      setRecognitionSupported(false)
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setInput(transcript)
      }
    }

    recognition.onerror = () => {
      setListening(false)
      setStatus('MICROPHONE UNAVAILABLE')
    }

    recognition.onend = () => {
      setListening(false)
      setStatus('SYSTEM ONLINE')
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function speak(text: string) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1.05

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  async function sendMessage(message = input) {
    const cleanMessage = message.trim()
    if (!cleanMessage) return

    const response = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: cleanMessage }),
    })

    if (!response.ok) {
      throw new Error("AURA backend request failed")
    }

    const data = await response.json()
    const reply = data.reply

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), role: 'user', text: cleanMessage },
      { id: Date.now() + 1, role: 'aura', text: reply },
    ])

    setInput('')
    speak(reply)
  }

  function toggleMicrophone() {
    if (!recognitionRef.current) {
      setStatus('VOICE INPUT NOT SUPPORTED')
      return
    }

    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    try {
      setInput('')
      setStatus('LISTENING...')
      setListening(true)
      recognitionRef.current.start()
    } catch {
      setListening(false)
      setStatus('MICROPHONE BUSY — TRY AGAIN')
    }
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AURA home">
          <span className="brand-mark">A</span>
          <span>AURA<span className="brand-dot">.</span></span>
        </a>

        <div className="system-status">
          <span className="status-light" />
          {status}
        </div>

        <button
          className={`voice-toggle ${voiceEnabled ? 'enabled' : ''}`}
          onClick={() => {
            if (voiceEnabled) stopSpeaking()
            setVoiceEnabled((previous) => !previous)
          }}
          aria-label={voiceEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}
          title={voiceEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}
        >
          {voiceEnabled ? '♫ Voice on' : '♫ Voice off'}
        </button>
      </header>

      <section className="main-content">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          YOUR PERSONAL AI ASSISTANT
          <span className="eyebrow-line" />
        </div>

        <h1>
          Meet your <span>other mind.</span>
        </h1>
        <p className="subtitle">
          A little intelligence, a little imagination.
          <br />
          All yours.
        </p>

        <div className={`orb-container ${listening ? 'is-listening' : ''} ${speaking ? 'is-speaking' : ''}`}>
          <div className="orb-ring ring-one" />
          <div className="orb-ring ring-two" />
          <div className="orb-ring ring-three" />
          <div className="orb">
            <div className="orb-core">
              <span>A</span>
            </div>
          </div>
          <div className="orb-caption">
            {listening ? 'I’M LISTENING' : speaking ? 'SPEAKING TO YOU' : 'READY WHEN YOU ARE'}
          </div>
        </div>

        <section className="chat-panel" aria-label="Conversation with AURA">
          <div className="chat-heading">
            <div>
              <span className="chat-heading-title">THE CONVERSATION</span>
              <span className="chat-heading-subtitle">Your space to think out loud.</span>
            </div>
            <span className="live-indicator">
              <span className="status-light" /> LIVE
            </span>
          </div>

          <div className="messages" aria-live="polite">
            {messages.map((message) => (
              <div className={`message ${message.role}`} key={message.id}>
                <span className="message-avatar">
                  {message.role === 'aura' ? 'A' : 'Y'}
                </span>
                <div className="message-body">
                  <span className="message-author">
                    {message.role === 'aura' ? 'AURA' : 'YOU'}
                  </span>
                  <p>{message.text}</p>
                </div>
                {message.role === 'aura' && (
                  <button
                    className="replay-button"
                    onClick={() => speak(message.text)}
                    aria-label="Speak this reply"
                    title="Speak this reply"
                  >
                    ↗
                  </button>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <button
              type="button"
              className={`mic-button ${listening ? 'active' : ''}`}
              onClick={toggleMicrophone}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
              title={recognitionSupported ? 'Speak to AURA' : 'Voice input is not supported in this browser'}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8" />
              </svg>
            </button>

            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={listening ? 'Listening… speak now' : 'Tell me what’s on your mind…'}
              aria-label="Message AURA"
            />

            <button type="submit" className="send-button" disabled={!input.trim()}>
              Send <span>↗</span>
            </button>
          </form>

          <div className="composer-footer">
            <span>
              {recognitionSupported
                ? 'VOICE INPUT AVAILABLE · CHECK YOUR BROWSER PERMISSIONS'
                : 'VOICE INPUT UNSUPPORTED · YOU CAN STILL TYPE'}
            </span>
            <span>PROTOTYPE 0.1</span>
          </div>
        </section>

        <p className="privacy-note">
          <span>✧</span> Early prototype · Responses are currently rule-based, not AI-generated.
        </p>
      </section>

      <footer className="footer">
        <span>DESIGNED WITH INTENTION</span>
        <span>AURA © 2026</span>
      </footer>
    </main>
  )
}

export default App
