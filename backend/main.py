from fastapi import FastAPI, Depends, HTTPException, Header
from app.services.supabase_client import supabase
from app.api.endpoints import router as api_router

app = FastAPI(title="CasaOS API", version="1.0.0")

app.include_router(api_router, prefix="/api")

def verify_token(authorization: str = Header(None)):
    """Dependency para verificar o JWT Token do App Mobile via Supabase Auth"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.replace("Bearer ", "")
    user_response = supabase.auth.get_user(token)
    
    if not user_response or not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    return user_response.user

@app.get("/")
def read_root():
    return {"message": "CasaOS Backend is running!"}

@app.get("/api/health")
def health_check(current_user = Depends(verify_token)):
    return {
        "status": "healthy",
        "user_id": current_user.id
    }
