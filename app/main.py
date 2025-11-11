# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, usuarios, notas, estudiantes, auditoria

app = FastAPI(
    title="Sistema de Notas Seguro",
    description="API para gestión segura de notas académicas con JWT",
    version="1.0.0"
)

# Cambia "*" por los orígenes permitidos (ej: el puerto de Ionic)
origins = [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://0.0.0.0:*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # IMPORTANTE para cookies HttpOnly
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(notas.router)
app.include_router(estudiantes.router) 
app.include_router(auditoria.router)

@app.get("/")
async def root():
    return {"message": "Sistema de Notas Seguro - API funcionando correctamente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sistema-notas"}
