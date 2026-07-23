import os, json, warnings
import torch, whisper

# Add FFmpeg to PATH dynamically for Windows since winget PATH updates require a reboot
ffmpeg_path = r"C:\Users\ADMIN\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin"
if os.path.exists(ffmpeg_path):
    os.environ["PATH"] += os.pathsep + ffmpeg_path

import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from datasets import load_dataset
from transformers import Trainer, TrainingArguments, DataCollatorWithPadding

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

MODEL_DIR = "tox_model_bert"

# ----------------- GLOBAL MODELS (LOADED ONCE) -----------------
print("=========================================")
print("🚀 [1/3] Loading Whisper 'tiny' Model...")
whisper_model = whisper.load_model("tiny")

# Check if Toxicity Model needs downloading
def train_model():
    print("🚀 [2/3] Downloading pre-trained Toxicity Machine Learning Model...")
    # 'martin-ha/toxic-comment-model' is exactly DistilBERT trained on civil_comments!
    temp_tokenizer = DistilBertTokenizer.from_pretrained("martin-ha/toxic-comment-model")
    temp_model = DistilBertForSequenceClassification.from_pretrained("martin-ha/toxic-comment-model")
    
    # Save it so we only download it once
    temp_tokenizer.save_pretrained(MODEL_DIR)
    temp_model.save_pretrained(MODEL_DIR)

if not os.path.exists(os.path.join(MODEL_DIR, "config.json")):
    print("Models not fully trained. Starting training...")
    train_model()
else:
    print("✅ [2/3] Toxicity Model already exists on disk.")

print("🚀 [3/3] Loading DistilBERT Toxicity Weights into Memory...")
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
bert_model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)

print("=========================================")
print("✅ Python API Server is LIVE on port 5000!")
print("=========================================")


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    temp_path = "temp_audio_file_" + file.filename
    file.save(temp_path)
    
    try:
        # 1. Transcribe with Segments
        result = whisper_model.transcribe(temp_path)
        full_text = result['text']
        raw_segments = result.get('segments', [])
        
        # 2. Predict Toxicity for segments and full text
        def get_toxicity(t):
            inputs = tokenizer(t, return_tensors="pt", truncation=True, padding=True)
            with torch.no_grad():
                outputs = bert_model(**inputs)
                p = F.softmax(outputs.logits, dim=1).cpu().numpy()[0]
            return float(p[1]), "TOXIC" if p[1] >= 0.5 else "NOT TOXIC"

        full_score, full_prediction = get_toxicity(full_text)
        
        # Process individual segments for visualization
        processed_segments = []
        for s in raw_segments:
            score, _ = get_toxicity(s['text'])
            processed_segments.append({
                "text": s['text'],
                "start": s['start'],
                "end": s['end'],
                "score": score,
                "isToxic": score >= 0.5
            })

        # 3. Clean up
        os.remove(temp_path)
        
        return jsonify({
            "transcription": full_text,
            "prediction": full_prediction,
            "toxicity_score": full_score,
            "segments": processed_segments
        })
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=False)
