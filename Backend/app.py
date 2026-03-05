import os
import io
import gdown
import torch
import pydicom
from flask import Flask, request, jsonify
from flask_cors import CORS
from model_arch import MyMedicalModel 

app = Flask(__name__)
# مهم جداً: السماح للـ Frontend (React) بالوصول للـ Backend
CORS(app) 

# --- تحميل الموديل من Google Drive ---
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
    # 1. التأكد إن الـ Frontend بعت ملف فعلاً
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    try:
        # 2. قراءة ملف الـ DICOM
        ds = pydicom.dcmread(io.BytesIO(file.read()))
        pixel_data = ds.pixel_array
        
        # 3. تحويل الداتا لشكل الموديل يفهمه (Pre-processing)
        # ملاحظة: لازم تتأكد من حجم الصورة (Resize) هنا لو الموديل بيطلب حجم معين
        input_tensor = torch.tensor(pixel_data).float().unsqueeze(0).unsqueeze(0)
        
        # 4. التوقع (Prediction)
        with torch.no_grad():
            output = model(input_tensor)
            prediction = torch.argmax(output).item()
        
        # 5. الرد اللي زميلك هيعرضه في الـ Frontend
        # عدل النصوص دي حسب نوع مشروعك (أورام، عظام، إلخ)
        labels = {0: "Normal Case", 1: "Abnormal Case - Further review required"}
        
        return jsonify({
            "status": "success",
            "prediction": prediction,
            "report": labels.get(prediction, "Unknown Result"),
            "doctor_note": "The AI model detected patterns consistent with the report above."
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
