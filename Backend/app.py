from flask import Flask, request, jsonify
from flask_cors import CORS  # Mohem gedan 3ashan sa7bak el Frontend yعرف y-access
import torch
import pydicom
import io
from model_arch import MyMedicalModel # Ben-nadé el hekal

app = Flask(__name__)
CORS(app) # Btesma7 lel Frontend ykalem el Backend

# --- 1. Load el Model ---
device = torch.device("cpu")
model = MyMedicalModel()
model.load_state_dict(torch.load("models/my_model.pth", map_location=device))
model.eval()

# --- 2. Function el Pre-processing ---
def transform_dicom(pixel_array):
    # Hena lazem t-resize el sora w t7awelha le Tensor
    # Masalan:
    img = torch.tensor(pixel_array).float().unsqueeze(0).unsqueeze(0)
    return img

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['file']
    
    # A. Read DICOM
    ds = pydicom.dcmread(io.BytesIO(file.read()))
    img_data = ds.pixel_array
    
    # B. Process Image
    input_tensor = transform_dicom(img_data)
    
    # C. Model Prediction
    with torch.no_grad():
        output = model(input_tensor)
        prediction = torch.argmax(output).item()
    
    # D. Return Report
    # Momken te3mel Dictionary lel nata'eg
    results_map = {0: "Normal", 1: "Problem Detected"}
    return jsonify({
        "status": "success",
        "label": results_map.get(prediction, "Unknown"),
        "details": "The model analyzed the DICOM patterns..."
    })

if __name__ == '__main__':
    app.run(port=5000)
