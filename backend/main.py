import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import (
    calculate, critical_path, risk, simulate, optimize,
    benchmark, procurement, carbon, compliance, roi,
    contractor, warnings, ai, report, prices
)

app = FastAPI(
    title="AI Construction Intelligence Platform API",
    description="Full-stack AI-powered construction analysis, risk prediction, and optimization platform for Indian construction projects.",
    version="1.0.0",
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(calculate.router, prefix="/api", tags=["Calculate"])
app.include_router(critical_path.router, prefix="/api", tags=["Critical Path"])
app.include_router(risk.router, prefix="/api", tags=["Risk"])
app.include_router(simulate.router, prefix="/api", tags=["Simulate"])
app.include_router(optimize.router, prefix="/api", tags=["Optimize"])
app.include_router(benchmark.router, prefix="/api", tags=["Benchmark"])
app.include_router(procurement.router, prefix="/api", tags=["Procurement"])
app.include_router(carbon.router, prefix="/api", tags=["Carbon"])
app.include_router(compliance.router, prefix="/api", tags=["Compliance"])
app.include_router(roi.router, prefix="/api", tags=["ROI"])
app.include_router(contractor.router, prefix="/api", tags=["Contractor"])
app.include_router(warnings.router, prefix="/api", tags=["Warnings"])
app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(report.router, prefix="/api", tags=["Report"])
app.include_router(prices.router, prefix="/api", tags=["Prices"])


@app.get("/")
async def root():
    return {
        "name": "AI Construction Intelligence Platform",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
