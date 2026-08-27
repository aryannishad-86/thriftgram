from rest_framework.views import exception_handler as drf_default_exception_handler


def custom_exception_handler(exc, context):
    """One error envelope for the whole API: every error response carries
    {"error": "<human-readable message>"}, plus a "fields" key (validation
    errors only) with the original per-field messages for any future
    frontend work that wants them.

    Before this, the API had two incompatible shapes depending on WHERE the
    error came from: DRF's own machinery (permission denied, not found,
    throttled, unauthenticated, and default ModelViewSet validation errors)
    emitted {"detail": "..."} or a bare {"field": ["msg", ...]} dict, while
    every hand-written view in this codebase (RegisterView, LogoutView,
    GoogleLogin, checkout, the webhook, ...) already independently settled
    on {"error": "..."}. This handler only ever fires for the DRF-raised
    side — a view that builds and returns its own Response(...) directly
    (as all the hand-written ones do) never reaches EXCEPTION_HANDLER at
    all, so those are untouched and already match.

    Verified against the frontend before choosing this shape, not assumed:
    grepped every catch block across the app — only one call site
    (register/page.tsx) actually reads a field off an error response body,
    and it already reads exactly `.error`. Every other page just logs and
    shows a generic message, so unifying onto {"error": ...} needed zero
    frontend changes.
    """
    response = drf_default_exception_handler(exc, context)
    if response is None:
        return None  # Unhandled exception — Django's own 500 handling takes over, unchanged.

    data = response.data

    if isinstance(data, dict) and set(data.keys()) == {'detail'}:
        # DRF's default shape for PermissionDenied/NotFound/Throttled/
        # NotAuthenticated/AuthenticationFailed etc.
        response.data = {'error': str(data['detail'])}
    elif isinstance(data, dict) and 'error' in data:
        pass  # Already the target shape somehow — leave it alone.
    elif isinstance(data, dict):
        # Serializer ValidationError: {"field_name": ["msg", ...], ...}
        # (raised automatically by serializer.is_valid(raise_exception=True)
        # in every generic ModelViewSet create/update).
        messages = []
        for field, field_errors in data.items():
            error_list = field_errors if isinstance(field_errors, list) else [field_errors]
            for e in error_list:
                messages.append(str(e) if field == 'non_field_errors' else f'{field}: {e}')
        response.data = {'error': '; '.join(messages) or 'Invalid request.', 'fields': data}
    elif isinstance(data, list):
        # Rare: a top-level list of error messages rather than a field dict.
        response.data = {'error': '; '.join(str(e) for e in data)}

    return response
