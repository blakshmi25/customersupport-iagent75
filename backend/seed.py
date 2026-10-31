import os
from datetime import datetime
from database import engine, SessionLocal, Base
from models import FAQ, Ticket, TicketMessage, CustomerFeedback, AdminUser
from auth import get_password_hash

def seed_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed Admin User
    admin = db.query(AdminUser).filter(AdminUser.email == "admin@supportagent.io").first()
    if not admin:
        admin = AdminUser(
            email="admin@supportagent.io",
            hashed_password=get_password_hash("Admin@2026!"),
            full_name="Senior Support Lead",
            role="admin",
            created_at=datetime.utcnow().isoformat()
        )
        db.add(admin)
        print("Admin user created: admin@supportagent.io / Admin@2026!")

    # Seed FAQs
    if db.query(FAQ).count() == 0:
        now = datetime.utcnow().isoformat()
        seed_faqs = [
            FAQ(category="Orders", question="How can I track my shipped order?", answer="You can track your order using the tracking number sent in your shipping confirmation email. Simply navigate to our Track Ticket page or click the link in your email to view real-time courier updates, estimated delivery time, and dispatch status.", created_at=now, updated_at=now),
            FAQ(category="Orders", question="Can I change my delivery address after placing an order?", answer="Delivery addresses can be updated within 60 minutes of placing an order, provided the fulfillment process has not begun. Reach out to our customer support or initiate an immediate chat to request an address update before dispatch.", created_at=now, updated_at=now),
            FAQ(category="Orders", question="What should I do if my package says delivered but I have not received it?", answer="Please check with neighbors, building reception, or safe drop locations. Couriers occasionally scan packages up to 24 hours in advance. If 24 hours have passed and you still cannot locate it, submit a support ticket under the Orders category and we will file a trace investigation.", created_at=now, updated_at=now),
            FAQ(category="Payments", question="Which payment methods and currencies are accepted?", answer="We accept Visa, MasterCard, American Express, PayPal, Apple Pay, Google Pay, and SEPA direct debit. Transactions are processed in USD, EUR, GBP, CAD, and AUD based on your billing region.", created_at=now, updated_at=now),
            FAQ(category="Payments", question="Why was my credit card transaction declined?", answer="Card declines are typically caused by insufficient funds, incorrect billing ZIP/postal code, 3D-Secure verification timeout, or anti-fraud cardholder security flags. We recommend contacting your issuing bank or trying an alternate payment method like PayPal.", created_at=now, updated_at=now),
            FAQ(category="Refunds", question="What is your standard refund and return policy?", answer="We offer a 30-day satisfaction guarantee for eligible items in unused, original condition with packaging intact. Once your return is received and inspected at our fulfillment hub, refunds are issued to the original payment method within 3 to 5 business days.", created_at=now, updated_at=now),
            FAQ(category="Refunds", question="How long does it take for a refund to show on my bank statement?", answer="Credit card refunds typically appear on your statement within 3 to 7 business days, depending on your bank processing cycle. PayPal and store credit refunds are usually available within 24 hours.", created_at=now, updated_at=now),
            FAQ(category="Account", question="How do I reset my account password?", answer="Click on the 'Forgot Password' link on the account sign-in page. Enter your registered email address and you will receive a secure one-time reset link valid for 30 minutes.", created_at=now, updated_at=now),
            FAQ(category="Technical Issues", question="The portal is showing a blank page or 500 error. How can I resolve it?", answer="First perform a hard refresh (Ctrl + F5 on Windows/Linux or Cmd + Shift + R on Mac). Ensure browser extensions are disabled for our domain, and clear your local cache.", created_at=now, updated_at=now),
        ]
        db.add_all(seed_faqs)
        print("Default FAQs seeded successfully.")

    db.commit()
    db.close()

if __name__ == "__main__":
    seed_all()
