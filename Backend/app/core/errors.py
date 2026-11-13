import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

log = logging.getLogger("nirmay")


def http_error(status: int, code: str, message: str, **extra) -> HTTPException:
    """Consistent error body: {"detail": {"error": code, "message": ..., ...}}."""
    return HTTPException(status_code=status, detail={"error": code, "message": message, **extra})


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):  # never leak internals
        log.exception("unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={"detail": {"error": "internal_error", "message": "Something went wrong."}},
        )
