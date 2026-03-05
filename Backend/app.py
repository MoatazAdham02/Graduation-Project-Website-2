import os
import io
import gdown
import torch
import pydicom
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from model_arch import MyMedicalModel  # Ben-nadé el-hekal men el-file el-tany

app = Flask(__name__)
CORS(app) # 3ashan sa7bak el-frontend ye2dar y-kalem el-backend

# --- 1. Download & Load el-Model ---
MODEL_PATH = "backend/models/my_model.pth"
FILE_ID = "1GK0j_CFbwFnO-bRuuTGa9_nLZvQmchte"
URL = f'https://drive.google.com/uc?id={FILE_ID}'

if not os.path.exists(MODEL_PATH):
    print("Downloading model from Google Drive... Please wait.")
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    gdown.download(URL, MODEL_PATH, quiet=False)

device = torch.device("cpu")
model = MyMedicalModel()
# Load el-weights gowa el-hekal
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

# --- 2. Function le-tazbit el-sora (Pre-processing) ---
def preprocess_dicom(pixel_array):
    # Hena lazem t-resize el-sora 7asab el-model m-met3awed
    # Da mital saree3:
    img = torch.tensor(pixel_array).float().unsqueeze(0).unsqueeze(0)
    return img

# --- 3. Route el-Upload wel Prediction ---
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    try:
        # A. Read DICOM
        ds = pydicom.dcmread(io.BytesIO(file.read()))
        pixel_data = ds.pixel_array
        
        # B. Pre-process
        input_tensor = preprocess_dicom(pixel_data)
        
        # C. Predict
        with torch.no_grad():
            output = model(input_tensor)
            prediction = torch.argmax(output).item()
        
        # D. Results (T7wel el-arqam le-kalam)
        labels = {0: "Normal", 1: "Abnormal/Problem Detected"}
        result_text = labels.get(prediction, "Unknown")

        return jsonify({
            "status": "success",
            "prediction": prediction,
            "label": result_text,
            "report": f"The AI model analysis indicates: {result_text}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Render hay-estakhdem el-port da automatic
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
