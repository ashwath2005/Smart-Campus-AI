import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("API Key configured:", bool(api_key))

try:
    # 1. Test basic generation
    model = genai.GenerativeModel("gemini-2.5-flash")
    resp = model.generate_content("Hello! What is your name?")
    print("Response:", resp.text)
    
    # 2. Test system instruction and chat history
    system_inst = "You are a friendly smart campus assistant named CampusBot."
    chat_model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_inst)
    
    chat = chat_model.start_chat(history=[
        {"role": "user", "parts": ["Hi, I am Alex, a CSE student."]},
        {"role": "model", "parts": ["Hi Alex! Nice to meet you. I am CampusBot, your smart campus assistant. How can I help you today?"]}
    ])
    resp2 = chat.send_message("What is my name?")
    print("Chat Response (should remember name Alex):", resp2.text)

    # 3. Test structured output
    import typing
    from pydantic import BaseModel

    class StudyPlan(BaseModel):
        subject: str
        days: int
        topics: list[str]

    struct_model = genai.GenerativeModel(
        "gemini-2.5-flash",
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": StudyPlan
        }
    )
    resp3 = struct_model.generate_content("Generate a study plan for Math for 2 days covering Algebra and Calculus.")
    print("Structured Output Response:", resp3.text)

except Exception as e:
    print("Error during test:", e)
