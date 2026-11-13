from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./nirmay.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    bcrypt_rounds: int = 12
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    allow_open_staff_registration: bool = False
    upload_dir: str = "./uploads_tmp"
    max_upload_bytes: int = 5 * 1024 * 1024
    vision_timeout_seconds: float = 8.0
    jitsi_base_url: str = "https://meet.jit.si"
    demo_password: str = "demo-password"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
