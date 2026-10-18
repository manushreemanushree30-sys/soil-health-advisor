
# crop_rules.py
# Rule-based crop recommendation engine.
# These ranges are illustrative, not validated farm prescriptions.

CROPS = {
    "Rice": {
        "N": (60, 100),
        "P": (30, 60),
        "K": (30, 60),
        "ph": (5.5, 7.0),
        "temperature": (20, 35),
        "humidity": (70, 95),
        "rainfall": (150, 300)
    },
    "Maize": {
        "N": (60, 120),
        "P": (30, 60),
        "K": (25, 60),
        "ph": (5.5, 7.5),
        "temperature": (18, 32),
        "humidity": (40, 80),
        "rainfall": (50, 150)
    },
    "Wheat": {
        "N": (50, 100),
        "P": (30, 60),
        "K": (20, 50),
        "ph": (6.0, 7.5),
        "temperature": (10, 25),
        "humidity": (30, 70),
        "rainfall": (30, 100)
    },
    "Chickpea": {
        "N": (20, 50),
        "P": (40, 80),
        "K": (15, 40),
        "ph": (5.5, 8.0),
        "temperature": (15, 30),
        "humidity": (30, 70),
        "rainfall": (40, 100)
    },
    "Cotton": {
        "N": (60, 120),
        "P": (30, 60),
        "K": (30, 70),
        "ph": (5.5, 8.0),
        "temperature": (21, 35),
        "humidity": (40, 80),
        "rainfall": (50, 150)
    },
    "Groundnut": {
        "N": (20, 50),
        "P": (30, 60),
        "K": (20, 50),
        "ph": (5.5, 7.0),
        "temperature": (20, 32),
        "humidity": (40, 75),
        "rainfall": (50, 150)
    }
}

FIELDS = [
    "N", "P", "K", "ph",
    "temperature", "humidity", "rainfall"
]


def calculate_score(soil, requirements):
    """Calculate a rule-match score between 0 and 100."""

    scores = []

    for field in FIELDS:
        low, high = requirements[field]
        value = soil[field]

        if low <= value <= high:
            score = 100
        elif value < low:
            score = max(0, 100 * (1 - (low - value) / (high - low)))
        else:
            score = max(0, 100 * (1 - (value - high) / (high - low)))

        scores.append(score)

    return round(sum(scores) / len(scores), 1)


def recommend_crops(soil):
    """Rank configured crops by their rule-match scores."""

    results = []

    for crop, requirements in CROPS.items():
        results.append({
            "crop": crop,
            "score": calculate_score(soil, requirements)
        })

    return sorted(
        results,
        key=lambda item: item["score"],
        reverse=True
    )


def get_guidance(soil):
    """Return screening notes, not fertilizer prescriptions."""

    messages = []

    for field, name in [
        ("N", "Nitrogen"),
        ("P", "Phosphorus"),
        ("K", "Potassium")
    ]:
        if soil[field] < 30:
            messages.append(
                f"{name} is below this demo's screening threshold. "
                "Confirm nutrient status with a laboratory soil test."
            )

    if soil["ph"] < 5.5:
        messages.append(
            "The entered pH is acidic. Check crop tolerance and "
            "local soil-management advice."
        )
    elif soil["ph"] > 7.5:
        messages.append(
            "The entered pH is alkaline. Check crop tolerance and "
            "possible nutrient availability issues."
        )

    if not messages:
        messages.append(
            "No demo screening flags were triggered. This does not "
            "confirm that the soil has sufficient nutrients."
        )

    messages.append(
        "Determine fertilizer type, dose and timing from a soil test "
        "and locally approved crop recommendations."
    )

    return messages
