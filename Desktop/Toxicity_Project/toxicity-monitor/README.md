# 🛡️ Toxicity Monitor - Deep Learning Sentiment & Hate Speech Analyzer

Toxicity Monitor is a comprehensive, multi-modal web application built to analyze and classify digital interactions (text and audio) for toxic behavior, hate speech, and negative sentiment. Powered by completely localized Machine Learning architectures, the application provides instantaneous, private, and highly accurate toxicity scoring.

## 🌟 Key Features

### 1. 💬 YouTube Conversation Scanner
Paste any YouTube Video URL to perform a deep-scan on its active comment section. 
- **Dynamic Sampling:** Users can specifically select the sample size (ranging from 5 to 100 comments) to parse via an interactive slider.
- **On-Device NLP Classification:** Powered by `@xenova/transformers`, the Next.js backend natively tokenizes and scores each individual comment through a pre-trained Toxicity model, resulting in a system-wide "Toxicity Confidence Score".
- **Visual Stream:** Safely flagged and distinctly color-coded comment streams allow moderators to instantly pinpoint and identify abusive text.

### 2. 🎙️ Audio Transcription & Toxicity Detection
A robust Python AI server serves as the backbone for translating voice memos into classified sentiment.
- **OpenAI Whisper Integration:** Upload any audio file (`.mp3`, `.wav`, `.m4a`) to have the Python server rapidly decode and transcribe the spoken words using OpenAI's Whisper engine.
- **DistilBERT Classification:** The transcribed text is immediately pipelined into a pre-trained `DistilBERT` sequence classification model (fine-tuned on the massive *Civil Comments* dataset).
- **Persistent "Warm Memory" Architecture:** The massive PyTorch ML models are bound directly to the active RAM of the local Flask API server upon boot. This completely bypasses traditional cold-start delays, enabling blazing-fast sub-second analysis for every uploaded file!

## ⚙️ Tech Stack & Architecture
- **Frontend / Core Backend:** Next.js (App Router), React, TypeScript
- **Styling:** CSS Modules, Glassmorphism UI, Responsive Design
- **Text Machine Learning:** JavaScript Xenova Transformers (`toxic-bert` pipeline)
- **Audio Machine Learning Server:** Python, Flask, PyTorch, OpenAI Whisper, HuggingFace (`DistilBERT`)
- **Audio Decoding Engine:** Native FFmpeg OS injection 

## 🚀 Getting Started

### 1. Launching the Next.js Frontend
Navigate to the `toxicity-monitor` directory and run:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Launching the Python ML Server
Open a second, separate terminal window in the `toxicity-monitor` folder:
```bash
pip install -r requirements.txt
python audio_server.py
```
Wait for the initial weights to download from HuggingFace. Once it prints `✅ Python API Server is LIVE on port 5000!`, the Audio Upload feature on your web app will be fully unlocked and ready for use.
