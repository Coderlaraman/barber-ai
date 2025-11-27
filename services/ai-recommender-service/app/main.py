from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-recommender"}

@app.post("/recommend")
def recommend():
    return {"status": "stub", "recommendations": []}