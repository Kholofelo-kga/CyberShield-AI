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
        "message": "The model did not identify this text as cyberbullying."
    },
    "age": {
        "title": "Potential Cyberbullying Detected",
        "category": "Age-Based Cyberbullying",
        "is_bullying": True,
        "message": "The text contains patterns associated with age-based cyberbullying."
    },
    "gender": {
        "title": "Potential Cyberbullying Detected",
        "category": "Gender-Based Cyberbullying",
        "is_bullying": True,
        "message": "The text contains patterns associated with gender-based cyberbullying."
    },
    "ethnicity": {
        "title": "Potential Cyberbullying Detected",
        "category": "Ethnicity-Based Cyberbullying",
        "is_bullying": True,
        "message": "The text contains patterns associated with ethnicity-based cyberbullying."
    },
    "religion": {
        "title": "Potential Cyberbullying Detected",
        "category": "Religion-Based Cyberbullying",
        "is_bullying": True,
        "message": "The text contains patterns associated with religion-based cyberbullying."
    },
    "other_cyberbullying": {
        "title": "Potential Cyberbullying Detected",
        "category": "Other Cyberbullying",
        "is_bullying": True,
        "message": (
            "The text contains patterns associated with cyberbullying "
            "that do not fall into the four specific categories."
        )
    }
}


def normalize_input(text: str) -> str:
    """
    Performs light validation and whitespace normalisation.
    TF-IDF handles lowercase and Unicode normalisation internally.
    """
    return re.sub(r"\s+", " ", text or "").strip()


def predict_text(text: str):
    clean_text = normalize_input(text)

    if not clean_text:
        raise ValueError("Please enter a message to analyse.")

    if len(clean_text) > 5000:
        raise ValueError(
            "Please enter a message shorter than 5,000 characters."
        )

    # Predict class
    predicted_label = model.predict([clean_text])[0]

    # Obtain probabilities for all six classes
    probabilities = model.predict_proba([clean_text])[0]
    classes = model.classes_

    class_probabilities = {
        str(label): round(float(probability) * 100, 2)
        for label, probability in zip(classes, probabilities)
    }

    # Sort classes from highest to lowest probability
    sorted_raw = sorted(
        class_probabilities.items(),
        key=lambda item: item[1],
        reverse=True
    )

    top_label, top_score = sorted_raw[0]
    second_label, second_score = sorted_raw[1]

    confidence_margin = round(top_score - second_score, 2)

    # ---------------------------------------------------------
    # PROTOTYPE UNCERTAINTY RULE
    #
    # Mark the prediction as uncertain when:
    # 1. Top probability is below 60%, OR
    # 2. Difference between top two classes is below 10%.
    #
    # These are interface thresholds and not statistically
    # calibrated research thresholds.
    # ---------------------------------------------------------
  is_uncertain = (
    top_score < 50.0
    or (
        top_score < 60.0
        and confidence_margin < 10.0
    )
)

    info = LABELS[predicted_label]

    sorted_scores = [
        {
            "label": LABELS[label]["category"],
            "score": score
        }
        for label, score in sorted_raw
    ]

    # ---------------------------------------------------------
    # UNCERTAIN RESULT
    # ---------------------------------------------------------
    if is_uncertain:
        title = "Uncertain Prediction"

        risk = "Needs review"

        message = (
            f"The model currently favours {info['category']}, "
            "but the prediction is not strong enough to be treated "
            "as a confident automated decision."
        )

        recommendation = (
            "Human review is recommended because the prediction "
            "confidence is low or the top categories have similar probabilities."
        )

    # ---------------------------------------------------------
    # CONFIDENT CYBERBULLYING RESULT
    # ---------------------------------------------------------
    elif info["is_bullying"]:
        title = "Potential Cyberbullying Detected"

        risk = "High"

        message = info["message"]

        recommendation = (
            "Flag this content for human moderator review before taking action."
        )

    # ---------------------------------------------------------
    # CONFIDENT NON-CYBERBULLYING RESULT
    # ---------------------------------------------------------
    else:
        title = "No Cyberbullying Detected"

        risk = "Low"

        message = info["message"]

        recommendation = (
            "No moderation action is recommended from this "
            "model prediction alone."
        )

    return {
        "prediction": predicted_label,

        "title": title,

        "category": info["category"],

        "is_bullying": info["is_bullying"],

        "risk": risk,

        "confidence": top_score,

        "confidence_margin": confidence_margin,

        "uncertain": is_uncertain,

        "second_category": LABELS[second_label]["category"],

        "second_score": second_score,

        "message": message,

        "recommendation": recommendation,

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

        result = predict_text(text)

        return jsonify({
            "ok": True,
            "result": result
        })

    except ValueError as exc:
        return jsonify({
            "ok": False,
            "error": str(exc)
        }), 400

    except Exception as exc:
        print(f"Prediction error: {exc}")

        return jsonify({
            "ok": False,
            "error": "Prediction failed. Please try again."
        }), 500


@app.route("/health", methods=["GET"])
def health():
    return {
        "status": "ok"
    }


if __name__ == "__main__":
    app.run(debug=True)
