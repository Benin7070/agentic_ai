import asyncio
import time
import random
import string
from pydantic import BaseModel
from services.state import state
from mas.orchestrator import AgentOrchestrator

orchestrator = AgentOrchestrator()

# ── Realistic Raw Loan Application ─────────────────────────────
# This mirrors what an Indian bank's origination system captures.
# NO pre-computed risk signals — agents derive those.
class LoanApplication(BaseModel):
    # Internal
    id: str

    # Identity & KYC
    fullName: str
    dateOfBirth: str          # YYYY-MM-DD
    gender: str               # Male | Female | Other
    panNumber: str            # e.g. ABCPS1234Q
    aadhaarLast4: str         # Last 4 digits only
    phone: str

    # Employment & Income
    employmentType: str       # Salaried | Self-Employed | Retired
    employerName: str
    monthlyIncome: float      # Gross monthly ₹
    yearsAtCurrentJob: int

    # Residential
    residentialStatus: str    # Owned | Rented | Family
    cityTier: str             # Tier1 | Tier2 | Tier3
    yearsAtCurrentAddress: int

    # Existing Financial Obligations
    existingEMIs: float       # Total monthly EMI outflow ₹
    numberOfExistingLoans: int
    creditCardOutstanding: float

    # Loan Request
    loanPurpose: str
    requestedAmount: float
    requestedTenureMonths: int

    # Banking Behavior (from bank statements)
    avgMonthlyBalance: float
    numberOfBounces: int      # Cheque/ECS bounces last 12 months
    salaryDayVariance: int    # Days variation in salary credit


# ── Realistic Name & Data Pools ────────────────────────────────
_FIRST_NAMES_M = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
                  "Rajesh", "Amit", "Sunil", "Deepak", "Manoj", "Rahul", "Vikram", "Sanjay", "Prakash", "Ravi"]
_FIRST_NAMES_F = ["Ananya", "Diya", "Priya", "Saanvi", "Aanya", "Aadhya", "Isha", "Kavya", "Meera", "Neha",
                  "Sunita", "Pooja", "Swati", "Anjali", "Divya", "Ritu", "Sneha", "Lakshmi", "Geeta", "Sita"]
_LAST_NAMES = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Reddy", "Nair", "Joshi", "Mehta",
               "Iyer", "Rao", "Das", "Mukherjee", "Pillai", "Chauhan", "Agarwal", "Tiwari", "Saxena", "Bhat"]
_EMPLOYERS_SALARIED = ["Infosys Ltd.", "TCS", "Wipro", "HCL Technologies", "Reliance Industries",
                       "HDFC Bank", "ICICI Bank", "Bajaj Finance", "Mahindra & Mahindra", "L&T",
                       "Cognizant", "Accenture India", "Amazon India", "Flipkart", "Zomato",
                       "State Government", "Central Government", "Indian Railways", "Indian Army", "SBI"]
_EMPLOYERS_SELF = ["Self - Retail Shop", "Self - Restaurant", "Self - Medical Practice",
                   "Self - Legal Practice", "Self - CA Firm", "Self - Transport Business",
                   "Self - Agriculture", "Self - Freelance IT", "Self - Construction",
                   "Self - Textile Business", "Self - Trading"]
_LOAN_PURPOSES = ["Home Renovation", "Medical Emergency", "Wedding", "Education",
                  "Debt Consolidation", "Vehicle Purchase", "Business Expansion",
                  "Travel", "Electronics Purchase", "Working Capital"]
_TIER1_CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"]
_TIER2_CITIES = ["Jaipur", "Lucknow", "Chandigarh", "Indore", "Bhopal", "Nagpur", "Coimbatore", "Kochi"]
_TIER3_CITIES = ["Dehradun", "Ranchi", "Raipur", "Guwahati", "Bareilly", "Aligarh", "Udaipur", "Salem"]

_next_id = 4800

def _rand(a: float, b: float) -> float:
    return round(a + random.random() * (b - a), 2)

def _rand_int(a: int, b: int) -> int:
    return random.randint(a, b)

def _gen_pan() -> str:
    """Generate a realistic-looking PAN number: 5 letters + 4 digits + 1 letter"""
    letters = string.ascii_uppercase
    return (
        random.choice(letters) + random.choice(letters) + random.choice(letters)
        + random.choice("ABCFGHLJPT")  # 4th char indicates entity type
        + random.choice(letters)
        + str(_rand_int(1000, 9999))
        + random.choice(letters)
    )

