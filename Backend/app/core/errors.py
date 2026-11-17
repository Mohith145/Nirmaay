import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("nirmay")


def http_error(status: int, code: str, message: str, **extra) -> HTTPException:
    """Consistent error body: {"detail": {"error": code, "message": ..., ...}}."""
    return HTTPException(status_code=status, detail={"error": code, "message": message, **extra})


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception(_: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict) and "error" in detail:
            code = detail["error"]
            message = detail.get("message", str(detail))
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": {"code": code, "message": message},
                    "detail": detail,
                },
            )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail},
        )

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):  # never leak internals
        log.exception("unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"detail": {"error": "internal_error", "message": "Something went wrong."}},
        )
