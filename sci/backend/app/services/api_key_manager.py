import os
import time
import logging
import asyncio
from typing import List, Optional
import threading
from fastapi import HTTPException
from app.config import AI_API_KEY_1, AI_API_KEY_2, AI_API_KEY_3, GEMINI_API_KEY

logger = logging.getLogger("api_key_manager")

class APIKey:
    def __init__(self, key_value: str, name: str):
        self.key_value = key_value
        self.name = name
        self.failures = 0
        self.is_healthy = True
        self.disabled_until = 0.0

    def mask(self) -> str:
        if not self.key_value:
            return "None"
        val = self.key_value
        if len(val) <= 12:
            return "***"
        return f"{val[:6]}...{val[-6:]}"

class APIKeyManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(APIKeyManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.lock = threading.Lock()
        self.keys: List[APIKey] = []
        self._load_keys()
        self.current_index = 0
        self._initialized = True

    def _load_keys(self):
        # Prefer AI_API_KEY_* first, fallback to GEMINI_API_KEY
        key1 = AI_API_KEY_1 or GEMINI_API_KEY
        key2 = AI_API_KEY_2
        key3 = AI_API_KEY_3

        if key1:
            self.keys.append(APIKey(key1, "Key1"))
        if key2:
            self.keys.append(APIKey(key2, "Key2"))
        if key3:
            self.keys.append(APIKey(key3, "Key3"))

        logger.info(f"APIKeyManager: Loaded {len(self.keys)} API keys.")

    def getActiveKey(self) -> Optional[APIKey]:
        with self.lock:
            now = time.time()
            # Try to find the first healthy key (or whose disabled time has passed)
            for key in self.keys:
                if key.is_healthy or (key.disabled_until and now >= key.disabled_until):
                    if not key.is_healthy:
                        logger.info(f"APIKeyManager: Cooldown expired for {key.name} ({key.mask()}). Resetting it to healthy.")
                        key.is_healthy = True
                        key.failures = 0
                        key.disabled_until = 0.0
                    return key
            
            # If all keys failed, try the first key as a fallback
            if self.keys:
                logger.warning("APIKeyManager: All keys failed! Falling back to the first key.")
                return self.keys[0]
            return None

    def rotateKey(self) -> Optional[APIKey]:
        with self.lock:
            if not self.keys:
                return None
            
            start_index = self.current_index
            while True:
                self.current_index = (self.current_index + 1) % len(self.keys)
                candidate = self.keys[self.current_index]
                now = time.time()
                if candidate.is_healthy or (candidate.disabled_until and now >= candidate.disabled_until):
                    if not candidate.is_healthy:
                        candidate.is_healthy = True
                        candidate.failures = 0
                        candidate.disabled_until = 0.0
                    logger.info(f"APIKeyManager: Rotated active key to {candidate.name} ({candidate.mask()}).")
                    return candidate
                
                if self.current_index == start_index:
                    # Cycled back, return current active
                    return self.keys[self.current_index]

    def markKeyFailed(self, key_value: str, reason: str = ""):
        with self.lock:
            now = time.time()
            for key in self.keys:
                if key.key_value == key_value:
                    key.failures += 1
                    logger.warning(
                        f"APIKeyManager: Failure recorded for {key.name} ({key.mask()}). Total failures: {key.failures}. Reason: {reason}"
                    )
                    if key.failures >= 2:
                        key.is_healthy = False
                        key.disabled_until = now + 180.0  # Cooldown for 3 minutes
                        logger.error(
                            f"APIKeyManager: Key {key.name} ({key.mask()}) has failed 2 consecutive times. Disabling it for 3 minutes."
                        )
                    break

    def markKeyHealthy(self, key_value: str):
        with self.lock:
            for key in self.keys:
                if key.key_value == key_value:
                    if key.failures > 0 or not key.is_healthy:
                        logger.info(f"APIKeyManager: Resetting failures for {key.name} ({key.mask()}) as it is healthy.")
                        key.failures = 0
                        key.is_healthy = True
                        key.disabled_until = 0.0
                    break

    def resetFailures(self):
        with self.lock:
            logger.info("APIKeyManager: Resetting failures for all keys.")
            for key in self.keys:
                key.failures = 0
                key.is_healthy = True
                key.disabled_until = 0.0

# Singleton instance
api_key_manager = APIKeyManager()

# Global Lock to ensure thread-safe configuration and execution
api_call_lock = threading.Lock()

async def execute_ai_call_with_retry(
    model_name: str = "gemini-2.5-flash",
    system_instruction: Optional[str] = None,
    prompt: Optional[str] = None,
    schema: Optional[type] = None,
    mime_type: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    is_chat: bool = False,
    chat_history: Optional[List[dict]] = None,
    chat_question: Optional[str] = None,
):
    import google.generativeai as genai
    import asyncio
    
    max_retries_per_key = 2
    tried_keys = set()
    
    while True:
        active_key_obj = api_key_manager.getActiveKey()
        if not active_key_obj:
            raise HTTPException(
                status_code=500,
                detail="No Gemini API keys are configured in the environment."
            )
            
        key_val = active_key_obj.key_value
        key_name = active_key_obj.name
        key_mask = active_key_obj.mask()
        
        if len(tried_keys) >= len(api_key_manager.keys):
            raise HTTPException(
                status_code=502,
                detail="All configured Gemini API keys failed or exceeded quotas. Please try again later."
            )
            
        tried_keys.add(key_val)
        
        for attempt in range(1, max_retries_per_key + 1):
            start_time = time.time()
            logger.info(
                f"APIKeyManager: Executing request using {key_name} ({key_mask}). Attempt {attempt}/{max_retries_per_key}."
            )
            
            try:
                # Synchronous task execution wrapper block
                def _run():
                    with api_call_lock:
                        genai.configure(api_key=key_val)
                        model = genai.GenerativeModel(
                            model_name=model_name,
                            system_instruction=system_instruction
                        )
                        
                        if is_chat:
                            history_gemini = []
                            if chat_history:
                                for msg in chat_history:
                                    gemini_role = "user" if msg["role"] == "user" else "model"
                                    history_gemini.append({
                                        "role": gemini_role,
                                        "parts": [msg["message"]]
                                    })
                            chat = model.start_chat(history=history_gemini)
                            response = chat.send_message(chat_question)
                            return response.text
                        elif mime_type and file_bytes:
                            if schema:
                                response = model.generate_content(
                                    [
                                        {"mime_type": mime_type, "data": file_bytes},
                                        prompt
                                    ],
                                    generation_config={
                                        "response_mime_type": "application/json",
                                        "response_schema": schema
                                    }
                                )
                            else:
                                response = model.generate_content(
                                    [
                                        {"mime_type": mime_type, "data": file_bytes},
                                        prompt
                                    ]
                                )
                            return response.text
                        else:
                            if schema:
                                response = model.generate_content(
                                    prompt,
                                    generation_config={
                                        "response_mime_type": "application/json",
                                        "response_schema": schema
                                    }
                                )
                            else:
                                response = model.generate_content(prompt)
                            return response.text

                # Run synchronous call in worker thread with timeout
                result = await asyncio.wait_for(asyncio.to_thread(_run), timeout=4.0)
                
                duration = time.time() - start_time
                logger.info(
                    f"APIKeyManager: Success using {key_name} ({key_mask}). Response time: {duration:.2f}s."
                )
                api_key_manager.markKeyHealthy(key_val)
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                error_msg = str(e)
                logger.warning(
                    f"APIKeyManager: Failure using {key_name} ({key_mask}). Response time: {duration:.2f}s. Error: {error_msg}"
                )
                
                api_key_manager.markKeyFailed(key_val, reason=error_msg[:100])
                
                if attempt == max_retries_per_key:
                    logger.warning(
                        f"APIKeyManager: Key {key_name} failed {max_retries_per_key} times. Rotating to next key..."
                    )
                    api_key_manager.rotateKey()
                    break
