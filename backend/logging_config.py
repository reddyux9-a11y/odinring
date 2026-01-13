"""
Logging Configuration
Provides structured logging and Sentry integration
"""
import structlog
import logging
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from config import settings


def setup_logging():
    """Configure structured logging and Sentry error tracking"""
    
    # Configure structlog for structured JSON logging
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.LOG_LEVEL)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=False
    )
    
    # Configure Sentry if DSN is provided
    if settings.SENTRY_DSN:
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
        Structured logger instance
    """
    return structlog.get_logger(name)


