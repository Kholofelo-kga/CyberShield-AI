from pathlib import Path
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

DATASET = Path("cyberbullying_tweets.csv")
MODEL_DIR = Path("model")
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATASET)
df = df[["tweet_text", "cyberbullying_type"]].dropna().drop_duplicates()

X_train, X_test, y_train, y_test = train_test_split(
    df["tweet_text"],
    df["cyberbullying_type"],
    test_size=0.20,
    random_state=42,
    stratify=df["cyberbullying_type"],
)

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.98,
        max_features=30000,
        sublinear_tf=True,
    )),
    ("classifier", LogisticRegression(
        max_iter=1200,
        class_weight="balanced",
        solver="lbfgs",
        C=4.0,
    )),
])

pipeline.fit(X_train, y_train)
predictions = pipeline.predict(X_test)

print("Accuracy:", round(accuracy_score(y_test, predictions), 4))
print("Macro F1:", round(f1_score(y_test, predictions, average="macro"), 4))
print(classification_report(y_test, predictions))

joblib.dump(
    pipeline,
    MODEL_DIR / "cyberbullying_model.joblib",
    compress=3,
)
print("Saved model/cyberbullying_model.joblib")
