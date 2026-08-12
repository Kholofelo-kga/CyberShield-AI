const input =
    document.getElementById("textInput");

const counter =
    document.getElementById("counter");

const analyseBtn =
    document.getElementById("analyseBtn");

const clearBtn =
    document.getElementById("clearBtn");

const errorEl =
    document.getElementById("error");

const resultCard =
    document.getElementById("resultCard");


// =====================================================
// CHARACTER COUNTER
// =====================================================

input.addEventListener(
    "input",
    () => {

        counter.textContent =
            `${input.value.length} / 5000`;

    }
);


// =====================================================
// CLEAR
// =====================================================

clearBtn.addEventListener(
    "click",
    () => {

        input.value = "";

        counter.textContent =
            "0 / 5000";

        errorEl.textContent =
            "";

        errorEl.classList.add(
            "hidden"
        );

        resultCard.classList.add(
            "hidden"
        );


        const uncertaintyBox =
            document.getElementById(
                "uncertaintyBox"
            );


        if (uncertaintyBox) {

            uncertaintyBox.classList.add(
                "hidden"
            );

        }


        resetConfidence();


        input.focus();

    }
);


// =====================================================
// ANALYSE MESSAGE
// =====================================================

analyseBtn.addEventListener(
    "click",
    async () => {

        const text =
            input.value.trim();


        errorEl.textContent =
            "";

        errorEl.classList.add(
            "hidden"
        );


        resultCard.classList.add(
            "hidden"
        );


        if (!text) {

            errorEl.textContent =
                "Please enter a message to analyse.";

            errorEl.classList.remove(
                "hidden"
            );

            return;

        }


        analyseBtn.disabled =
            true;

        analyseBtn.textContent =
            "Analysing...";


        try {

            const response =
                await fetch(
                    "/api/predict",
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                text: text
                            })

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.ok
            ) {

                throw new Error(
                    data.error ||
                    "Prediction failed."
                );

            }


            renderResult(
                data.result
            );


        } catch (error) {

            console.error(
                error
            );


            errorEl.textContent =
                error.message ||
                "Prediction failed. Please try again.";


            errorEl.classList.remove(
                "hidden"
            );


        } finally {

            analyseBtn.disabled =
                false;

            analyseBtn.textContent =
                "Analyse Message";

        }

    }
);


// =====================================================
// RENDER RESULTS
// =====================================================

function renderResult(
    result
) {

    document.getElementById(
        "resultTitle"
    ).textContent =
        result.title;


    document.getElementById(
        "resultMessage"
    ).textContent =
        result.message;


    document.getElementById(
        "category"
    ).textContent =
        result.category;


    const confidence =
        Number(
            result.confidence
        );


    document.getElementById(
        "confidence"
    ).textContent =
        `${confidence.toFixed(2)}%`;


    document.getElementById(
        "confidenceLarge"
    ).textContent =
        `${confidence.toFixed(2)}%`;


    document.getElementById(
        "recommendation"
    ).textContent =
        result.recommendation;


    // ================================================
    // BADGE
    // ================================================

    const pill =
        document.getElementById(
            "riskPill"
        );


    if (
        result.uncertain
    ) {

        pill.textContent =
            "Needs human review";

        pill.className =
            "risk-pill review";

    }

    else if (
        result.is_bullying
    ) {

        pill.textContent =
            "High risk";

        pill.className =
            "risk-pill high";

    }

    else {

        pill.textContent =
            "Low risk";

        pill.className =
            "risk-pill low";

    }


    // ================================================
    // CONFIDENCE BAR
    // ================================================

    const confidenceBar =
        document.getElementById(
            "confidenceBar"
        );


    confidenceBar.style.width =
        "0%";


    setTimeout(
        () => {

            confidenceBar.style.width =
                `${Math.min(
                    confidence,
                    100
                )}%`;

        },
        100
    );


    // ================================================
    // UNCERTAINTY BOX
    // ================================================

    const uncertaintyBox =
        document.getElementById(
            "uncertaintyBox"
        );


    if (
        result.uncertain
    ) {

        document.getElementById(
            "topScoreText"
        ).textContent =
            `${confidence.toFixed(2)}%`;


        document.getElementById(
            "secondCategory"
        ).textContent =
            result.second_category;


        document.getElementById(
            "secondScore"
        ).textContent =
            `${Number(
                result.second_score
            ).toFixed(2)}%`;


        uncertaintyBox.classList.remove(
            "hidden"
        );

    }

    else {

        uncertaintyBox.classList.add(
            "hidden"
        );

    }


    // ================================================
    // MODEL SCORES
    // ================================================

    const scores =
        document.getElementById(
            "scores"
        );


    scores.innerHTML =
        "";


    result.scores.forEach(
        item => {

            const score =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            item.score
                        )
                    )
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "score-row";


            row.innerHTML =
                `

                <div class="score-label">

                    ${escapeHtml(
                        item.label
                    )}

                </div>


                <div class="bar">

                    <div
                        style="
                            width:
                            ${score}%
                        "
                    >
                    </div>

                </div>


                <div class="score-value">

                    ${score.toFixed(
                        2
                    )}%

                </div>

                `;


            scores.appendChild(
                row
            );

        }
    );


    // ================================================
    // DISPLAY RESULT
    // ================================================

    resultCard.classList.remove(
        "hidden"
    );


    resultCard.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


// =====================================================
// RESET CONFIDENCE
// =====================================================

function resetConfidence() {

    const confidenceBar =
        document.getElementById(
            "confidenceBar"
        );


    const confidenceLarge =
        document.getElementById(
            "confidenceLarge"
        );


    if (
        confidenceBar
    ) {

        confidenceBar.style.width =
            "0%";

    }


    if (
        confidenceLarge
    ) {

        confidenceLarge.textContent =
            "0%";

    }

}


// =====================================================
// HTML ESCAPING
// =====================================================

function escapeHtml(
    value
) {

    return String(
        value
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
