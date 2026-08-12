const input = document.getElementById("textInput");
const counter = document.getElementById("counter");
const analyseBtn = document.getElementById("analyseBtn");
const clearBtn = document.getElementById("clearBtn");
const errorEl = document.getElementById("error");
const resultCard = document.getElementById("resultCard");


// -----------------------------------------------------
// CHARACTER COUNTER
// -----------------------------------------------------
input.addEventListener("input", () => {
    counter.textContent = `${input.value.length} / 5000`;
});


// -----------------------------------------------------
// CLEAR BUTTON
// -----------------------------------------------------
clearBtn.addEventListener("click", () => {
    input.value = "";
    counter.textContent = "0 / 5000";

    errorEl.textContent = "";
    errorEl.classList.add("hidden");

    resultCard.classList.add("hidden");

    const uncertaintyBox = document.getElementById("uncertaintyBox");

    if (uncertaintyBox) {
        uncertaintyBox.classList.add("hidden");
    }

    input.focus();
});


// -----------------------------------------------------
// ANALYSE BUTTON
// -----------------------------------------------------
analyseBtn.addEventListener("click", async () => {

    const text = input.value.trim();

    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    resultCard.classList.add("hidden");

    // Validate empty input
    if (!text) {
        errorEl.textContent = "Please enter a message to analyse.";
        errorEl.classList.remove("hidden");
        return;
    }

    analyseBtn.disabled = true;
    analyseBtn.textContent = "Analysing...";

    try {

        const response = await fetch("/api/predict", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.error || "Prediction failed. Please try again."
            );
        }

        renderResult(data.result);

    } catch (error) {

        console.error("Prediction error:", error);

        errorEl.textContent =
            error.message || "Prediction failed. Please try again.";

        errorEl.classList.remove("hidden");

    } finally {

        analyseBtn.disabled = false;
        analyseBtn.textContent = "Analyse message";
    }
});


// -----------------------------------------------------
// RENDER MODEL RESULT
// -----------------------------------------------------
function renderResult(result) {

    // Main result
    document.getElementById("resultTitle").textContent =
        result.title;

    document.getElementById("resultMessage").textContent =
        result.message;

    document.getElementById("category").textContent =
        result.category;

    document.getElementById("confidence").textContent =
        `${Number(result.confidence).toFixed(2)}%`;

    document.getElementById("recommendation").textContent =
        result.recommendation;


    // -------------------------------------------------
    // RISK / REVIEW BADGE
    // -------------------------------------------------
    const pill = document.getElementById("riskPill");

    if (result.uncertain) {

        pill.textContent = "Needs human review";

        pill.className =
            "risk-pill review";

    } else if (result.is_bullying) {

        pill.textContent = "High risk";

        pill.className =
            "risk-pill high";

    } else {

        pill.textContent = "Low risk";

        pill.className =
            "risk-pill low";
    }


    // -------------------------------------------------
    // UNCERTAINTY INFORMATION
    // -------------------------------------------------
    const uncertaintyBox =
        document.getElementById("uncertaintyBox");

    if (uncertaintyBox) {

        if (result.uncertain) {

            const topScoreText =
                document.getElementById("topScoreText");

            const secondCategory =
                document.getElementById("secondCategory");

            const secondScore =
                document.getElementById("secondScore");


            if (topScoreText) {
                topScoreText.textContent =
                    `${Number(result.confidence).toFixed(2)}%`;
            }

            if (secondCategory) {
                secondCategory.textContent =
                    result.second_category;
            }

            if (secondScore) {
                secondScore.textContent =
                    `${Number(result.second_score).toFixed(2)}%`;
            }

            uncertaintyBox.classList.remove("hidden");

        } else {

            uncertaintyBox.classList.add("hidden");
        }
    }


    // -------------------------------------------------
    // CATEGORY PROBABILITY SCORES
    // -------------------------------------------------
    const scores =
        document.getElementById("scores");

    scores.innerHTML = "";

    result.scores.forEach((item) => {

        const row =
            document.createElement("div");

        row.className = "score-row";

        const score =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(item.score)
                )
            );

        row.innerHTML = `
            <div class="score-label">
                ${escapeHtml(item.label)}
            </div>

            <div class="bar">
                <div style="width: ${score}%"></div>
            </div>

            <div class="score-value">
                ${score.toFixed(2)}%
            </div>
        `;

        scores.appendChild(row);
    });


    // -------------------------------------------------
    // DISPLAY RESULT
    // -------------------------------------------------
    resultCard.classList.remove("hidden");

    resultCard.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// -----------------------------------------------------
// HTML ESCAPING
// Prevents HTML/script injection inside labels
// -----------------------------------------------------
function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}
