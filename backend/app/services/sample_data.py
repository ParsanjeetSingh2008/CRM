"""Realistic demo leads, generated deterministically.

Used by `scripts/seed.py` and by the "Load sample leads" button, so a new
account (or a reviewer) can see the dashboard and charts with real-looking data:
~70 enquiries over the last 12 weeks, mostly arriving during Indian business
hours, with older leads more likely to be contacted/converted.
"""

import random
from datetime import datetime, timedelta, timezone

from app.models.lead import LeadStatus

IST = timezone(timedelta(hours=5, minutes=30))
RANGE_DAYS = 84
GENERATED_COUNT = 55

FEATURED_LEADS = [
    ("Aarav Sharma", "aarav.sharma@brightpixel.in", "+91 98765 43210", "BrightPixel Studios"),
    ("Priya Nair", "priya@greenleafcafe.in", "+91 91234 56780", "GreenLeaf Cafe"),
    ("Rohan Mehta", "rohan.mehta@urbanfit.co", "+91 99887 76655", "UrbanFit Gym"),
    ("Ananya Iyer", "ananya@craftedhome.in", "+91 90000 11223", "Crafted Home Decor"),
    ("Kabir Singh", "kabir@swiftlogistics.in", "+91 98111 22334", "Swift Logistics"),
    ("Meera Kapoor", "meera.kapoor@bloomflorist.com", "+91 97654 32109", "Bloom Florist"),
    ("Vihaan Gupta", "vihaan@codenest.dev", "+91 93456 78901", "CodeNest Labs"),
    ("Isha Reddy", "isha@sparkleevents.in", "+91 94567 89012", "Sparkle Events"),
    ("Arjun Patel", "arjun.patel@freshbasket.in", "+91 95678 90123", "FreshBasket Grocers"),
    ("Diya Malhotra", "diya@pawsandclaws.in", "+91 96789 01234", "Paws & Claws Pet Care"),
    ("Sai Krishnan", "sai@zentravel.co", "+91 97890 12345", "Zen Travel Co."),
    ("Neha Joshi", "neha.joshi@learnloop.in", "+91 98901 23456", "LearnLoop Tutoring"),
    ("Aditya Rao", "aditya@solarbright.in", "+91 99012 34567", "SolarBright Energy"),
    ("Kavya Menon", "kavya@inkwellprints.in", "+91 90123 45678", "Inkwell Prints"),
    ("Reyansh Verma", "reyansh@metrobikes.in", "+91 91230 98765", "Metro Bikes"),
]

FIRST_NAMES = [
    "Aisha", "Rahul", "Sneha", "Vikram", "Pooja", "Karan", "Riya", "Manish", "Tanvi", "Nikhil",
    "Shreya", "Harsh", "Anjali", "Yash", "Simran", "Dev", "Nisha", "Aryan", "Kritika", "Varun",
    "Zoya", "Siddharth", "Lakshmi", "Omar", "Fatima", "Gaurav", "Pallavi", "Rohit", "Sana", "Tarun",
]
LAST_NAMES = [
    "Agarwal", "Bose", "Chopra", "Desai", "Fernandes", "Ghosh", "Hegde", "Jain", "Khan", "Kulkarni",
    "Mishra", "Naidu", "Pillai", "Qureshi", "Saxena", "Thakur", "Vyas", "Banerjee", "Shetty", "Dutta",
]
BUSINESS_PREFIXES = [
    "Sunrise", "Lotus", "Peak", "Blue Ocean", "Harmony", "Silverline", "Nova", "Evergreen",
    "Spice Route", "Urban Nest", "Brightway", "Coastal", "Golden Leaf", "Skyline", "Pixel Forge",
]
BUSINESS_TYPES = [
    "Bakery", "Dental Clinic", "Interiors", "Yoga Studio", "Tech Solutions", "Boutique",
    "Catering", "Travels", "Coaching Centre", "Salon", "Architects", "Motors", "Pharmacy",
]
# Rough shape of when enquiries arrive (IST hour -> relative weight).
HOUR_WEIGHTS = {h: w for h, w in zip(range(24), [
    0, 0, 0, 0, 0, 0, 1, 2, 4, 8, 10, 11, 9, 8, 10, 11, 9, 7, 5, 4, 3, 2, 1, 1,
])}
# Weekends are quieter than weekdays.
DAY_WEIGHTS = [10, 11, 11, 10, 9, 5, 3]


def _random_created_at(rng: random.Random, now: datetime) -> datetime:
    # Recent weeks get more leads (business is growing): weight ~ (1 + age factor).
    while True:
        days_ago = rng.randrange(RANGE_DAYS)
        day = (now - timedelta(days=days_ago)).astimezone(IST).date()
        growth = 1.6 - days_ago / RANGE_DAYS
        if rng.random() < growth / 1.6 * DAY_WEIGHTS[day.weekday()] / max(DAY_WEIGHTS):
            break
    hour = rng.choices(list(HOUR_WEIGHTS), weights=list(HOUR_WEIGHTS.values()))[0]
    local = datetime(day.year, day.month, day.day, hour, rng.randrange(60), tzinfo=IST)
    return min(local, now - timedelta(minutes=5)).astimezone(timezone.utc)


def _status_for_age(rng: random.Random, created_at: datetime, now: datetime) -> LeadStatus:
    age_days = (now - created_at).days
    if age_days < 4:
        weights = (8, 2, 0)
    elif age_days < 21:
        weights = (4, 4, 2)
    else:
        weights = (2, 3, 5)
    return rng.choices(list(LeadStatus), weights=weights)[0]


def build_sample_leads(now: datetime) -> list[dict]:
    rng = random.Random(42)
    leads: list[dict] = []

    for name, email, phone, business in FEATURED_LEADS:
        created = _random_created_at(rng, now)
        leads.append(dict(name=name, email=email, phone=phone, business_name=business,
                          status=_status_for_age(rng, created, now), created_at=created))

    used_emails = {lead["email"] for lead in leads}
    while len(leads) < len(FEATURED_LEADS) + GENERATED_COUNT:
        first, last = rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES)
        business = f"{rng.choice(BUSINESS_PREFIXES)} {rng.choice(BUSINESS_TYPES)}"
        domain = business.lower().replace(" ", "") + rng.choice([".in", ".com", ".co"])
        email = f"{first}.{last}@{domain}".lower()
        if email in used_emails:
            continue
        used_emails.add(email)
        phone = f"+91 {rng.choice('6789')}{rng.randrange(1000, 9999)} {rng.randrange(10000, 99999)}"
        created = _random_created_at(rng, now)
        leads.append(dict(name=f"{first} {last}", email=email, phone=phone, business_name=business,
                          status=_status_for_age(rng, created, now), created_at=created))
    return leads
