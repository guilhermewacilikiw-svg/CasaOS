from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.openai_service import process_receipt_image, chat_with_house_context
from app.services.supabase_client import supabase

router = APIRouter()

class ReceiptRequest(BaseModel):
    image_url: str
    home_id: str

class ChatRequest(BaseModel):
    message: str
    home_id: str

@router.post("/ocr/receipt")
def process_receipt(request: ReceiptRequest):
    """Lê a nota fiscal e registra no banco de dados automaticamente."""
    # 1. Extrai dados via OCR/IA
    extracted_data = process_receipt_image(request.image_url)
    
    if "error" in extracted_data:
        raise HTTPException(status_code=400, detail=extracted_data["error"])
        
    # 2. Salvar no banco de dados (Tabela purchases e purchase_items)
    # OBS: Em produção, devemos pegar o payer_id do usuário logado via Depends()
    purchase_data = {
        "home_id": request.home_id,
        "date": extracted_data.get("date"),
        "total_amount": extracted_data.get("total_amount"),
        "payment_method": extracted_data.get("payment_method"),
    }
    
    purchase_response = supabase.table("purchases").insert(purchase_data).execute()
    purchase_id = purchase_response.data[0]['id']
    
    items = extracted_data.get("items", [])
    for item in items:
        supabase.table("purchase_items").insert({
            "purchase_id": purchase_id,
            "name": item.get("name"),
            "quantity": item.get("quantity"),
            "unit_price": item.get("unit_price"),
            "total_price": item.get("total_price"),
            "category": item.get("category")
        }).execute()
        
        # Opcional: Atualizar a tabela inventory automaticamente aqui
        
    return {"status": "success", "purchase_id": purchase_id, "data": extracted_data}


@router.post("/chat")
def chat_with_ai(request: ChatRequest):
    """Conversa com a IA tendo o contexto da casa."""
    
    # 1. Construir contexto básico da casa consultando o Supabase
    # Aqui buscamos tarefas pendentes e itens na lista de compras como exemplo
    tasks_res = supabase.table("tasks").select("title, status, assignee_id").eq("home_id", request.home_id).eq("status", "pending").execute()
    shopping_res = supabase.table("shopping_items").select("name, quantity").eq("is_purchased", False).execute() # faltaria filtrar pelo home_id da lista
    
    context = f"Tarefas pendentes: {tasks_res.data}\n"
    context += f"Itens na lista de compras que faltam: {shopping_res.data}\n"
    
    # 2. Enviar para a OpenAI
    ai_reply = chat_with_house_context(request.message, context)
    
    return {"reply": ai_reply}
