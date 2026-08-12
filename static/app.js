const input = document.getElementById("textInput");
const counter = document.getElementById("counter");
const analyseBtn = document.getElementById("analyseBtn");
const clearBtn = document.getElementById("clearBtn");
const errorEl = document.getElementById("error");
const resultCard = document.getElementById("resultCard");

input.addEventListener("input", () => {
  counter.textContent = `${input.value.length} / 5000`;
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  counter.textContent = "0 / 5000";
  errorEl.classList.add("hidden");
  resultCard.classList.add("hidden");
  input.focus();
});

analyseBtn.addEventListener("click", async () => {
  const text = input.value.trim();
  errorEl.classList.add("hidden");
  resultCard.classList.add("hidden");

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Prediction failed.");
    }

    renderResult(data.result);
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove("hidden");
  } finally {
    analyseBtn.disabled = false;
    analyseBtn.textContent = "Analyse message";
  }
});

function renderResult(result) {
  document.getElementById("resultTitle").textContent = result.title;
  document.getElementById("resultMessage").textContent = result.message;
  document.getElementById("category").textContent = result.category;
  document.getElementById("confidence").textContent = `${result.confidence.toFixed(2)}%`;
  document.getElementById("recommendation").textContent = result.recommendation;

  const pill = document.getElementById("riskPill");
  pill.textContent = `${result.risk} risk`;
  pill.className = `risk-pill ${result.risk.toLowerCase()}`;

  const scores = document.getElementById("scores");
  scores.innerHTML = "";

  result.scores.forEach(item => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <div class="score-label">${escapeHtml(item.label)}</div>
      <div class="bar"><div style="width:${Math.max(0, Math.min(100, item.score))}%"></div></div>
      <div class="score-value">${item.score.toFixed(2)}%</div>
    `;
    scores.appendChild(row);
  });

  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
