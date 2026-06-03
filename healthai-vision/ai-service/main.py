from fastapi import FastAPI, File, UploadFile, HTTPException
from transformers import pipeline
from PIL import Image
import io

app = FastAPI()
pipe = None


@app.on_event("startup")
async def load_model():
    global pipe
    print("Chargement du modèle nateraw/food…")
    pipe = pipeline("image-classification", model="nateraw/food", top_k=5)
    print("Modèle prêt.")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    results = pipe(image)
    return {
        "predictions": [
            {"label": r["label"], "score": round(r["score"], 4)}
            for r in results
        ]
    }
