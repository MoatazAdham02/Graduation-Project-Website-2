import os, io, gdown, torch, pydicom
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from model_arch import MyMedicalModel

app = Flask(__name__)
CORS(app)

# --- Load Model ---
MODEL_PATH = "backend/models/my_model.pth"
FILE_ID = "1GK0j_CFbwFnO-bRuuTGa9_nLZvQmchte"
URL = f'https://drive.google.com/uc?id={FILE_ID}'

if not os.path.exists(MODEL_PATH):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    gdown.download(URL, MODEL_PATH, quiet=False)

device = torch.device("cpu")
model = MyMedicalModel()
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:
        # 1. قراءة الـ DICOM (Multi-frame)
        ds = pydicom.dcmread(io.BytesIO(file.read()))
        
        # 2. استخراج الـ Slices كـ 3D Array
        # pixel_array هنا هيكون أبعاده (Number of Slices, Height, Width)
        volume = ds.pixel_array.astype(np.float32)

        # 3. Normalization
        volume = (volume - volume.min()) / (volume.max() - volume.min() + 1e-8)
        
        # 4. تظبيط الأبعاد للموديل الـ 3D (MON
