from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)
    question = Column(String(255), nullable=False)
    answer = Column(Text, nullable=False)
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    is_active = Column(Integer, default=1)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String(50), primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="Open")  # Open, In Progress, Resolved
    priority = Column(String(30), default="Medium")  # Low, Medium, High, Urgent
    resolution_notes = Column(Text, nullable=True)
    chat_transcript = Column(Text, nullable=True)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())
    resolved_at = Column(String(50), nullable=True)

    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(String(50), ForeignKey("tickets.id"), nullable=False)
    sender = Column(String(30), nullable=False)  # customer, agent, system
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

    ticket = relationship("Ticket", back_populates="messages")

class CustomerFeedback(Base):
    __tablename__ = "customer_feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(String(50), nullable=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    category = Column(String(50), nullable=True)
    comment = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON array string
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="admin")
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(100), nullable=True)
    created_at = Column(String(50), default=lambda: datetime.utcnow().isoformat())

