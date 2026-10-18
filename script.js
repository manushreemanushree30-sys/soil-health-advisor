
const form = document.getElementById("soilForm");
const steps = [...document.querySelectorAll(".step")];
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const errorBox = document.getElementById("error");

let currentStep = 0;
let cropChart = null;
let nutrientChart = null;

const fieldNames = [
    ["N", "Nitrogen"],
    ["P", "Phosphorus"],
    ["K", "Potassium"],
    ["ph", "Soil pH"],
    ["temperature", "Temperature (°C)"],
    ["humidity", "Humidity (%)"],
    ["rainfall", "Rainfall (mm)"]
];

function showStep(index) {
    currentStep = index;

    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
    });

    backBtn.hidden = index === 0;
    nextBtn.hidden = index === steps.length - 1;
    analyzeBtn.hidden = index !== steps.length - 1;

    document.getElementById("progressBar").style.width =
        `${((index + 1) / steps.length) * 100}%`;

    const titles = [
        "Soil nutrients",
        "Climate conditions",
        "Review and analyze"
    ];

    document.getElementById("stepLabel").textContent =
        `Step ${index + 1} of ${steps.length} · ${titles[index]}`;

    if (index === 2) {
        renderReview();
    }

    errorBox.textContent = "";
}

function validateStep(index) {
    const inputs = [...steps[index].querySelectorAll("input")];

    for (const input of inputs) {
        if (!input.reportValidity()) {
            return false;
        }
    }

    return true;
}

function getFormData() {
    const data = {};

    fieldNames.forEach(([key]) => {
        data[key] = Number(form.elements[key].value);
    });

    return data;
}

function renderReview() {
    const review = document.getElementById("review");
    review.replaceChildren();

    const data = getFormData();

    fieldNames.forEach(([key, label]) => {
        const item = document.createElement("div");
        item.className = "review-item";

        const name = document.createElement("span");
        name.textContent = label;

        const value = document.createElement("strong");
        value.textContent = String(data[key]);

        item.append(name, value);
        review.appendChild(item);
    });
}

nextBtn.addEventListener("click", () => {
    if (validateStep(currentStep)) {
        showStep(Math.min(currentStep + 1, steps.length - 1));
    }
});

backBtn.addEventListener("click", () => {
    showStep(Math.max(currentStep - 1, 0));
});

function renderCrops(crops) {
    const list = document.getElementById("cropList");
    list.replaceChildren();

    crops.forEach((crop, index) => {
        const row = document.createElement("div");
        row.className = "crop-row";

        const heading = document.createElement("div");
        heading.className = "crop-row-head";

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${crop.crop}`;

        const score = document.createElement("span");
        score.textContent = `${crop.score}%`;

        const track = document.createElement("div");
        track.className = "score-track";

        const fill = document.createElement("div");
        fill.className = "score-fill";
        fill.style.width = `${Math.max(0, Math.min(100, crop.score))}%`;

        track.appendChild(fill);
        heading.append(name, score);
        row.append(heading, track);
        list.appendChild(row);
    });
}

function renderCharts(result) {
    if (cropChart) cropChart.destroy();
    if (nutrientChart) nutrientChart.destroy();

    cropChart = new Chart(
        document.getElementById("cropChart"),
        {
            type: "bar",
            data: {
                labels: result.crops.map(crop => crop.crop),
                datasets: [{
                    label: "Rule-match score (%)",
                    data: result.crops.map(crop => crop.score),
                    backgroundColor: "#4b9667",
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: "Score (%)"
                        }
                    }
                }
            }
        }
    );

    nutrientChart = new Chart(
        document.getElementById("nutrientChart"),
        {
            type: "bar",
            data: {
                labels: Object.keys(result.nutrients),
                datasets: [{
                    label: "Entered value",
                    data: Object.values(result.nutrients),
                    backgroundColor: [
                        "#43845b",
                        "#d7a34c",
                        "#548cc0"
                    ],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        }
    );
}

function renderGuidance(messages) {
    const list = document.getElementById("guidance");
    list.replaceChildren();

    messages.forEach(message => {
        const item = document.createElement("li");
        item.textContent = message;
        list.appendChild(item);
    });
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!validateStep(currentStep)) return;

    errorBox.textContent = "";
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {
        const response = await fetch("/recommend", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(getFormData())
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Analysis failed.");
        }

        if (!result.crops || result.crops.length === 0) {
            throw new Error("No crop recommendations were returned.");
        }

        document.getElementById("topCrop").textContent =
            result.crops[0].crop;

        document.getElementById("topScore").textContent =
            `Rule-match score: ${result.crops[0].score}%`;

        document.getElementById("cropCount").textContent =
            String(result.crops.length);

        renderCrops(result.crops);
        renderCharts(result);
        renderGuidance(result.guidance);

        const results = document.getElementById("results");
        results.hidden = false;
        results.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        errorBox.textContent =
            error.message || "Could not connect to the server.";
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze soil";
    }
});

showStep(0);
