from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Secret - in production, use a secure secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    MANAGER = "manager"
    EMPLOYEE = "employee"

class MembershipType(str, Enum):
    ONE_DAY = "1_day"
    SIX_MONTH = "6_month"

class RoomType(str, Enum):
    LOCKER = "locker"
    SMALL_ROOM = "small_room"
    REGULAR_ROOM = "regular_room"
    DELUXE_ROOM = "deluxe_room"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: UserRole
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    username: str
    password: str

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    id_number: str
    date_of_birth: str
    id_expiration_date: str
    state_of_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: str = ""
    is_banned: bool = False

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    id_number: str
    date_of_birth: str
    id_expiration_date: str
    state_of_id: str

class CheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    employee_id: str
    membership_type: MembershipType
    room_type: RoomType
    room_number: int
    check_in_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    check_out_time: Optional[datetime] = None
    total_amount: float
    membership_fee: float
    room_fee: float
    is_weekend: bool
    session_count: int = 1  # Track session number for the day

class Room(BaseModel):
    number: int
    type: RoomType
    is_occupied: bool = False
    occupied_by: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=8)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_room_pricing(room_type: RoomType, is_weekend: bool) -> float:
    pricing = {
        RoomType.LOCKER: {"weekday": 25, "weekend": 28},
        RoomType.SMALL_ROOM: {"weekday": 33, "weekend": 36},
        RoomType.REGULAR_ROOM: {"weekday": 40, "weekend": 45},
        RoomType.DELUXE_ROOM: {"weekday": 45, "weekend": 50}
    }
    
    return pricing[room_type]["weekend" if is_weekend else "weekday"]

def get_membership_fee(membership_type: MembershipType) -> float:
    return 10 if membership_type == MembershipType.ONE_DAY else 25

def is_weekend_day() -> bool:
    return datetime.now().weekday() >= 5  # Saturday = 5, Sunday = 6

def get_available_rooms(room_type: RoomType) -> List[int]:
    room_ranges = {
        RoomType.LOCKER: list(range(40, 154)),  # 40-153
        RoomType.SMALL_ROOM: list(range(7, 25)),  # 7-24
        RoomType.REGULAR_ROOM: list(range(1, 7)) + list(range(25, 33)),  # 1-6 & 25-32
        RoomType.DELUXE_ROOM: list(range(34, 40))  # 34-39
    }
    return room_ranges.get(room_type, [])

# Initialize default admin user
async def create_default_admin():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": hash_password("admin123"),
            "role": UserRole.MANAGER,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_user)
        print("Default admin user created - username: admin, password: admin123")

# Routes
@api_router.post("/login")
async def login(user_login: UserLogin):
    user_doc = await db.users.find_one({"username": user_login.username})
    if not user_doc or not verify_password(user_login.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["id"], user_doc["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc["id"],
            "username": user_doc["username"],
            "role": user_doc["role"]
        }
    }

@api_router.post("/users", response_model=User)
async def create_user(user_create: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can create users")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_create.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user_create.username,
        "password": hash_password(user_create.password),
        "role": user_create.role,
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    return User(**{k: v for k, v in user_doc.items() if k != "password"})

@api_router.get("/customers", response_model=List[Customer])
async def search_customers(q: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if q:
        # Search by first name, last name, or ID number
        query = {
            "$or": [
                {"first_name": {"$regex": q, "$options": "i"}},
                {"last_name": {"$regex": q, "$options": "i"}},
                {"id_number": {"$regex": q, "$options": "i"}}
            ]
        }
        customers = await db.customers.find(query).to_list(50)
    else:
        customers = await db.customers.find().limit(50).to_list(50)
    
    return [Customer(**customer) for customer in customers]

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_create: CustomerCreate, current_user: User = Depends(get_current_user)):
    # Check if customer with same ID number already exists
    existing_customer = await db.customers.find_one({"id_number": customer_create.id_number})
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer with this ID number already exists")
    
    customer_doc = customer_create.dict()
    customer_doc["id"] = str(uuid.uuid4())
    customer_doc["created_at"] = datetime.now(timezone.utc)
    customer_doc["notes"] = ""
    customer_doc["is_banned"] = False
    
    await db.customers.insert_one(customer_doc)
    return Customer(**customer_doc)

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

@api_router.put("/customers/{customer_id}/notes")
async def update_customer_notes(customer_id: str, notes: dict, current_user: User = Depends(get_current_user)):
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": {"notes": notes.get("notes", "")}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Notes updated successfully"}

