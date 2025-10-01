from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Models para requests/responses
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    rol: str
    nombre: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    rol: str
    nombre: str
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class NotaCreate(BaseModel):
    estudiante_id: int
    asignatura: str
    calificacion: float
    periodo: str

class NotaResponse(BaseModel):
    id: int
    estudiante_id: int
    asignatura: str
    calificacion: float
    periodo: str
    creado_por: int
    
    class Config:
        from_attributes = True