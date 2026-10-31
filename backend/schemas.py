from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# Chat Schemas
class ChatHistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[ChatHistoryItem]] = []

class FaqSnippet(BaseModel):
    id: int
    category: str
    question: str
    answer: str

class ChatResponse(BaseModel):
    message: str
    mode: str  # 'ai' | 'faq_fallback'
    confidence: float
    matchedFaqs: List[FaqSnippet]
    canEscalate: bool
    suggestedQuestions: List[str]

# FAQ Schemas
class FaqCreate(BaseModel):
    category: str
    question: str
    answer: str
    is_active: Optional[int] = 1

class FaqUpdate(BaseModel):
    category: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    is_active: Optional[int] = None

class FaqFeedbackRequest(BaseModel):
    helpful: bool

# Ticket Schemas
class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    category: str
    subject: str
    description: str
    priority: Optional[str] = "Medium"
    chat_transcript: Optional[List[dict]] = None

class TicketMessageCreate(BaseModel):
    sender: Optional[str] = "customer"
    sender_name: Optional[str] = "Customer"
    message: str

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    resolution_notes: Optional[str] = None

class AdminReplyRequest(BaseModel):
    message: str
    new_status: Optional[str] = None

# Customer Feedback Schema
class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    ticket_id: Optional[str] = None
    category: Optional[str] = "General"
    comment: Optional[str] = None
    tags: Optional[List[str]] = None

# Admin Schemas
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminTokenResponse(BaseModel):
    token: str
    user: dict

# Customer Auth Schemas
class CustomerSignupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    company: Optional[str] = None

class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str

class CustomerTokenResponse(BaseModel):
    token: str
    customer: dict

class StaffSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(..., min_length=6)
    invite_code: Optional[str] = None

