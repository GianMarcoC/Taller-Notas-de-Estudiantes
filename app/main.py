from fastapi import FastAPI
from app.routers import auth, usuarios, notas

app = FastAPI(
    title="Sistema de Notas Seguro",
    description="API para gestión segura de notas académicas",
    version="1.0.0"
)

# Incluir routers
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(notas.router)

@app.get("/")
async def root():
    return {"message": "Sistema de Notas Seguro - API funcionando correctamente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sistema-notas"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)