from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, usuarios, notas, estudiantes, auditoria

app = FastAPI(
    title="Sistema de Notas Seguro",
    description="API para gestión segura de notas académicas con JWT",
    version="1.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia "*" por la URL de tu frontend si quieres más seguridad
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para headers de seguridad
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Incluir routers
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