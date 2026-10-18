
import math

from flask import Flask, render_template, request, jsonify
from crop_rules import recommend_crops, get_guidance

app = Flask(__name__)

FIELDS = [
    "N", "P", "K", "ph",
    "temperature", "humidity", "rainfall"
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data."}), 400

    try:
        soil = {
            field: float(data[field])
            for field in FIELDS
        }
    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "Enter all seven values as numbers."
        }), 400

    if not all(math.isfinite(value) for value in soil.values()):
        return jsonify({
            "error": "Values must be finite numbers."
        }), 400

    if any(soil[field] < 0 for field in ["N", "P", "K", "rainfall"]):
        return jsonify({
            "error": "N, P, K and rainfall cannot be negative."
        }), 400

    if not 0 <= soil["ph"] <= 14:
        return jsonify({
            "error": "pH must be between 0 and 14."
        }), 400

    if not 0 <= soil["humidity"] <= 100:
        return jsonify({
            "error": "Humidity must be between 0 and 100."
        }), 400

    if not -10 <= soil["temperature"] <= 65:
        return jsonify({
            "error": "Check the temperature value."
        }), 400

    crops = recommend_crops(soil)

    return jsonify({
        "crops": crops[:5],
        "guidance": get_guidance(soil),
        "nutrients": {
            "Nitrogen": soil["N"],
            "Phosphorus": soil["P"],
            "Potassium": soil["K"]
        }
    })


if __name__ == "__main__":
    app.run(debug=True)