def _gen_phone() -> str:
    return f"+91-{random.choice(['98','97','96','95','94','93','91','90','88','87','86','85'])}{_rand_int(10000000, 99999999)}"

def generate_application(dist: dict) -> LoanApplication:
    """
    Generate a realistic raw loan application.
    The `dist` parameter controls the statistical distribution of risk *profiles*,
    but the application itself contains NO pre-computed risk labels.
    """
    global _next_id
    app_id = f"A-{_next_id}"
    _next_id += 1

    # Determine underlying risk archetype (invisible to agents)
    roll = random.random() * 100
    if roll > dist['low'] + dist['medium']:
        archetype = 'HIGH'
    elif roll > dist['low']:
        archetype = 'MEDIUM'
    else:
        archetype = 'LOW'

    # Gender & Name
    gender = random.choice(["Male", "Female"])
    if gender == "Male":
        first = random.choice(_FIRST_NAMES_M)
    else:
        first = random.choice(_FIRST_NAMES_F)
    full_name = f"{first} {random.choice(_LAST_NAMES)}"

    # Date of birth (age 23–58)
    birth_year = _rand_int(1967, 2002)
    dob = f"{birth_year}-{_rand_int(1,12):02d}-{_rand_int(1,28):02d}"

    # Employment
    emp_type = random.choices(
        ["Salaried", "Self-Employed", "Retired"],
        weights=[65, 30, 5] if archetype == 'LOW' else ([50, 40, 10] if archetype == 'MEDIUM' else [30, 55, 15]),
        k=1
    )[0]

    if emp_type == "Salaried":
        employer = random.choice(_EMPLOYERS_SALARIED)
    elif emp_type == "Self-Employed":
        employer = random.choice(_EMPLOYERS_SELF)
    else:
        employer = "Retired"

    # Check if high-risk profile should be a borderline HITL candidate
    is_hitl_borderline = (archetype == 'HIGH' and dist.get('high', 0) >= 25 and random.random() < 0.60)

    # Income — varies by archetype
    if archetype == 'LOW':
        monthly_income = _rand(75000, 250000)
        years_job = _rand_int(3, 25)
    elif archetype == 'MEDIUM':
        monthly_income = _rand(40000, 95000)
        years_job = _rand_int(1, 10)
    elif is_hitl_borderline:
        # Borderline candidate with solid income but high exposure and borderline DTI
        monthly_income = _rand(55000, 135000)
        years_job = _rand_int(2, 7)
    else:
        # Severe unmitigated default risk
        monthly_income = _rand(15000, 35000)
        years_job = _rand_int(0, 1)

    # Residential
    res_status = random.choices(
        ["Owned", "Rented", "Family"],
        weights=[60, 25, 15] if archetype == 'LOW' else ([30, 50, 20] if (archetype == 'MEDIUM' or is_hitl_borderline) else [15, 60, 25]),
        k=1
    )[0]
    city_tier = random.choices(
        ["Tier1", "Tier2", "Tier3"],
        weights=[50, 35, 15],
        k=1
    )[0]
    years_address = _rand_int(1, 15)

    # Financial obligations
    if archetype == 'LOW':
        existing_emis = _rand(0, 15000)
        num_loans = _rand_int(0, 2)
        cc_outstanding = _rand(0, 30000)
    elif archetype == 'MEDIUM':
        existing_emis = round(monthly_income * _rand(0.32, 0.44), 2)
        num_loans = _rand_int(1, 3)
        cc_outstanding = _rand(10000, 60000)
    elif is_hitl_borderline:
        # Borderline DTI (0.42 to 0.52) — key trigger for Human Underwriter review
        existing_emis = round(monthly_income * _rand(0.42, 0.52), 2)
        num_loans = _rand_int(2, 4)
        cc_outstanding = _rand(30000, 95000)
    else:
        # Unserviceable DTI (> 0.65)
        existing_emis = round(monthly_income * _rand(0.65, 0.95), 2)
        num_loans = _rand_int(3, 6)
        cc_outstanding = _rand(50000, 200000)

    # Loan request
    purpose = random.choice(_LOAN_PURPOSES)
    if archetype == 'LOW':
        requested = _rand(50000, 300000)
    elif archetype == 'MEDIUM':
        requested = _rand(150000, 450000)
    elif is_hitl_borderline:
        # High ticket loan requiring senior supervisory four-eyes approval
        requested = _rand(380000, 800000)
    else:
        requested = _rand(250000, 1000000)
    tenure = random.choice([12, 24, 36, 48, 60])

    # Banking behavior
    if archetype == 'LOW':
        avg_balance = _rand(50000, 500000)
        bounces = 0  # Clean
        salary_var = _rand_int(0, 2)
    elif archetype == 'MEDIUM':
        avg_balance = _rand(20000, 80000)
        bounces = _rand_int(0, 1)
        salary_var = _rand_int(1, 4)
    elif is_hitl_borderline:
        # 1 or 2 historical returns requiring underwriter scrutiny
        avg_balance = _rand(18000, 55000)
        bounces = _rand_int(1, 2)
        salary_var = _rand_int(2, 5)
    else:
        # Persistent bouncing
        avg_balance = _rand(2000, 12000)
        bounces = _rand_int(3, 8)
        salary_var = _rand_int(5, 18)

    return LoanApplication(
        id=app_id,
        fullName=full_name,
        dateOfBirth=dob,
        gender=gender,
        panNumber=_gen_pan(),
        aadhaarLast4=str(_rand_int(1000, 9999)),
        phone=_gen_phone(),
        employmentType=emp_type,
        employerName=employer,
        monthlyIncome=monthly_income,
        yearsAtCurrentJob=years_job,
        residentialStatus=res_status,
        cityTier=city_tier,
        yearsAtCurrentAddress=years_address,
        existingEMIs=existing_emis,
        numberOfExistingLoans=num_loans,
        creditCardOutstanding=cc_outstanding,
        loanPurpose=purpose,
        requestedAmount=requested,
        requestedTenureMonths=tenure,
        avgMonthlyBalance=avg_balance,
        numberOfBounces=bounces,
        salaryDayVariance=salary_var
    )


