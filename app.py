from pathlib import Path
import re
import joblib
from flask import Flask, render_template, request, jsonify

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "cyberbullying_model.joblib"

app = Flask(__name__)
model = joblib.load(MODEL_PATH)

LABELS = {
    "not_cyberbullying": {
        "title": "No Cyberbullying Detected",
        "category": "Not Cyberbullying",
        "is_bullying": False,
        "risk": "Low",
        "message": "The model did not identify this text as cyberbullying."
    },
    "age": {
        "title": "Potential Cyberbullying Detected",
        "category": "Age-Based Cyberbullying",
        "is_bullying": True,
        "risk": "High",
        "message": "The text contains patterns associated with age-based cyberbullying."
    },
    "gender": {
        "title": "Potential Cyberbullying Detected",
        "category": "Gender-Based Cyberbullying",
        "is_bullying": True,
        "risk": "High",
        "message": "The text contains patterns associated with gender-based cyberbullying."
    },
    "ethnicity": {
        "title": "Potential Cyberbullying Detected",
        "category": "Ethnicity-Based Cyberbullying",
        "is_bullying": True,
        "risk": "High",
        "message": "The text contains patterns associated with ethnicity-based cyberbullying."
    },
    "religion": {
        "title": "Potential Cyberbullying Detected",
        "category": "Religion-Based Cyberbullying",
        "is_bullying": True,
        "risk": "High",
        "message": "The text contains patterns associated with religion-based cyberbullying."
    },
    "other_cyberbullying": {
        "title": "Potential Cyberbullying Detected",
        "category": "Other Cyberbullying",
        "is_bullying": True,
        "risk": "High",
        "message": "The text contains patterns associated with cyberbullying that do not fall into the four specific categories."
    }
}

def normalize_input(text: str) -> str:
    """Light validation only. TF-IDF performs lowercase/Unicode normalization internally."""
    text = re.sub(r"\s+", " ", text or "").strip()
    return text

def predict_text(text: str):
    clean_text = normalize_input(text)

    if not clean_text:
        raise ValueError("Please enter a message to analyse.")

    if len(clean_text) > 5000:
        raise ValueError("Please enter a message shorter than 5,000 characters.")

    predicted_label = model.predict([clean_text])[0]
    probabilities = model.predict_proba([clean_text])[0]
    classes = model.classes_

    class_probabilities = {
        str(label): round(float(probability) * 100, 2)
        for label, probability in zip(classes, probabilities)
    }

    confidence = max(class_probabilities.values())
    info = LABELS[predicted_label]

    sorted_scores = sorted(
        [
            {
                "label": LABELS[label]["category"],
                "score": score
            }
            for label, score in class_probabilities.items()
        ],
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "prediction": predicted_label,
        "title": info["title"],
        "category": info["category"],
        "is_bullying": info["is_bullying"],
        "risk": info["risk"],
        "confidence": confidence,
        "message": info["message"],
        "recommendation": (
            "Flag for human moderator review before taking action."
            if info["is_bullying"]
            else "No moderation action is recommended from this model prediction alone."
        ),
        "scores": sorted_scores
    }

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/api/predict", methods=["POST"])
def api_predict():
    try:
        payload = request.get_json(silent=True) or {}
        text = payload.get("text", "")
        return jsonify({"ok": True, "result": predict_text(text)})
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception:
        return jsonify({"ok": False, "error": "Prediction failed. Please try again."}), 500

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(debug=True)
