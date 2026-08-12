# CyberShield AI

A clean deployable cyberbullying-detection prototype trained on the `cyberbullying_tweets.csv` dataset.

## What the deployed model predicts

The model performs **six-class classification**:

- `age`
- `gender`
- `ethnicity`
- `religion`
- `other_cyberbullying`
- `not_cyberbullying`

The interface also converts these classes into a simple moderation view: cyberbullying detected / not detected, category, confidence, and a human-review recommendation.

## Model

- TF-IDF
- Unigrams + bigrams
- Logistic Regression
- Balanced class weighting
- Stratified 80/20 train/test split
- Random seed: 42

On the supplied dataset, the included trained model achieved approximately:

- Accuracy: **82.75%**
- Macro F1: **82.75%**

The model file is already included under `model/cyberbullying_model.joblib`.

## Run locally

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Retrain the model

Put `cyberbullying_tweets.csv` in the project root and run:

```bash
python train_model.py
```

Do not commit the dataset unless its licence permits redistribution.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial CyberShield AI prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/cybershield-ai.git
git push -u origin main
```

## Deploy to Vercel from GitHub

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import the `cybershield-ai` GitHub repository.
4. Keep the default project settings.
5. Click **Deploy**.

Vercel supports Flask/Python apps and can detect `app.py` as a supported entry point.

## Important

This application is a research prototype. Predictions should not be used as automatic grounds for banning, disciplining, or sanctioning a person. Flagged content should receive human review.
