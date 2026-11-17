from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings, country_config
from app.routers import auth, governance, regions, data_hub, simulate, copilot, briefs, outcomes

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Delta AI: Dual-Engine Public Data Intelligence & Policy Simulation Platform for Bangladesh Delta Plan 2100",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup - supports local development and production Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(governance.router, prefix=settings.API_V1_PREFIX)
app.include_router(regions.router, prefix=settings.API_V1_PREFIX)
app.include_router(data_hub.router, prefix=settings.API_V1_PREFIX)
app.include_router(simulate.router, prefix=settings.API_V1_PREFIX)
app.include_router(copilot.router, prefix=settings.API_V1_PREFIX)
app.include_router(briefs.router, prefix=settings.API_V1_PREFIX)
app.include_router(outcomes.router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["System"])
def health_check():
    """System health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "country": country_config.get("country_meta", {}).get("name_en", "Unknown"),
        "vertical": country_config.get("flagship_vertical", {}).get("code", "climact_twin"),
    }


@app.get("/", tags=["System"])
def root():
    """Root info endpoint"""
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "One Nation. One Evidence Layer. From Public Data to Better Decisions.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_PREFIX,
        "pilot_country": country_config.get("country_meta", {}),
        "admin_hierarchy": country_config.get("admin_hierarchy", {}),
    }
