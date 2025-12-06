# detector.py - Hybrid Version (Gemini + YOLO)
import sys
import json
import os
import cv2
import base64
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv
from ultralytics import YOLO

# Suppress YOLO verbose output
os.environ['YOLO_VERBOSE'] = 'False'
import warnings
warnings.filterwarnings('ignore')

load_dotenv()  # Load environment variables from .env file

# --- CẤU HÌNH API KEY ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

VIS_TEMP_PATH = Path(os.path.abspath(os.path.dirname(__file__))) / "vis_temp.png"

# --- LOAD YOLO MODELS ---
# trained.pt: Phát hiện hư hỏng (Damage)
# best.pt: Phát hiện bộ phận (Parts)
try:
    damage_model = YOLO("model/trained.pt", verbose=False) # Model phát hiện hư hỏng
    part_model = YOLO("model/best.pt", verbose=False)      # Model phát hiện bộ phận
except Exception as e:
    print(json.dumps({"error": f"Error loading YOLO models: {str(e)}"}), file=sys.stdout)
    sys.stdout.flush()
    sys.exit(1)

def run_detection(image_path):
    try:
        # 1. Đọc ảnh
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Không tìm thấy ảnh: {image_path}")

        # --- BƯỚC 1: DÙNG GEMINI ĐỂ NHẬN DIỆN TÊN XE & MODEL ---
        gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        
        with open(image_path, "rb") as f:
            image_data = f.read()
            
        prompt = """
        Analyze this image of a vehicle.
        1. Identify the vehicle brand (Make).
        2. Identify the vehicle model (Name).
        
        Return the result in valid JSON format with this structure:
        {
            "brand": "Brand Name",
            "model": "Model Name"
        }
        Do not use markdown formatting, just return the raw JSON string.
        """

        response = gemini_model.generate_content([
            {'mime_type': 'image/jpeg', 'data': image_data},
            prompt
        ])
        
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
        
        gemini_result = json.loads(text_response.strip())
        brand = gemini_result.get("brand", "Unknown")
        model_name = gemini_result.get("model", "Unknown")

        # --- BƯỚC 2: DÙNG YOLO ĐỂ PHÁT HIỆN HƯ HỎNG VÀ BỘ PHẬN ---
        image = cv2.imread(image_path)
        if image is None:
             raise ValueError("Could not read image with OpenCV")
        
        # Chạy model phát hiện hư hỏng (trained.pt)
        damage_results = damage_model(image, verbose=False)
        
        # Chạy model phát hiện bộ phận (best.pt)
        part_results = part_model(image, verbose=False)
        
        detected_parts = []
        vis_img = image.copy()

        # Xử lý kết quả từ model Hư hỏng (trained.pt)
        # trained.pt trả về các box hư hỏng (ví dụ: dent, scratch...)
        damages = []
        for r in damage_results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = damage_model.names[cls] # Tên loại hư hỏng (dent, scratch...)
                
                damages.append({
                    "type": label,
                    "box": [x1, y1, x2, y2],
                    "conf": conf
                })
                
                # Vẽ box hư hỏng (Màu đỏ)
                cv2.rectangle(vis_img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(vis_img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)

        # Xử lý kết quả từ model Bộ phận (best.pt)
        # best.pt trả về các box bộ phận (ví dụ: bumper, door...)
        # Ta sẽ map hư hỏng vào bộ phận tương ứng dựa trên IoU hoặc vị trí
        
        # Danh sách các bộ phận phát hiện được
        parts_list = []
        for r in part_results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = part_model.names[cls] # Tên bộ phận (bumper, door...)
                
                parts_list.append({
                    "label": label,
                    "box": [x1, y1, x2, y2],
                    "conf": conf
                })
                
                # Vẽ box bộ phận (Màu xanh lá - mỏng hơn để phân biệt)
                # cv2.rectangle(vis_img, (x1, y1), (x2, y2), (0, 255, 0), 1)

        # --- BƯỚC 3: KẾT HỢP HƯ HỎNG VÀ BỘ PHẬN ---
        # Với mỗi hư hỏng, tìm bộ phận chứa nó (hoặc giao nhau nhiều nhất)
        final_parts = []
        
        for dmg in damages:
            dmg_box = dmg["box"]
            dmg_center_x = (dmg_box[0] + dmg_box[2]) / 2
            dmg_center_y = (dmg_box[1] + dmg_box[3]) / 2
            
            best_part = "Unknown Part"
            max_iou = 0
            
            # Tìm bộ phận chứa tâm của hư hỏng
            for part in parts_list:
                px1, py1, px2, py2 = part["box"]
                if px1 <= dmg_center_x <= px2 and py1 <= dmg_center_y <= py2:
                    best_part = part["label"]
                    break # Tìm thấy bộ phận chứa tâm
            
            # Nếu không tìm thấy bộ phận chứa tâm, có thể dùng IoU (nhưng ở đây đơn giản hóa)
            
            final_parts.append({
                "label": best_part, # Tên bộ phận (từ best.pt)
                "damage_type": dmg["type"], # Loại hư hỏng (từ trained.pt)
                "box_2d": [0, 0, 0, 0], # Frontend không cần box chuẩn hóa nữa nếu ta gửi ảnh đã vẽ
                "conf": dmg["conf"]
            })

        # Encode image to base64
        if cv2.imwrite(str(VIS_TEMP_PATH), vis_img):
            with open(VIS_TEMP_PATH, "rb") as img_file:
                b64_string = base64.b64encode(img_file.read()).decode('utf-8')
            os.remove(VIS_TEMP_PATH)
        else:
            b64_string = None

        output_json = {
            "num_detections": len(final_parts),
            "visual_output_base64": b64_string,
            "brand": brand,
            "model": model_name,
            "parts": final_parts,
            "raw_details": {"gemini": gemini_result, "yolo_parts": len(parts_list), "yolo_damages": len(damages)}
        }

        print(json.dumps(output_json))
        sys.stdout.flush()

    except Exception as e:
        import traceback
        err_msg = {
            "error": str(e),
            "details": traceback.format_exc(),
            "visual_output_base64": None
        }
        print(json.dumps(err_msg))
        sys.stdout.flush()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_detection(sys.argv[1])
    else:
        print(json.dumps({"error": "No image path"}))
