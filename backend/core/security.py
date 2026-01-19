"""
Security-related custom classes for ThriftGram.
"""
from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Throttle for login attempts - stricter rate limiting.
    Rate: 5 attempts per minute
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None  # Don't throttle authenticated users
        
        # Use IP address for anonymous users
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class RegisterRateThrottle(SimpleRateThrottle):
    """
    Throttle for registration attempts - prevent mass account creation.
    Rate: 3 attempts per hour
    """
    scope = 'register'

    def get_cache_key(self, request, view):
        # Use IP address
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class SecurityHeadersMiddleware:
    """
    Middleware to add additional security headers to responses.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "img-src 'self' https: data: blob:; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' https: wss:; "
            "frame-src 'self' https://accounts.google.com https://js.stripe.com; "
            "frame-ancestors 'none';"
        )
        
        # Permissions Policy (replaces Feature-Policy)
        response['Permissions-Policy'] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(self), "
            "usb=()"
        )
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
