import os
from openai import OpenAI
from pydantic import BaseModel
import json

# Instancia o cliente da OpenAI. Espera-se que OPENAI_API_KEY esteja configurada no .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "sk-placeholder-key"))

def process_receipt_image(image_url: str) -> dict:
    """
    Envia a URL da imagem da nota fiscal para o modelo de Visão da OpenAI
    e retorna um JSON estruturado com os dados extraídos.
    """
    prompt = """
    Você é um assistente de extração de dados. Leia a imagem da nota fiscal enviada e extraia as seguintes informações em formato JSON estrito:
    - market_name: Nome do mercado
    - date: Data da compra (YYYY-MM-DD)
    - total_amount: Valor total pago
    - payment_method: Forma de pagamento (cartão, dinheiro, pix)
    - items: Uma lista de objetos, cada um com:
        - name: Nome do produto
        - quantity: Quantidade comprada (número)
        - unit_price: Preço unitário
        - total_price: Preço total do item
        - category: Categoria sugerida (ex: Limpeza, Laticínios, Carnes, Bebidas, etc)
        
    Retorne APENAS o JSON, sem markdown ou explicações.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }
        ],
        max_tokens=1500
    )
    
    raw_json = response.choices[0].message.content
    try:
        return json.loads(raw_json)
    except Exception as e:
        return {"error": "Falha ao processar JSON da nota fiscal", "raw": raw_json}

def chat_with_house_context(user_message: str, home_context: str) -> str:
    """
    Responde à pergunta do usuário usando os dados injetados da casa (tarefas, finanças, compras).
    """
    system_prompt = f"""
    Você é o assistente inteligente do CasaOS.
    Abaixo estão as informações atuais da casa do usuário:
    {home_context}
    
    Responda às perguntas do usuário de forma amigável, concisa e direta, usando APENAS as informações do contexto acima. Se não souber, diga que não tem essa informação registrada.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.3
    )
    
    return response.choices[0].message.content
