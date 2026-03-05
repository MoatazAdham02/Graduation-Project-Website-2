import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production")
    cors_origin: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploads/dicom")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