@api_router.put("/customers/{customer_id}/ban")
async def ban_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can ban customers")
    
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": {"is_banned": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer banned successfully"}

@api_router.get("/rooms/available/{room_type}")
async def get_available_rooms_for_type(room_type: RoomType, current_user: User = Depends(get_current_user)):
    # Get all rooms of this type
    all_rooms = get_available_rooms(room_type)
    
    # Get occupied rooms
    occupied_rooms = await db.check_ins.find({
        "room_type": room_type,
        "check_out_time": None
    }).to_list(1000)
    
    occupied_numbers = [checkin["room_number"] for checkin in occupied_rooms]
    available_rooms = [room for room in all_rooms if room not in occupied_numbers]
    
    # Add room details with proper labels
    room_details = []
    for room_num in available_rooms:
        if room_type == RoomType.LOCKER:
            label = f"Locker #{room_num}"
            color = "blue"
        elif room_type == RoomType.SMALL_ROOM:
            label = f"Small Room #{room_num} (No TV)"
            color = "green"
        elif room_type == RoomType.REGULAR_ROOM:
            label = f"Changing Room #{room_num} (With TV)"
            color = "purple"
        elif room_type == RoomType.DELUXE_ROOM:
            label = f"Deluxe Room #{room_num} (With TV)"
            color = "gold"
        
        room_details.append({
            "number": room_num,
            "label": label,
            "color": color,
            "type": room_type
        })
    
    return {"available_rooms": available_rooms, "room_details": room_details}

@api_router.post("/checkin", response_model=CheckIn)
async def check_in_customer(checkin_data: dict, current_user: User = Depends(get_current_user)):
    customer_id = checkin_data["customer_id"]
    room_type = RoomType(checkin_data["room_type"])
    membership_type = MembershipType(checkin_data["membership_type"])
    room_number = checkin_data["room_number"]
    
    # Check if customer exists and is not banned
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.get("is_banned", False):
        raise HTTPException(status_code=403, detail="Customer is banned")
    
    # Check if room is available
    existing_checkin = await db.check_ins.find_one({
        "room_number": room_number,
        "room_type": room_type,
        "check_out_time": None
    })
    if existing_checkin:
        raise HTTPException(status_code=400, detail="Room is already occupied")
    
    # Check customer's session count for today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_checkins = await db.check_ins.find({
        "customer_id": customer_id,
        "check_in_time": {"$gte": today_start}
    }).to_list(1000)
    
    if len(today_checkins) >= 3:
        raise HTTPException(status_code=400, detail="Customer has reached maximum 3 sessions for today")
    
    # Calculate pricing
    is_weekend = is_weekend_day()
    room_fee = get_room_pricing(room_type, is_weekend)
    membership_fee = get_membership_fee(membership_type)
    total_amount = room_fee + membership_fee
    
    # Create check-in record
    checkin_doc = {
        "id": str(uuid.uuid4()),
        "customer_id": customer_id,
        "employee_id": current_user.id,
        "membership_type": membership_type,
        "room_type": room_type,
        "room_number": room_number,
        "check_in_time": datetime.now(timezone.utc),
        "check_out_time": None,
        "total_amount": total_amount,
        "membership_fee": membership_fee,
        "room_fee": room_fee,
        "is_weekend": is_weekend,
        "session_count": len(today_checkins) + 1
    }
    
    await db.check_ins.insert_one(checkin_doc)
    return CheckIn(**checkin_doc)

@api_router.put("/checkin/{checkin_id}/checkout")
async def check_out_customer(checkin_id: str, current_user: User = Depends(get_current_user)):
    checkin = await db.check_ins.find_one({"id": checkin_id})
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in record not found")
    
    if checkin["check_out_time"]:
        raise HTTPException(status_code=400, detail="Customer already checked out")
    
    # Update check-out time
    checkout_time = datetime.now(timezone.utc)
    await db.check_ins.update_one(
        {"id": checkin_id},
        {"$set": {"check_out_time": checkout_time}}
    )
    
    return {"message": "Customer checked out successfully", "checkout_time": checkout_time}

