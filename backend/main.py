import os
import random
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from dotenv import load_dotenv

from .database import engine, get_db, Base
from .models import FAQ, Ticket, TicketMessage, CustomerFeedback, AdminUser, Customer
from .schemas import (
    ChatRequest, ChatResponse, FaqSnippet,
    FaqCreate, FaqUpdate, FaqFeedbackRequest,
    TicketCreate, TicketMessageCreate, TicketUpdate, AdminReplyRequest,
    FeedbackCreate, AdminLoginRequest, AdminTokenResponse,
    CustomerSignupRequest, CustomerLoginRequest, CustomerTokenResponse, StaffSignupRequest
)
from .auth import verify_password, create_access_token, get_current_admin, get_password_hash

load_dotenv()

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support Intelligent Agent API",
    description="FastAPI Backend for Customer Support Intelligent Agent — AI-Powered Customer Service System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ---------------------------------------------------------------------------
# 1. CHAT ENDPOINT (Grounding & FAQ Fallback)
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest, db: Session = Depends(get_db)):
    query = request.message.strip()
    query_lower = query.lower()

    # Search active FAQs in SQLite
    all_faqs = db.query(FAQ).filter(FAQ.is_active == 1).all()
    words = [w for w in "".join([c if c.isalnum() else " " for c in query_lower]).split() if len(w) > 2]

    scored_faqs = []
    for faq in all_faqs:
        score = 0
        q_lower = faq.question.lower()
        a_lower = faq.answer.lower()
        c_lower = faq.category.lower()

        if c_lower in query_lower:
            score += 3
        if query_lower in q_lower or q_lower in query_lower:
            score += 10
        for w in words:
            if w in q_lower:
                score += 3
            if w in a_lower:
                score += 1

        if score > 0:
            scored_faqs.append((score, faq))

    scored_faqs.sort(key=lambda x: x[0], reverse=True)
    top_matches = [f for _, f in scored_faqs[:4]]

    default_suggestions = [
        "How can I track my shipped order?",
        "What is your 30-day refund policy?",
        "Why was my credit card declined?",
        "How do I enable Two-Factor Authentication?"
    ]

    # Attempt Gemini AI model if API key is present
    if GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            knowledge_text = "\n\n".join([
                f"[Category: {f.category}] Q: {f.question}\nA: {f.answer}"
                for f in top_matches
            ]) if top_matches else "No directly matching FAQ articles found."

            system_instruction = f"""You are the Customer Support Intelligent Agent for our customer service system.
You provide accurate, courteous, and concise answers to customer inquiries.

GROUNDING & TRUTHFULNESS MANDATES:
1. Base your knowledge strictly on our official knowledge base:
{knowledge_text}
2. NEVER invent fake order IDs, carrier tracking numbers, refund transaction codes, or unauthorized account changes.
3. If the knowledge base does not cover the question, or if the customer expresses frustration, urgent account issues, or asks to speak with a human agent, clearly recommend opening a support ticket so our support team can take action.
4. Keep responses structured, concise, and polite. Use bullet points for step-by-step guidance.
5. If you advise opening a ticket, reassure them that our human support team responds promptly."""

            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=f"Customer Question: {query}",
                config={"system_instruction": system_instruction}
            )

            reply_text = response.text if response.text else "I am here to help. Could you please provide additional details?"
            return ChatResponse(
                message=reply_text,
                mode="ai",
                confidence=0.94 if top_matches else 0.72,
                matchedFaqs=[FaqSnippet(id=f.id, category=f.category, question=f.question, answer=f.answer) for f in top_matches],
                canEscalate=True,
                suggestedQuestions=default_suggestions
            )
        except Exception as e:
            # Fallback smoothly to knowledge base search
            pass

    # FAQ-based fallback mode
    if top_matches and scored_faqs[0][0] >= 3:
        best = top_matches[0]
        related_notice = ""
        if len(top_matches) > 1:
            related_notice = "\n\nRelated topics you might find helpful:\n" + "\n".join([f"• {f.question}" for f in top_matches[1:3]])
        
        reply_message = f"{best.answer}{related_notice}\n\nIf you need individualized assistance or your issue requires account modification, click 'Create Support Ticket' below and our human support team will resolve it for you."
        return ChatResponse(
            message=reply_message,
            mode="faq_fallback",
            confidence=0.88,
            matchedFaqs=[FaqSnippet(id=f.id, category=f.category, question=f.question, answer=f.answer) for f in top_matches],
            canEscalate=True,
            suggestedQuestions=default_suggestions
        )

    # Generic fallback
    return ChatResponse(
        message=f"I searched our knowledge base, but couldn't find a direct match for \"{query}\".\n\nWould you like me to open a support ticket for our specialist team? You can also browse our FAQs or rephrase your question.",
        mode="faq_fallback",
        confidence=0.35,
        matchedFaqs=[],
        canEscalate=True,
        suggestedQuestions=default_suggestions
    )

