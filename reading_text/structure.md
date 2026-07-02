# ROLE

You are a Senior AI Architect and Senior Backend Engineer.

Your task is NOT to simply build a Text-To-Speech service.

You are designing an AI Speech Platform that will become one of the core microservices of Course English.

The architecture must be production-ready, scalable, provider-independent and easy to extend.

Think like an architect, not a coder.

Never hardcode provider-specific logic.

Always use interfaces, dependency injection and provider factories.

---

# PRODUCT BACKGROUND

Course English is an AI-powered English Teaching Platform.

The AI Speech Platform will be shared by every module:

• AI Story
• Vocabulary
• Reading
• Listening
• Speaking
• IELTS Speaking
• Flashcards
• Read Aloud
• Pronunciation
• Shadowing
• AI Teacher

This service will become one of the core infrastructures.

---

# DESIGN PRINCIPLE

The frontend and Spring Boot should NEVER know which TTS provider is used.

The system should support switching between providers without changing business logic.

Supported providers:

Edge TTS
Azure Speech
Google TTS
ElevenLabs
OpenAI TTS
Cartesia
PlayHT
F5-TTS (Local)
CosyVoice (Local)

Future providers should be plug-and-play.

---

# MICROSERVICE

Create an independent Python microservice.

Technology Stack

Python 3.12

FastAPI

Pydantic

Uvicorn

Redis

FFmpeg

MinIO

Docker

Docker Compose

WhisperX

Faster Whisper

Torch

ONNX Runtime

HTTPX

The service communicates with Spring Boot using REST APIs.

---

# RESPONSIBILITIES

This service is NOT only responsible for TTS.

It should become an AI Speech Platform.

Modules

1. Text To Speech

Generate speech from text.

2. Alignment

Generate word timestamps.

Generate sentence timestamps.

3. Speech To Text

Transcribe uploaded audio.

4. Pronunciation

Future expansion.

5. Audio Processing

Convert

Trim

Merge

Normalize

Change speed

6. Storage

Upload audio

Return URL

---

# PROJECT STRUCTURE

ai-speech-platform/

│

├── app/

│

├── api/

│ tts.py

│ stt.py

│ alignment.py

│ task.py

│

├── core/

│ config.py

│ logger.py

│ security.py

│ exception.py

│

├── providers/

│

│ base/

│ base_tts_provider.py

│ base_alignment_provider.py

│ base_stt_provider.py

│

│ edge/

│

│ elevenlabs/

│

│ azure/

│

│ google/

│

│ openai/

│

│ cartesia/

│

│ playht/

│

│ f5tts/

│

│ cosyvoice/

│

├── factories/

│ provider_factory.py

│

├── services/

│ speech_service.py

│ tts_service.py

│ stt_service.py

│ alignment_service.py

│ storage_service.py

│

├── storage/

│ minio.py

│ local.py

│

├── models/

│

│ request.py

│ response.py

│ timeline.py

│

├── utils/

│

├── temp/

├── output/

├── tests/

└── main.py

---

# PROVIDER PATTERN

Never write

if provider == "edge"

inside business logic.

Instead

BaseTTSProvider

↓

EdgeProvider

↓

ElevenProvider

↓

AzureProvider

↓

GoogleProvider

↓

F5Provider

↓

CosyVoiceProvider

ProviderFactory returns the correct implementation.

---

# REQUEST FLOW

React

↓

Spring Boot

↓

Speech Client

↓

AI Speech Platform

↓

Provider

↓

Generate Audio

↓

Generate Timeline

↓

Upload MinIO

↓

Return JSON

---

# TTS FLOW

Input

{

provider

voice

text

speed

pitch

format

}

↓

Generate audio

↓

Save temporary audio

↓

Generate Alignment

↓

Upload audio

↓

Delete temp files

↓

Return result

---

# ALIGNMENT

Every generated audio must produce alignment.

Never rely on frontend.

Alignment contains

Word Timeline

Sentence Timeline

Character Timeline (future)

Example

WordTimeline

{

wordIndex

word

start

end

charStart

charEnd

}

SentenceTimeline

{

sentenceIndex

start

end

}

---

# STORAGE

Support

Local

MinIO

AWS S3

Azure Blob

Storage layer must be abstract.

---

# RESPONSE MODEL

SpeechResult

{

provider,

voice,

duration,

audioUrl,

timeline,

sentenceTimeline,

metadata

}

---

# SPRING BOOT

Spring Boot should only know

SpeechClient

SpeechResult

It should NEVER know

Edge

ElevenLabs

Google

Azure

---

# FRONTEND

Frontend receives

Audio URL

Timeline

Sentence Timeline

React Audio Player uses currentTime.

When currentTime changes

↓

Find active word

↓

Highlight word

↓

Highlight sentence

↓

Smooth scroll

Never call backend while playing audio.

---

# WORD HIGHLIGHT

Story HTML

Every word has

data-word-index

React compares

currentWordIndex

with

wordIndex

instead of comparing text.

This avoids duplicate word issues.

---

# AI STORY

Story generation is NOT part of this service.

Story comes from Spring Boot.

The Speech Platform only receives plain text.

Never receive HTML.

---

# CACHE

Audio generation is expensive.

Before generating

Calculate SHA256

(text + voice + provider + speed)

If identical request already exists

Return cached audio

Do not regenerate.

---

# TASK SYSTEM

Audio generation should become asynchronous.

POST

/tts/generate

↓

taskId

↓

Worker

↓

Generate

↓

Store

↓

Return SUCCESS

---

# FUTURE FEATURES

Voice Clone

Emotion

Multiple Speakers

Dialogue

Conversation

Shadowing

Read Along

Pronunciation Score

Streaming Audio

Podcast

Audiobook

Video Subtitle

Automatic Subtitle

---

# API DESIGN

POST /api/v1/tts/generate

POST /api/v1/stt/transcribe

POST /api/v1/alignment

GET /api/v1/task/{id}

GET /api/v1/audio/{id}

---

# NON-FUNCTIONAL REQUIREMENTS

Use SOLID.

Use Clean Architecture.

Use Strategy Pattern.

Use Factory Pattern.

Use Dependency Injection.

Use Async IO whenever possible.

Separate providers from business logic.

Never duplicate code.

Every provider should implement the same interface.

The project must be easy to add a new provider in less than 30 minutes.

---

# GOAL

Do NOT start writing code immediately.

First design the complete architecture.

Then create folder structure.

Then create interfaces.

Then implement Edge TTS first.

After Edge works perfectly, implement ElevenLabs.

The system must be production-ready and able to scale into an enterprise AI Speech Platform.

Do NOT implement everything at once.

Split the project into milestones.

Milestone 1

- Project skeleton
- Folder structure
- FastAPI
- Configuration
- Logging

Milestone 2

- Base Provider Interfaces
- Provider Factory
- Storage Layer

Milestone 3

- Edge TTS implementation
- Generate MP3
- Upload MinIO

Milestone 4

- Alignment integration
- Word Timeline
- Sentence Timeline

Milestone 5

- Spring Boot integration
- REST Client
- API Documentation

Milestone 6

- React Audio Player
- Highlight current word
- Highlight current sentence

Milestone 7

- ElevenLabs Provider

Milestone 8

- Cache
- Redis
- Async Tasks

After each milestone:

- Explain the architecture.
- Explain why the design was chosen.
- Wait for confirmation before continuing.
