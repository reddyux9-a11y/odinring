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
    
    # SECURITY: File-based Firebase credentials eliminated - use FIREBASE_SERVICE_ACCOUNT_JSON only
    
    # JWT Configuration (Phase 1)
    JWT_EXPIRATION: int = 168  # 7 days in hours (legacy, for backward compatibility)
    ACCESS_TOKEN_EXPIRY_MINUTES: int = 30  # Balanced UX/security for access tokens
    REFRESH_TOKEN_EXPIRY_DAYS: int = 30  # Longer-lived refresh token for persistent login
    
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

    # Shared cache (Redis)
    REDIS_URL: Optional[str] = None
    
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
        if v > 120:
            raise ValueError('ACCESS_TOKEN_EXPIRY_MINUTES should not exceed 120 minutes for security')
        return v
    
    @field_validator('REFRESH_TOKEN_EXPIRY_DAYS')
    @classmethod
    def validate_refresh_token_expiry(cls, v: int) -> int:
        """Validate refresh token expiry is reasonable"""
        if v < 1:
            raise ValueError('REFRESH_TOKEN_EXPIRY_DAYS must be at least 1 day')
        if v > 90:
            raise ValueError('REFRESH_TOKEN_EXPIRY_DAYS should not exceed 90 days for security')
        return v
    
    @field_validator('LOG_LEVEL')
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is valid"""
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in valid_levels:
            raise ValueError(f'LOG_LEVEL must be one of: {", ".join(valid_levels)}')
        return v.upper()
    
    def validate_log_level_for_production(self):
        """Enforce LOG_LEVEL >= INFO in production"""
        if self.ENV.lower() in ('production', 'prod'):
            log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
            current_level = self.LOG_LEVEL.upper()
            min_level_index = log_levels.index('INFO')
            current_level_index = log_levels.index(current_level)
            
            if current_level_index < min_level_index:
                raise ValueError(
                    f"LOG_LEVEL must be INFO or higher in production. "
                    f"Current: {current_level}. This prevents sensitive data exposure."
                )
    
    @field_validator('FIREBASE_PROJECT_ID')
    @classmethod
    def validate_firebase_project_id(cls, v: str) -> str:
        """Validate Firebase project ID is provided"""
        if not v or not v.strip():
            raise ValueError('FIREBASE_PROJECT_ID is required and cannot be empty')
        return v.strip()
    
    def validate_required_for_production(self):
        """Validate that all required settings are present for production"""
        if self.ENV.lower() in ('production', 'prod'):
            # SECURITY: File-based credentials eliminated - require JSON environment variable
            service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            
            if not service_account_json:
                raise ValueError(
                    "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required in production. "
                    "File-based authentication has been eliminated for security."
                )
            
            # Validate CORS is set in production
            if not os.getenv('CORS_ORIGINS'):
                raise ValueError("CORS_ORIGINS environment variable is required in production")
    
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
        
        # Production-specific validation
        try:
            if self.ENV.lower() in ('production', 'prod'):
                self.validate_required_for_production()
                self.validate_log_level_for_production()
        except ValueError as e:
            errors.append(str(e))
        
        # SECURITY: File-based credential checks eliminated
        # All environments now require FIREBASE_SERVICE_ACCOUNT_JSON environment variable
        # This is validated in firebase_config.py during initialization
        
        # Production-specific checks
        if self.ENV == 'production':
            if not self.SENTRY_DSN:
                warnings.append("SENTRY_DSN not set - error tracking disabled in production")
            
            # LOG_LEVEL validation is now enforced (will raise error, not warning)
            # This check is redundant but kept for clarity
            if self.LOG_LEVEL == 'DEBUG':
                # This should never happen due to validate_log_level_for_production
                errors.append("LOG_LEVEL is DEBUG in production - this is a security risk")
            
            if 'localhost' in self.CORS_ORIGINS:
                warnings.append("CORS_ORIGINS includes localhost in production")
        
        # Phase 2: Stripe validation (if subscription features enabled)
        if self.ENV != 'development':
            if self.STRIPE_SECRET_KEY and not self.STRIPE_WEBHOOK_SECRET:
                warnings.append("STRIPE_SECRET_KEY set but STRIPE_WEBHOOK_SECRET missing")
        
        # Validation results
        if errors:
            error_msg = "\n❌ Configuration validation FAILED:\n"
            for error in errors:
                error_msg += f"   ERROR: {error}\n"
            raise ValueError(error_msg)
        
        # Log warnings if any
        if warnings:
            import logging
            logger = logging.getLogger(__name__)
            for warning in warnings:
                logger.warning(f"Configuration warning: {warning}")
        
        # Log successful validation (only in development or if LOG_LEVEL is DEBUG)
        import logging
        logger = logging.getLogger(__name__)
        if self.ENV.lower() in ('development', 'dev') or self.LOG_LEVEL == 'DEBUG':
            logger.info("✅ Configuration validated successfully")
            logger.debug(f"Environment: {self.ENV}")
            logger.debug(f"Project ID: {self.FIREBASE_PROJECT_ID}")
            logger.debug(f"Log Level: {self.LOG_LEVEL}")
            logger.debug(f"Access Token Expiry: {self.ACCESS_TOKEN_EXPIRY_MINUTES} minutes")
            logger.debug(f"Refresh Token Expiry: {self.REFRESH_TOKEN_EXPIRY_DAYS} days")
            logger.debug(f"Sentry: {'Enabled' if self.SENTRY_DSN else 'Disabled'}")
            logger.debug(f"Rate Limiting: {'Enabled' if self.RATE_LIMIT_ENABLED else 'Disabled'}")


# Global settings instance
settings = Settings()

# SECURITY: Validate config, but don't fail hard during import
# This allows the app to start even if validation fails, so health endpoint can report issues
try:
    settings.validate_config()
except ValueError as e:
    # Log the error but don't raise - allows app to start
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Configuration validation failed: {e}")
    # Store error for health endpoint to report
    settings._validation_error = str(e)


