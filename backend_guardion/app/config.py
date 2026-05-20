"""
Application Configuration
Loads settings from environment variables
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "GuardIOn API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"
    
    # Database
    DATABASE_URL: str
    DATABASE_URL_TEST: str = ""
    
    # JWT Authentication
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # MQTT
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_TLS_ENABLED: bool = False
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # CORS - stored as comma-separated string
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:19006,http://localhost:8081"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    
    # Geofencing
    DEFAULT_GEOFENCE_RADIUS: float = 200.0
    GEOFENCE_BREACH_COOLDOWN_MINUTES: int = 5
    
    # Device Simulator
    SIMULATOR_ENABLED: bool = True
    SIMULATOR_DEVICE_COUNT: int = 3
    SIMULATOR_UPDATE_INTERVAL: int = 30
    
    # Alert Settings
    ALERT_RETRY_ATTEMPTS: int = 3
    ALERT_ESCALATION_MINUTES: int = 5

    # Email / OTP (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "GuardIon <onboarding@resend.dev>"
    OTP_LENGTH: int = 5
    OTP_EXPIRE_MINUTES: int = 10

    # Google OAuth (ID token verification)
    GOOGLE_WEB_CLIENT_ID: str = ""
    GOOGLE_ANDROID_CLIENT_ID: str = ""
    GOOGLE_IOS_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    @property
    def google_client_ids(self) -> List[str]:
        return [
            client_id.strip()
            for client_id in (
                self.GOOGLE_WEB_CLIENT_ID,
                self.GOOGLE_ANDROID_CLIENT_ID,
                self.GOOGLE_IOS_CLIENT_ID,
            )
            if client_id and client_id.strip()
        ]
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