@api_router.get("/checkins/active", response_model=List[dict])
async def get_active_checkins(current_user: User = Depends(get_current_user)):
    active_checkins = await db.check_ins.find({"check_out_time": None}).to_list(1000)
    
    # Enrich with customer data
    result = []
    for checkin in active_checkins:
        customer = await db.customers.find_one({"id": checkin["customer_id"]})
        employee = await db.users.find_one({"id": checkin["employee_id"]})
        
        checkin_info = CheckIn(**checkin).dict()
        checkin_info["customer"] = Customer(**customer).dict() if customer else None
        checkin_info["employee"] = employee["username"] if employee else "Unknown"
        
        # Calculate remaining time (8 hours from check-in)
        check_in_time = checkin["check_in_time"]
        if isinstance(check_in_time, str):
            check_in_time = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
        elif isinstance(check_in_time, datetime) and check_in_time.tzinfo is None:
            check_in_time = check_in_time.replace(tzinfo=timezone.utc)
        
        eight_hours_later = check_in_time + timedelta(hours=8)
        remaining_time = eight_hours_later - datetime.now(timezone.utc)
        checkin_info["remaining_hours"] = max(0, remaining_time.total_seconds() / 3600)
        checkin_info["is_overtime"] = remaining_time.total_seconds() < 0
        
        result.append(checkin_info)
    
    return result

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can view users")
    
    users = await db.users.find({}).to_list(1000)
    return [User(**{k: v for k, v in user.items() if k != "password"}) for user in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can delete users")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@api_router.get("/reports/daily-sales")
async def get_daily_sales_report(date: str = None, current_user: User = Depends(get_current_user)):
    # If no date provided, use today
    if not date:
        date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Parse the date and get start/end of day
    report_date = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
    start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = report_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get all check-ins for the day
    checkins = await db.check_ins.find({
        "check_in_time": {
            "$gte": start_of_day,
            "$lte": end_of_day
        }
    }).to_list(1000)
    
    # Get all transactions (would be added to payment system)
    # For now, we'll calculate from check-ins
    
    total_revenue = sum(checkin.get("total_amount", 0) for checkin in checkins)
    total_checkins = len(checkins)
    
    # Breakdown by room type
    room_breakdown = {}
    membership_breakdown = {}
    employee_breakdown = {}
    
    for checkin in checkins:
        room_type = checkin.get("room_type", "unknown")
        membership_type = checkin.get("membership_type", "unknown")
        employee_id = checkin.get("employee_id")
        
        # Room type breakdown
        if room_type not in room_breakdown:
            room_breakdown[room_type] = {"count": 0, "revenue": 0}
        room_breakdown[room_type]["count"] += 1
        room_breakdown[room_type]["revenue"] += checkin.get("total_amount", 0)
        
        # Membership breakdown
        if membership_type not in membership_breakdown:
            membership_breakdown[membership_type] = {"count": 0, "revenue": 0}
        membership_breakdown[membership_type]["count"] += 1
        membership_breakdown[membership_type]["revenue"] += checkin.get("total_amount", 0)
        
        # Employee breakdown
        if employee_id:
            if employee_id not in employee_breakdown:
                employee_breakdown[employee_id] = {"count": 0, "revenue": 0}
            employee_breakdown[employee_id]["count"] += 1
            employee_breakdown[employee_id]["revenue"] += checkin.get("total_amount", 0)
    
    # Get employee names
    employee_names = {}
    for emp_id in employee_breakdown.keys():
        employee = await db.users.find_one({"id": emp_id})
        employee_names[emp_id] = employee["username"] if employee else "Unknown"
    
    return {
        "date": date,
        "total_revenue": total_revenue,
        "total_checkins": total_checkins,
        "average_per_checkin": total_revenue / total_checkins if total_checkins > 0 else 0,
        "room_breakdown": room_breakdown,
        "membership_breakdown": membership_breakdown,
        "employee_breakdown": employee_breakdown,
        "employee_names": employee_names,
        "checkins": checkins
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await create_default_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()