_queue_counter = 0

async def queue_new_application():
    global _queue_counter
    _queue_counter += 1
    queue_num = f"Q#{_queue_counter:04d}"

    app = generate_application(state.risk_dist)
    record_tag = f"TAG-{app.id}-{app.employmentType[:3].upper()}-{app.cityTier.upper()}"
    priority = "VIP" if app.requestedAmount >= 400000 else ("EXPEDITED" if app.requestedAmount >= 200000 else "STANDARD")
    tags = [queue_num, app.employmentType, app.cityTier, f"INR {int(app.requestedAmount/1000)}k", f"Priority: {priority}", "Zero-Cache Isolated"]

    scratchpad = {
        "id": f"SP-{app.id}-{int(time.time() * 1000) % 100000}",
        "recordTag": record_tag,
        "queueNumber": queue_num,
        "isolatedAt": int(time.time() * 1000),
        "status": "INITIALIZED",
        "isolationMode": "STRICT_PER_CUSTOMER",
        "agentNotes": {}
    }

    agents = []
    for name in orchestrator.ALL_AGENTS:
        agents.append({
            "name": name,
            "status": "PENDING",
            "elapsedMs": 0,
            "output": [],
            "cacheHit": False,
            "isolated": True,
            "scratchpadId": scratchpad["id"],
            "recordTag": record_tag
        })

    req = {
        "id": app.id,
        "app": app.model_dump(),
        "queueNumber": queue_num,
        "recordTag": record_tag,
        "priority": priority,
        "tags": tags,
        "scratchpad": scratchpad,
        "status": "QUEUED",
        "agents": agents,
        "currentAgentIndex": -1,
        "routing": None,
        "memoryMatches": [],
        "queuedAt": int(time.time() * 1000),
        "phase": 0,
        "phaseTimer": 0
    }

    state.requests[req["id"]] = req
    await state.queue.put(req["id"])
    await state.broadcast()
    return req["id"]

async def generator_loop():
    while True:
        if not state.is_running:
            await asyncio.sleep(0.5)
            continue

        ms = (60.0 / max(state.rate, 1))
        await asyncio.sleep(ms)

        if not state.is_running:
            continue

        await queue_new_application()

def start_simulation():
    asyncio.create_task(generator_loop())
