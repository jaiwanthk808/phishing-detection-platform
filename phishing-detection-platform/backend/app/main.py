from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import settings
from app.database.session import SessionLocal, init_db
from app.services.scan_service import purge_expired


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        purge_expired(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Phishing Detection Platform API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(router)


@app.exception_handler(Exception)
async def unhandled(_request: Request, _exc: Exception):
    # Never expose stack traces or internal paths to the client.
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})
