from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, usuarios, notas, estudiantes, auditoria

app = FastAPI(
    title="Sistema de Notas Seguro",
    description="API para gestión segura de notas académicas con JWT",
    version="1.0.0"
)

# --- INICIO DEL ARREGLO ---
# Middleware para añadir encabezados de seguridad
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Espera a que la ruta normal genere la respuesta
    response = await call_next(request)
    
    # Añade el encabezado que faltaba para cumplir con el reporte de ZAP
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # (Opcional, pero muy recomendado)
    # Ya que estás aquí, puedes añadir otros encabezados de seguridad
    # que ZAP probablemente buscaría en un escaneo más profundo:
    
    # Evita que tu sitio sea cargado en un <iframe> (previene Clickjacking)
    response.headers["X-Frame-Options"] = "DENY" 
    
    # Una política de seguridad de contenido básica para APIs
    response.headers["Content-Security-Policy"] = "default-src 'self'; object-src 'none'"
    
    return response
# --- FIN DEL ARREGLO ---

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