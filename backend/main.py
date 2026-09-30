from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import stream, settings, control, docs
from services.simulation import start_simulation
from mas.executor import start_workers

app = FastAPI(title="AgentNet MAS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stream.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(control.router, prefix="/api")
app.include_router(docs.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    start_workers(num_workers=3)
    start_simulation()