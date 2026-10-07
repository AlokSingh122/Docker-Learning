from flask import Flask, jsonify  # type: ignore[import-not-found]
import os

try:
    from flask_cors import CORS  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover
    def CORS(*args, **kwargs):
        return None

app = Flask(__name__)

CORS(app)

DATA_DIR = "/app/data"

os.makedirs(DATA_DIR, exist_ok=True)


@app.route("/")
def home():
    return jsonify({
        "message": "Hello from Flask Backend!"
    })


@app.route("/save")
def save_data():

    file_path = os.path.join(DATA_DIR, "data.txt")

    with open(file_path, "a") as file:
        file.write("Data saved from Flask backend\n")

    return jsonify({
        "message": "Data saved successfully!"
    })


@app.route("/data")
def read_data():

    file_path = os.path.join(DATA_DIR, "data.txt")

    if not os.path.exists(file_path):
        return jsonify({
            "message": "No data found"
        })

    with open(file_path, "r") as file:
        content = file.read()

    return jsonify({
        "data": content
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)