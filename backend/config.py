"""
Configuration management with comprehensive validation
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator, ValidationError
from typing import Optional
import sys
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # === REQUIRED SETTINGS ===
    FIREBASE_PROJECT_ID: str
    JWT_SECRET: str
    
    # === OPTIONAL WITH DEFAULTS ===
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    
    # JWT Configuration (Phase 1)
    JWT_EXPIRATION: int = 168  # 7 days in hours (legacy, for backward compatibility)
    ACCESS_TOKEN_EXPIRY_MINUTES: int = 15  # Short-lived access tokens
    REFRESH_TOKEN_EXPIRY_DAYS: int = 7  # Long-lived refresh tokens
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Base URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    API_BASE_URL: str = "http://localhost:8000/api"
    
    # Ring ID Configuration
    RING_ID_MIN: int = 1
    RING_ID_MAX: int = 999
    
    # Environment
    ENV: str = "development"
    
    # Logging & Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Phase 2: Identity & Subscriptions
    SUBSCRIPTION_TRIAL_DAYS: int = 14
    SUBSCRIPTION_GRACE_PERIOD_DAYS: int = 3
    MAX_ORG_MEMBERS_DEFAULT: int = 10
    
    # Phase 2: Subscription Pricing (EUR/year)
    SUBSCRIPTION_PRICE_SOLO_STANDARD: float = 24.0  # Business Solo Standard: €24/year
    SUBSCRIPTION_PRICE_SOLO_ENTERPRISE: float = 36.0  # Business Solo Enterprise: €36/year
    SUBSCRIPTION_PRICE_ORG: float = 68.0  # Organization: €68/year
    
    # Phase 2: Payment (Stripe)
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # AI Service Configuration (Optional)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # SECURITY: Privacy & GDPR Compliance
    DATA_RETENTION_DAYS: int = 90  # GDPR-compliant retention period
    NFC_SECRET_KEY: Optional[str] = None  # Secret key for NFC token signing
    
    # SECURITY: Audit Logging
    AUDIT_LOG_RETENTION_DAYS: int = 180  # Audit log retention period
    AUDIT_LOG_IMMUTABLE: bool = True  # Audit logs should be append-only
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars like REACT_APP_*
    
    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Validate JWT secret is sufficiently strong"""
        if len(v) < 32:
            raise ValueError('JWT_SECRET must be at least 32 characters for security')
        return v
    
    @field_validator('ACCESS_TOKEN_EXPIRY_MINUTES')
    @classmethod
    def validate_access_token_expiry(cls, v: int) -> int:
        """Validate access token expiry is reasonable"""
        if v < 5:
            raise ValueError('ACCESS_TOKEN_EXPIRY_MINUTES must be at least 5 minutes')
        if v > 60:
            raise ValueError('ACCESS_TOKEN_EXPIRY_MINUTES should not exceed 60 minutes for security')
        return v
    
    @field_validator('REFRESH_TOKEN_EXPIRY_DAYS')
    @classmethod
    def validate_refresh_token_expiry(cls, v: int) -> int:
        """Validate refresh token expiry is reasonable"""
        if v < 1:
            raise ValueError('REFRESH_TOKEN_EXPIRY_DAYS must be at least 1 day')
        if v > 30:
            raise ValueError('REFRESH_TOKEN_EXPIRY_DAYS should not exceed 30 days for security')
        return v
    
    @field_validator('LOG_LEVEL')
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is valid"""
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'LOG_LEVEL must be one of: {", ".join(valid_levels)}')
        return v.upper()
    
    @field_validator('ENV')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment is valid"""
        valid_envs = ['development', 'staging', 'production', 'test']
        if v.lower() not in valid_envs:
            raise ValueError(f'ENV must be one of: {", ".join(valid_envs)}')
        return v.lower()
        
    def validate_config(self):
        """Perform additional runtime validation"""
        errors = []
        warnings = []
        
        # Check Firebase service account file exists
        if not os.path.exists(self.FIREBASE_SERVICE_ACCOUNT_PATH):
            errors.append(f"Firebase service account file not found: {self.FIREBASE_SERVICE_ACCOUNT_PATH}")
        
        # Production-specific checks
        if self.ENV == 'production':
            if not self.SENTRY_DSN:
                warnings.append("SENTRY_DSN not set - error tracking disabled in production")
            
            if self.LOG_LEVEL == 'DEBUG':
                warnings.append("LOG_LEVEL is DEBUG in production - this may expose sensitive data")
            
            if 'localhost' in self.CORS_ORIGINS:
                warnings.append("CORS_ORIGINS includes localhost in production")
        
        # Phase 2: Stripe validation (if subscription features enabled)
        if self.ENV != 'development':
            if self.STRIPE_SECRET_KEY and not self.STRIPE_WEBHOOK_SECRET:
                warnings.append("STRIPE_SECRET_KEY set but STRIPE_WEBHOOK_SECRET missing")
        
        # Print validation results
        if errors:
            print("\n❌ Configuration validation FAILED:")
            for error in errors:
                print(f"   ERROR: {error}")
            sys.exit(1)
        
        if warnings:
            print("\n⚠️  Configuration warnings:")
            for warning in warnings:
                print(f"   WARNING: {warning}")
        
        print("\n✅ Configuration validated successfully")
        print(f"┌{'─' * 60}┐")
        print(f"│ {'Environment Configuration':<58} │")
        print(f"├{'─' * 60}┤")
        print(f"│ Environment:         {self.ENV:<39} │")
        print(f"│ Project ID:          {self.FIREBASE_PROJECT_ID:<39} │")
        print(f"│ Log Level:           {self.LOG_LEVEL:<39} │")
        print(f"├{'─' * 60}┤")
        print(f"│ {'JWT Configuration':<58} │")
        print(f"├{'─' * 60}┤")
        print(f"│ Access Token Expiry: {self.ACCESS_TOKEN_EXPIRY_MINUTES} minutes{' ' * 31} │")
        print(f"│ Refresh Token Expiry:{self.REFRESH_TOKEN_EXPIRY_DAYS} days{' ' * 34} │")
        print(f"├{'─' * 60}┤")
        print(f"│ {'Monitoring':<58} │")
        print(f"├{'─' * 60}┤")
        print(f"│ Sentry:              {'Enabled' if self.SENTRY_DSN else 'Disabled':<39} │")
        print(f"│ Rate Limiting:       {'Enabled' if self.RATE_LIMIT_ENABLED else 'Disabled':<39} │")
        print(f"├{'─' * 60}┤")
        print(f"│ {'Phase 2 Features':<58} │")
        print(f"├{'─' * 60}┤")
        print(f"│ Trial Period:        {self.SUBSCRIPTION_TRIAL_DAYS} days{' ' * 32} │")
        print(f"│ Grace Period:        {self.SUBSCRIPTION_GRACE_PERIOD_DAYS} days{' ' * 33} │")
        print(f"│ Stripe:              {'Configured' if self.STRIPE_SECRET_KEY else 'Not Configured':<39} │")
        print(f"└{'─' * 60}┘\n")


# Global settings instance
settings = Settings()
settings.validate_config()


