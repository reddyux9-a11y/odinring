"""
Logging Configuration
Provides structured logging and Sentry integration
SECURITY: All imports are wrapped to prevent blocking app startup
"""
import logging
import os

# SECURITY: Make structlog import optional to prevent blocking
try:
    import structlog
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False
    # Fallback to standard logging
    logging.basicConfig(level=logging.INFO)

# SECURITY: Make sentry import optional to prevent blocking
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    HAS_SENTRY = True
except ImportError:
    HAS_SENTRY = False

# SECURITY: Import config with error handling
try:
    from config import settings
except Exception as e:
    # Fallback if config import fails
    class FallbackSettings:
        LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
        ENV = os.environ.get('ENV', 'production')
        SENTRY_DSN = os.environ.get('SENTRY_DSN', '')
    settings = FallbackSettings()


def setup_logging():
    """Configure structured logging and Sentry error tracking
    SECURITY: All operations are wrapped to prevent blocking app startup
    """
    try:
        # Configure structlog for structured JSON logging
        if HAS_STRUCTLOG:
            structlog.configure(
                processors=[
                    structlog.contextvars.merge_contextvars,
                    structlog.processors.add_log_level,
                    structlog.processors.StackInfoRenderer(),
                    structlog.processors.TimeStamper(fmt="iso"),
                    structlog.processors.JSONRenderer()
                ],
                wrapper_class=structlog.make_filtering_bound_logger(
                    getattr(logging, settings.LOG_LEVEL, logging.INFO)
                ),
                context_class=dict,
                logger_factory=structlog.PrintLoggerFactory(),
                cache_logger_on_first_use=False
            )
        else:
            # Fallback to standard logging
            log_level = getattr(logging, settings.LOG_LEVEL, logging.INFO)
            logging.basicConfig(level=log_level)
    except Exception as e:
        # Don't fail if logging setup fails
        logging.basicConfig(level=logging.INFO)
        logging.warning(f"Structured logging setup failed, using standard logging: {e}")
    
    # Configure Sentry if DSN is provided
    if HAS_SENTRY and settings.SENTRY_DSN:
        sentry_logging = LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors and above as events
        )
        
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                FastApiIntegration(),
                sentry_logging
            ],
            traces_sample_rate=0.1,  # 10% performance monitoring
            environment=settings.ENV,
            send_default_pii=False,   # Don't send personally identifiable information
            before_send=_filter_sensitive_data
        )
        print("✅ Sentry error tracking initialized")
        print(f"   Environment: {settings.ENV}")
    else:
        print("⚠️  Sentry DSN not configured - error tracking disabled")
        print("   Set SENTRY_DSN environment variable to enable")


def _filter_sensitive_data(event, hint):
    """Filter sensitive data from Sentry events"""
    # Remove sensitive headers
    if 'request' in event and 'headers' in event['request']:
        headers = event['request']['headers']
        sensitive_headers = ['authorization', 'cookie', 'x-api-key']
        for header in sensitive_headers:
            if header in headers:
                headers[header] = '[REDACTED]'
    
    return event


def get_logger(name: str):
    """
    Get a structured logger instance
    
    Args:
        name: Logger name (typically __name__)
    
    Returns:
        Structured logger instance (or standard logger if structlog unavailable)
    """
    try:
        if HAS_STRUCTLOG:
            return structlog.get_logger(name)
        else:
            return logging.getLogger(name)
    except Exception:
        # Ultimate fallback
        return logging.getLogger(name)


