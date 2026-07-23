import sys
import json
import os
import torch
import whisper
import torch.nn.functional as F
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
from transformers import Trainer, TrainingArguments, DataCollatorWithPadding
from datasets import load_dataset

MODEL_DIR = "tox_model_bert"

def train_model():
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    dataset = load_dataset("civil_comments", split="train[:2000]")
    dataset = dataset.map(lambda x: {'labels': int(x['toxicity'] > 0.5)})

    def tokenize(batch):
        return tokenizer(batch['text'], padding=True, truncation=True)

    dataset = dataset.map(tokenize, batched=True)
    dataset.set_format(type='torch', columns=['input_ids', 'attention_mask', 'labels'])

    train_size = int(0.8 * len(dataset))
    train_dataset = dataset.select(range(train_size))
    val_dataset = dataset.select(range(train_size, len(dataset)))

    model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

    training_args = TrainingArguments(
        output_dir=MODEL_DIR,
        num_train_epochs=1,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        save_strategy="epoch",
        logging_strategy="no"
    )

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator
    )
    trainer.train()
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)

def transcribe_audio(audio_path):
    model = whisper.load_model("tiny")
    result = model.transcribe(audio_path)
    return result['text']

def predict(text):
    tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)
    model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1).cpu().numpy()[0]
    return {
        "prediction": "TOXIC" if probs[1] >= 0.5 else "NOT TOXIC",
        "toxicity_score": float(probs[1]),
        "non_toxic_score": float(probs[0])
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio path provided"}))
        sys.exit(1)
        
    audio_path = sys.argv[1]
    
    try:
        # redirect stdout so whisper models logging doesn't ruin json parsing later
        original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        
        if not os.path.exists(MODEL_DIR):
            train_model()
            
        text = transcribe_audio(audio_path)
        result = predict(text)
        
        output = {
            "transcription": text,
            "prediction": result["prediction"],
            "toxicity_score": result["toxicity_score"],
            "non_toxic_score": result["non_toxic_score"]
        }
        
        sys.stdout = original_stdout
        print(json.dumps(output))
        
    except Exception as e:
        sys.stdout = original_stdout
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