# ---------------------------------------------------------------------------
# 2. FAQs ENDPOINTS
# ---------------------------------------------------------------------------
@app.get("/api/faqs")
def get_faqs(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(FAQ).filter(FAQ.is_active == 1)
    if category and category != "All":
        query = query.filter(FAQ.category == category)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(FAQ.question.ilike(term), FAQ.answer.ilike(term)))
    return query.order_by(FAQ.category.asc(), FAQ.id.asc()).all()

@app.post("/api/faqs/{faq_id}/feedback")
def submit_faq_feedback(faq_id: int, request: FaqFeedbackRequest, db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    if request.helpful:
        faq.helpful_count += 1
    else:
        faq.not_helpful_count += 1
    db.commit()
    db.refresh(faq)
    return {"success": True, "helpful_count": faq.helpful_count, "not_helpful_count": faq.not_helpful_count}

# ---------------------------------------------------------------------------
# 3. TICKETS ENDPOINTS
# ---------------------------------------------------------------------------
@app.post("/api/tickets", status_code=status.HTTP_201_CREATED)
def create_ticket(request: TicketCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    ticket_id = f"TK-2026-{random.randint(10000, 99999)}"
    
    ticket = Ticket(
        id=ticket_id,
        customer_name=request.customer_name.strip(),
        customer_email=request.customer_email.strip().lower(),
        category=request.category,
        subject=request.subject.strip(),
        description=request.description.strip(),
        priority=request.priority or "Medium",
        status="Open",
        chat_transcript=json.dumps(request.chat_transcript) if request.chat_transcript else None,
        created_at=now,
        updated_at=now
    )
    db.add(ticket)

    # Initial message
    init_message = TicketMessage(
        ticket_id=ticket_id,
        sender="customer",
        sender_name=request.customer_name.strip(),
        message=request.description.strip(),
        created_at=now
    )
    db.add(init_message)
    db.commit()
    db.refresh(ticket)
    return {"success": True, "ticket": ticket}

@app.get("/api/tickets/track")
def track_ticket(ticket_id: str, email: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(
        func.upper(Ticket.id) == ticket_id.strip().upper(),
        func.lower(Ticket.customer_email) == email.strip().lower()
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="No ticket found matching the provided Ticket ID and Email address.")
    
    messages = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket.id).order_by(TicketMessage.id.asc()).all()
    return {"ticket": ticket, "messages": messages}

@app.post("/api/tickets/{ticket_id}/messages")
def append_ticket_message(ticket_id: str, request: TicketMessageCreate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.utcnow().isoformat()
    msg = TicketMessage(
        ticket_id=ticket_id,
        sender=request.sender or "customer",
        sender_name=request.sender_name or "Customer",
        message=request.message.strip(),
        created_at=now
    )
    ticket.updated_at = now
    db.add(msg)
    db.commit()

    messages = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.id.asc()).all()
    return {"success": True, "messages": messages}

# ---------------------------------------------------------------------------
# 4. CUSTOMER SATISFACTION FEEDBACK
# ---------------------------------------------------------------------------
@app.post("/api/feedback")
def submit_customer_feedback(request: FeedbackCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    feedback = CustomerFeedback(
        ticket_id=request.ticket_id,
        rating=request.rating,
        category=request.category or "General",
        comment=request.comment.strip() if request.comment else None,
        tags=json.dumps(request.tags) if request.tags else "[]",
        created_at=now
    )
    db.add(feedback)
    db.commit()
    return {"success": True, "message": "Thank you for your valuable feedback!"}

# ---------------------------------------------------------------------------
# 5. ADMIN AUTH & DASHBOARD
# ---------------------------------------------------------------------------
@app.post("/api/admin/login", response_model=AdminTokenResponse)
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == request.email.strip().lower()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = create_access_token({"id": user.id, "email": user.email, "role": user.role, "name": user.full_name})
    return AdminTokenResponse(
        token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}
@app.post("/api/admin/signup", response_model=AdminTokenResponse, status_code=status.HTTP_201_CREATED)
def admin_signup(request: StaffSignupRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    existing = db.query(AdminUser).filter(AdminUser.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An admin account with this email already exists.")
    
    if request.invite_code and request.invite_code.strip() not in ["SUPPORT2026", "ADMIN2026"]:
        raise HTTPException(status_code=400, detail="Invalid staff invite code. Use SUPPORT2026 or leave blank.")

    user = AdminUser(
        email=clean_email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name.strip(),
        role="admin",
        created_at=datetime.utcnow().isoformat()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"id": user.id, "email": user.email, "role": user.role, "name": user.full_name})
    return AdminTokenResponse(
        token=token,
        user={"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role}
    )

# ---------------------------------------------------------------------------
# 5B. CUSTOMER AUTHENTICATION & PORTAL
# ---------------------------------------------------------------------------
@app.post("/api/customer/signup", response_model=CustomerTokenResponse, status_code=status.HTTP_201_CREATED)
def customer_signup(request: CustomerSignupRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    existing = db.query(Customer).filter(Customer.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")

    customer = Customer(
        name=request.name.strip(),
        email=clean_email,
        hashed_password=get_password_hash(request.password),
        phone=request.phone.strip() if request.phone else None,
        company=request.company.strip() if request.company else None,
        created_at=datetime.utcnow().isoformat()
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = create_access_token({"id": customer.id, "email": customer.email, "name": customer.name})
    return CustomerTokenResponse(
        token=token,
        customer={"id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone, "company": customer.company}
    )

@app.post("/api/customer/login", response_model=CustomerTokenResponse)
def customer_login(request: CustomerLoginRequest, db: Session = Depends(get_db)):
    clean_email = request.email.strip().lower()
    customer = db.query(Customer).filter(Customer.email == clean_email).first()
    if not customer or not verify_password(request.password, customer.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"id": customer.id, "email": customer.email, "name": customer.name})
    return CustomerTokenResponse(
        token=token,
        customer={"id": customer.id, "name": customer.name, "email": customer.email, "phone": customer.phone, "company": customer.company}
    )

@app.get("/api/customer/tickets")
def get_customer_tickets(email: str, db: Session = Depends(get_db)):
    return db.query(Ticket).filter(func.lower(Ticket.customer_email) == email.strip().lower()).order_by(Ticket.created_at.desc()).all()

@app.get("/api/admin/stats")
def get_admin_stats(current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    total = db.query(Ticket).count()
    open_count = db.query(Ticket).filter(Ticket.status == "Open").count()
    in_progress_count = db.query(Ticket).filter(Ticket.status == "In Progress").count()
    resolved_count = db.query(Ticket).filter(Ticket.status == "Resolved").count()

    avg_rating = db.query(func.avg(CustomerFeedback.rating)).scalar() or 5.0
    feedback_count = db.query(CustomerFeedback).count()

    cat_counts = db.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()
    category_stats = [{"category": c[0], "count": c[1]} for c in cat_counts]

    recent_feedback = db.query(CustomerFeedback).order_by(CustomerFeedback.id.desc()).limit(5).all()

    return {
        "totalTickets": total,
        "openTickets": open_count,
        "inProgressTickets": in_progress_count,
        "resolvedTickets": resolved_count,
        "avgCsat": round(float(avg_rating), 1),
        "feedbackCount": feedback_count,
        "categoryStats": category_stats,
        "recentFeedback": recent_feedback
    }

@app.get("/api/admin/tickets")
def get_admin_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Ticket)
    if status and status != "All":
        query = query.filter(Ticket.status == status)
    if category and category != "All":
        query = query.filter(Ticket.category == category)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Ticket.id.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
                Ticket.subject.ilike(term)
            )
        )
    return query.order_by(Ticket.created_at.desc()).all()

@app.get("/api/admin/tickets/{ticket_id}")
def get_admin_ticket_detail(ticket_id: str, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.id.asc()).all()
    return {"ticket": ticket, "messages": messages}

@app.patch("/api/admin/tickets/{ticket_id}")
def update_admin_ticket(ticket_id: str, request: TicketUpdate, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.utcnow().isoformat()
    if request.status:
        if request.status == "Resolved" and ticket.status != "Resolved":
            ticket.resolved_at = now
        elif request.status != "Resolved":
            ticket.resolved_at = None
        ticket.status = request.status

    if request.priority:
        ticket.priority = request.priority
    if request.resolution_notes is not None:
        ticket.resolution_notes = request.resolution_notes

    ticket.updated_at = now
    db.commit()
    db.refresh(ticket)
    return {"success": True, "ticket": ticket}

@app.post("/api/admin/tickets/{ticket_id}/reply")
def reply_to_ticket(ticket_id: str, request: AdminReplyRequest, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    now = datetime.utcnow().isoformat()
    msg = TicketMessage(
        ticket_id=ticket_id,
        sender="agent",
        sender_name=current_admin.full_name or "Support Specialist",
        message=request.message.strip(),
        created_at=now
    )
    db.add(msg)

    next_status = request.new_status or ("In Progress" if ticket.status == "Open" else ticket.status)
    ticket.status = next_status
    if next_status == "Resolved":
        ticket.resolved_at = now
    ticket.updated_at = now

    db.commit()
    messages = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.id.asc()).all()
    return {"success": True, "ticket": ticket, "messages": messages}

@app.get("/api/admin/faqs")
def get_all_faqs_admin(current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(FAQ).order_by(FAQ.id.desc()).all()

@app.post("/api/admin/faqs", status_code=status.HTTP_201_CREATED)
def create_faq_admin(request: FaqCreate, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    now = datetime.utcnow().isoformat()
    faq = FAQ(
        category=request.category,
        question=request.question.strip(),
        answer=request.answer.strip(),
        is_active=request.is_active if request.is_active is not None else 1,
        created_at=now,
        updated_at=now
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

@app.put("/api/admin/faqs/{faq_id}")
def update_faq_admin(faq_id: int, request: FaqUpdate, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    if request.category:
        faq.category = request.category
    if request.question:
        faq.question = request.question.strip()
    if request.answer:
        faq.answer = request.answer.strip()
    if request.is_active is not None:
        faq.is_active = request.is_active
    faq.updated_at = datetime.utcnow().isoformat()

    db.commit()
    db.refresh(faq)
    return faq

@app.delete("/api/admin/faqs/{faq_id}")
def delete_faq_admin(faq_id: int, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return {"success": True, "message": "FAQ deleted successfully"}
