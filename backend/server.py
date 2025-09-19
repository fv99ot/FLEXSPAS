from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
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
    assigned_locker_number: Optional[str] = None
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
    unpaid_overtime_hours: float = 0.0  # Track unpaid overtime hours
    unpaid_overtime_amount: float = 0.0  # Track unpaid overtime fees ($20/hour)

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
    payment_method: str = "cash"  # "cash" or "card"

class Room(BaseModel):
    number: int
    type: RoomType
    is_occupied: bool = False
    occupied_by: Optional[str] = None

# Pricing Models
class PricingConfig(BaseModel):
    locker_weekday: float = 25.0
    locker_weekend: float = 28.0
    small_room_weekday: float = 33.0
    small_room_weekend: float = 36.0
    regular_room_weekday: float = 40.0
    regular_room_weekend: float = 45.0
    deluxe_room_weekday: float = 45.0
    deluxe_room_weekend: float = 50.0

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
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_pricing_config() -> PricingConfig:
    """Get current pricing configuration from database"""
    pricing_doc = await db.pricing_config.find_one({})
    if pricing_doc:
        return PricingConfig(**{k: v for k, v in pricing_doc.items() if k != "_id"})
    else:
        # Return default pricing if none exists
        default_pricing = PricingConfig()
        # Save default pricing to database
        await db.pricing_config.insert_one(default_pricing.dict())
        return default_pricing

async def get_room_pricing(room_type: RoomType, is_weekend: bool) -> float:
    """Get room pricing based on type and weekend status"""
    pricing_config = await get_pricing_config()
    
    pricing_map = {
        RoomType.LOCKER: pricing_config.locker_weekend if is_weekend else pricing_config.locker_weekday,
        RoomType.SMALL_ROOM: pricing_config.small_room_weekend if is_weekend else pricing_config.small_room_weekday,
        RoomType.REGULAR_ROOM: pricing_config.regular_room_weekend if is_weekend else pricing_config.regular_room_weekday,
        RoomType.DELUXE_ROOM: pricing_config.deluxe_room_weekend if is_weekend else pricing_config.deluxe_room_weekday,
    }
    
    return pricing_map[room_type]

def is_weekend_time() -> bool:
    """Check if current time falls within weekend pricing period:
    Weekend: Friday 4pm - Monday 12am
    Weekday: Monday 12am - Friday 4pm"""
    now = datetime.now(timezone.utc)
    weekday = now.weekday()  # Monday = 0, Sunday = 6
    hour = now.hour
    
    # Friday (4) at 4pm or later
    if weekday == 4 and hour >= 16:
        return True
    # Saturday (5) or Sunday (6) - all day
    elif weekday in [5, 6]:
        return True
    # Monday through Thursday - weekday pricing
    elif weekday < 4:
        return False
    # Friday before 4pm - weekday pricing
    elif weekday == 4 and hour < 16:
        return False
    
    return False

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

# Pending Customer Model
class PendingCustomer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    id_number: str
    date_of_birth: str
    id_expiration_date: str
    state_of_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # pending, approved, rejected

class PendingCustomerCreate(BaseModel):
    first_name: str
    last_name: str
    id_number: str
    date_of_birth: str
    id_expiration_date: str
    state_of_id: str

# Pending Customers Management
@api_router.get("/pending-customers", response_model=List[PendingCustomer])
async def get_pending_customers(current_user: User = Depends(get_current_user)):
    pending = await db.pending_customers.find({"status": "pending"}).to_list(1000)
    return [PendingCustomer(**customer) for customer in pending]

@api_router.post("/customers/public", response_model=PendingCustomer)
@api_router.post("/customers/public", response_model=PendingCustomer)
async def create_pending_customer_public(customer_create: PendingCustomerCreate):
    """Public endpoint for QR code form submissions - creates pending customer for approval"""
    # Check if customer with same ID number already exists in approved or pending
    existing_customer = await db.customers.find_one({"id_number": customer_create.id_number})
    existing_pending = await db.pending_customers.find_one({"id_number": customer_create.id_number, "status": "pending"})
    
    if existing_customer:
        raise HTTPException(status_code=400, detail="Customer with this ID number already exists")
    if existing_pending:
        raise HTTPException(status_code=400, detail="Application with this ID number is already pending approval")
    
    pending_doc = customer_create.dict()
    pending_doc["id"] = str(uuid.uuid4())
    pending_doc["created_at"] = datetime.now(timezone.utc)
    pending_doc["status"] = "pending"
    
    await db.pending_customers.insert_one(pending_doc)
    return PendingCustomer(**pending_doc)

@api_router.post("/pending-customers/{customer_id}/approve", response_model=Customer)
async def approve_pending_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    """Approve a pending customer and move to main customer list"""
    pending = await db.pending_customers.find_one({"id": customer_id, "status": "pending"})
    if not pending:
        raise HTTPException(status_code=404, detail="Pending customer not found")
    
    # Create approved customer
    customer_doc = {
        "id": str(uuid.uuid4()),
        "first_name": pending["first_name"],
        "last_name": pending["last_name"],
        "id_number": pending["id_number"],
        "date_of_birth": pending["date_of_birth"],
        "id_expiration_date": pending["id_expiration_date"],
        "state_of_id": pending["state_of_id"],
        "created_at": datetime.now(timezone.utc),
        "notes": f"Approved by {current_user.username} on {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "is_banned": False
    }
    
    await db.customers.insert_one(customer_doc)
    
    # Mark pending as approved
    await db.pending_customers.update_one(
        {"id": customer_id},
        {"$set": {"status": "approved"}}
    )
    
    return Customer(**customer_doc)

@api_router.delete("/pending-customers/{customer_id}")
async def reject_pending_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    """Reject a pending customer application"""
    result = await db.pending_customers.update_one(
        {"id": customer_id, "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending customer not found")
    return {"message": "Customer application rejected"}

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

# Duplicate endpoint removed - using the one at line 626 instead

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
    membership_type = checkin_data.get("membership_type")
    room_type = checkin_data["room_type"]
    room_number = checkin_data["room_number"]
    
    # Check if customer exists and is not banned
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if customer.get("is_banned", False):
        raise HTTPException(status_code=403, detail="Customer is banned")
    
    # Check if customer has unpaid overtime fees
    unpaid_overtime = customer.get("unpaid_overtime_amount", 0.0)
    if unpaid_overtime > 0:
        raise HTTPException(
            status_code=402, 
            detail=f"Customer has unpaid overtime fees of ${unpaid_overtime:.2f}. Must pay before checking in again."
        )
    
    # Check for valid existing membership
    membership_status = None
    if membership_type == "6_month":
        # Check if customer already has valid 6-month membership
        recent_checkin = await db.check_ins.find_one(
            {
                "customer_id": customer_id,
                "membership_type": "6_month",
                "check_in_time": {"$ne": None}
            },
            sort=[("check_in_time", -1)]
        )
        
        if recent_checkin:
            check_in_time = recent_checkin["check_in_time"]
            if isinstance(check_in_time, str):
                check_in_time = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
            elif isinstance(check_in_time, datetime) and check_in_time.tzinfo is None:
                check_in_time = check_in_time.replace(tzinfo=timezone.utc)
            
            expiration_date = check_in_time + timedelta(days=180)
            current_time = datetime.now(timezone.utc)
            
            if current_time < expiration_date:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Customer already has valid 6-month membership until {expiration_date.strftime('%Y-%m-%d')}. No need to purchase another membership."
                )
    
    # If no membership_type provided, check if customer has valid membership
    if not membership_type:
        recent_checkin = await db.check_ins.find_one(
            {
                "customer_id": customer_id,
                "membership_type": "6_month",
                "check_in_time": {"$ne": None}
            },
            sort=[("check_in_time", -1)]
        )
        
        if recent_checkin:
            check_in_time = recent_checkin["check_in_time"]
            if isinstance(check_in_time, str):
                check_in_time = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
            elif isinstance(check_in_time, datetime) and check_in_time.tzinfo is None:
                check_in_time = check_in_time.replace(tzinfo=timezone.utc)
            
            expiration_date = check_in_time + timedelta(days=180)
            current_time = datetime.now(timezone.utc)
            
            if current_time < expiration_date:
                # Customer has valid membership, use it
                membership_type = "6_month"
                membership_status = {
                    "using_existing": True,
                    "expiration_date": expiration_date
                }
        
        if not membership_type:
            raise HTTPException(status_code=400, detail="Customer has no valid membership. Must purchase membership to check in.")
    
    # Check for active check-in
    existing_checkin = await db.check_ins.find_one({"customer_id": customer_id, "check_out_time": None})
    if existing_checkin:
        raise HTTPException(status_code=400, detail="Customer is already checked in")
    
    # Check if room is available
    room_checkin = await db.check_ins.find_one({
        "room_number": room_number,
        "room_type": room_type,
        "check_out_time": None
    })
    if room_checkin:
        raise HTTPException(status_code=400, detail="Room is already occupied")
    
    # Check if locker is assigned to an employee (only for lockers)
    if room_type == "locker":
        assigned_locker = await db.users.find_one({
            "assigned_locker_number": str(room_number)
        })
        if assigned_locker:
            raise HTTPException(status_code=400, detail=f"Locker {room_number} is assigned to employee {assigned_locker['username']}")
    
    # Check session limits for the day
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_checkins = await db.check_ins.find({
        "customer_id": customer_id,
        "check_in_time": {"$gte": today_start}
    }).to_list(None)
    
    if len(today_checkins) >= 3:
        raise HTTPException(status_code=400, detail="Customer has reached maximum 3 sessions for today")
    
    # Calculate costs
    is_weekend = is_weekend_time()
    membership_fee = 0 if membership_status and membership_status.get("using_existing") else get_membership_fee(MembershipType(membership_type))
    room_fee = await get_room_pricing(RoomType(room_type), is_weekend)
    total_amount = membership_fee + room_fee
    
    # Create check-in record
    checkin_doc = {
        "id": str(uuid.uuid4()),
        "customer_id": customer_id,
        "employee_id": current_user.id,
        "membership_type": membership_type,
        "room_type": room_type,
        "room_number": room_number,
        "check_in_time": datetime.now(timezone.utc),
        "total_amount": total_amount,
        "membership_fee": membership_fee,
        "room_fee": room_fee,
        "is_weekend": is_weekend,
        "session_count": len(today_checkins) + 1,
        "payment_method": "cash"
    }
    
    await db.check_ins.insert_one(checkin_doc)
    
    response_data = CheckIn(**checkin_doc).dict()
    if membership_status:
        response_data["membership_status"] = membership_status
    
    return response_data

@api_router.put("/checkin/{checkin_id}/checkout")
async def check_out_customer(checkin_id: str, current_user: User = Depends(get_current_user)):
    checkin = await db.check_ins.find_one({"id": checkin_id})
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in record not found")
    
    if checkin.get("check_out_time"):
        raise HTTPException(status_code=400, detail="Customer already checked out")
    
    # Calculate overtime if applicable
    checkout_time = datetime.now(timezone.utc)
    check_in_time = checkin["check_in_time"]
    
    # Ensure check_in_time is timezone-aware
    if isinstance(check_in_time, str):
        check_in_time = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
    elif isinstance(check_in_time, datetime) and check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)
    
    # Calculate session duration and overtime
    session_duration = checkout_time - check_in_time
    allowed_duration = timedelta(hours=8)
    
    overtime_hours = 0.0
    overtime_amount = 0.0
    
    if session_duration > allowed_duration:
        overtime_delta = session_duration - allowed_duration
        overtime_hours_exact = overtime_delta.total_seconds() / 3600  # Exact overtime hours
        overtime_hours_billed = math.ceil(overtime_hours_exact)  # Round up to nearest full hour
        overtime_amount = overtime_hours_billed * 20.0  # $20 per full hour
        
        # Update customer's unpaid overtime
        customer_id = checkin["customer_id"]
        await db.customers.update_one(
            {"id": customer_id},
            {
                "$inc": {
                    "unpaid_overtime_hours": overtime_hours_billed,  # Store billed hours, not exact
                    "unpaid_overtime_amount": overtime_amount
                }
            }
        )
    
    # Update check-out time
    await db.check_ins.update_one(
        {"id": checkin_id},
        {"$set": {"check_out_time": checkout_time}}
    )
    
    result = {
        "message": "Customer checked out successfully", 
        "checkout_time": checkout_time,
        "session_duration_hours": session_duration.total_seconds() / 3600,
        "overtime_hours": overtime_hours_billed if session_duration > allowed_duration else 0.0,
        "overtime_amount": overtime_amount if session_duration > allowed_duration else 0.0
    }
    
    return result

@api_router.post("/customers/{customer_id}/pay-overtime")
async def pay_overtime_fees(customer_id: str, payment_data: dict, current_user: User = Depends(get_current_user)):
    """Pay customer's outstanding overtime fees"""
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    unpaid_amount = customer.get("unpaid_overtime_amount", 0.0)
    if unpaid_amount <= 0:
        raise HTTPException(status_code=400, detail="No outstanding overtime fees")
    
    payment_method = payment_data.get("payment_method", "cash")  # "cash" or "card"
    
    # Clear the overtime debt
    await db.customers.update_one(
        {"id": customer_id},
        {
            "$set": {
                "unpaid_overtime_hours": 0.0,
                "unpaid_overtime_amount": 0.0
            }
        }
    )
    
    return {
        "message": "Overtime fees paid successfully",
        "amount_paid": unpaid_amount,
        "payment_method": payment_method
    }

@api_router.put("/users/me/password")
async def change_my_password(password_data: dict, current_user: User = Depends(get_current_user)):
    """Change current user's own password"""
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new passwords are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
    
    # Verify current password
    user = await db.users.find_one({"id": current_user.id})
    if not user or not bcrypt.checkpw(current_password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash the new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update the password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": "Your password has been updated successfully"}

@api_router.put("/users/{user_id}/password")
async def change_user_password(user_id: str, password_data: dict, current_user: User = Depends(get_current_user)):
    """Change password for a user (managers can change any user's password, users can change their own)"""
    new_password = password_data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Check permissions
    if current_user.role != UserRole.MANAGER and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Only managers can change other users' passwords")
    
    # Find the user
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash the new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update the password
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password": hashed_password}}
    )
    
    return {"message": f"Password updated successfully for {user['username']}"}

@api_router.put("/customers/{customer_id}/notes")
async def update_customer_notes(customer_id: str, notes_data: dict, current_user: User = Depends(get_current_user)):
    """Update customer notes"""
    notes = notes_data.get("notes", "").strip()
    
    # Find the customer
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update the notes
    await db.customers.update_one(
        {"id": customer_id},
        {"$set": {"notes": notes}}
    )
    
    return {"message": "Customer notes updated successfully", "notes": notes}

@api_router.get("/customers/{customer_id}/membership-status")
async def get_customer_membership_status(customer_id: str, current_user: User = Depends(get_current_user)):
    """Check if customer has a valid (non-expired) membership"""
    
    # Get customer's most recent check-in with 6-month membership
    recent_checkin = await db.check_ins.find_one(
        {
            "customer_id": customer_id,
            "membership_type": "6_month",
            "check_in_time": {"$ne": None}
        },
        sort=[("check_in_time", -1)]
    )
    
    if not recent_checkin:
        return {
            "has_valid_membership": False,
            "membership_type": None,
            "expiration_date": None,
            "days_remaining": 0
        }
    
    # Calculate expiration date (6 months from last 6-month membership purchase)
    check_in_time = recent_checkin["check_in_time"]
    if isinstance(check_in_time, str):
        check_in_time = datetime.fromisoformat(check_in_time.replace('Z', '+00:00'))
    elif isinstance(check_in_time, datetime) and check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)
    
    expiration_date = check_in_time + timedelta(days=180)  # 6 months
    current_time = datetime.now(timezone.utc)
    
    is_valid = current_time < expiration_date
    days_remaining = (expiration_date - current_time).days if is_valid else 0
    
    return {
        "has_valid_membership": is_valid,
        "membership_type": "6_month" if is_valid else None,
        "expiration_date": expiration_date,
        "days_remaining": days_remaining,
        "last_membership_date": check_in_time
    }

@api_router.get("/customers/{customer_id}/profile")
async def get_customer_profile(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed customer profile with visit history"""
    # Get customer info
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer's check-in history (last 10 visits)
    checkins = await db.check_ins.find({
        "customer_id": customer_id,
        "check_out_time": {"$ne": None}  # Only completed visits
    }).sort("check_in_time", -1).limit(10).to_list(10)
    
    # Process check-in history
    visit_history = []
    last_visit = None
    
    for checkin in checkins:
        visit_info = {
            "date": checkin["check_in_time"],
            "room_type": checkin["room_type"],
            "room_number": checkin["room_number"],
            "membership_type": checkin["membership_type"],
            "total_amount": checkin["total_amount"],
            "check_out_time": checkin.get("check_out_time")
        }
        visit_history.append(visit_info)
        
        if not last_visit or checkin["check_in_time"] > last_visit:
            last_visit = checkin["check_in_time"]
    
    # Calculate membership expiration based on last visit and type
    membership_expiration = None
    if visit_history:
        last_checkin = visit_history[0]
        membership_type = last_checkin["membership_type"]
        last_visit_date = last_checkin["date"]
        
        if isinstance(last_visit_date, str):
            last_visit_date = datetime.fromisoformat(last_visit_date.replace('Z', '+00:00'))
        elif isinstance(last_visit_date, datetime) and last_visit_date.tzinfo is None:
            last_visit_date = last_visit_date.replace(tzinfo=timezone.utc)
        
        if membership_type == "6_month":
            membership_expiration = last_visit_date + timedelta(days=180)
        elif membership_type == "1_day":
            membership_expiration = last_visit_date + timedelta(days=1)
    
    return {
        "customer": Customer(**customer).dict(),
        "last_visit": last_visit,
        "membership_expiration": membership_expiration,
        "visit_history": visit_history,
        "total_visits": len(visit_history)
    }

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

# Pricing Update Model
class PricingUpdate(BaseModel):
    locker_weekday: Optional[float] = None
    locker_weekend: Optional[float] = None
    small_room_weekday: Optional[float] = None
    small_room_weekend: Optional[float] = None
    regular_room_weekday: Optional[float] = None
    regular_room_weekend: Optional[float] = None
    deluxe_room_weekday: Optional[float] = None
    deluxe_room_weekend: Optional[float] = None

class LockerAssignment(BaseModel):
    locker_number: str

# Transaction Models
class TransactionItem(BaseModel):
    name: str
    price: float
    quantity: int = 1

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    transaction_type: str  # 'checkin', 'renewal', 'membership', 'standalone', 'refund'
    items: List[TransactionItem] = []
    subtotal: float = 0.0
    discount_name: Optional[str] = None
    discount_amount: float = 0.0
    total_amount: float = 0.0
    payment_method: str  # 'cash', 'card'
    checkin_id: Optional[str] = None
    membership_type: Optional[str] = None
    is_refund: bool = False
    original_transaction_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

@api_router.put("/users/{user_id}/assign-locker")
async def assign_locker_to_employee(user_id: str, assignment: LockerAssignment, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can assign lockers")
    
    locker_number = assignment.locker_number
    
    # Check if user exists and is an employee
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] != UserRole.EMPLOYEE:
        raise HTTPException(status_code=400, detail="Can only assign lockers to employees")
    
    # Check if the locker is available (not occupied by a customer check-in)
    occupied_locker = await db.check_ins.find_one({
        "room_number": locker_number,
        "room_type": "locker",
        "check_out_time": None
    })
    if occupied_locker:
        raise HTTPException(status_code=400, detail="Locker is currently occupied by a customer")
    
    # Check if locker is already assigned to another employee
    existing_assignment = await db.users.find_one({
        "assigned_locker_number": locker_number,
        "id": {"$ne": user_id}
    })
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Locker is already assigned to another employee")
    
    # Update user with assigned locker
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"assigned_locker_number": locker_number}}
    )
    
    return {"message": f"Locker {locker_number} assigned to employee successfully"}

@api_router.delete("/users/{user_id}/assign-locker")
async def unassign_locker_from_employee(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can unassign lockers")
    
    # Check if user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user to remove assigned locker
    await db.users.update_one(
        {"id": user_id},
        {"$unset": {"assigned_locker_number": ""}}
    )
    
    return {"message": "Locker unassigned from employee successfully"}

@api_router.get("/users/assigned-lockers")
async def get_assigned_lockers(current_user: User = Depends(get_current_user)):
    # Get all users with assigned lockers
    users_with_lockers = await db.users.find({
        "assigned_locker_number": {"$exists": True, "$ne": None}
    }).to_list(1000)
    
    assigned_lockers = {}
    for user in users_with_lockers:
        assigned_lockers[user["assigned_locker_number"]] = {
            "employee_username": user["username"],
            "employee_id": user["id"]
        }
    
    return assigned_lockers

@api_router.get("/pricing", response_model=PricingConfig)
async def get_pricing(current_user: User = Depends(get_current_user)):
    """Get current pricing configuration"""
    return await get_pricing_config()

@api_router.put("/pricing")
async def update_pricing(pricing_update: PricingUpdate, current_user: User = Depends(get_current_user)):
    """Update pricing configuration (manager only)"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can update pricing")
    
    # Get current pricing
    current_pricing = await get_pricing_config()
    
    # Update only provided fields
    update_data = {}
    for field, value in pricing_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    if update_data:
        # Update in database
        await db.pricing_config.update_one(
            {},
            {"$set": update_data},
            upsert=True
        )
    
    return {"message": "Pricing updated successfully", "updated_fields": list(update_data.keys())}

@api_router.put("/checkin/{checkin_id}/renew")
async def renew_session(checkin_id: str, current_user: User = Depends(get_current_user)):
    """Renew a customer's session - restarts 8-hour timer from current time"""
    # Find the active check-in
    checkin = await db.check_ins.find_one({"id": checkin_id, "check_out_time": None})
    if not checkin:
        raise HTTPException(status_code=404, detail="Active check-in not found")
    
    # Get current pricing
    is_weekend = is_weekend_time()
    room_fee = await get_room_pricing(RoomType(checkin["room_type"]), is_weekend)
    
    # Update check-in time to current time (restarts the 8-hour timer)
    renewal_time = datetime.now(timezone.utc)
    
    await db.check_ins.update_one(
        {"id": checkin_id},
        {
            "$set": {
                "check_in_time": renewal_time,
                "renewed_at": renewal_time,
                "renewal_count": checkin.get("renewal_count", 0) + 1
            }
        }
    )
    
    return {
        "message": "Session renewed successfully",
        "new_check_in_time": renewal_time,
        "new_checkout_time": renewal_time + timedelta(hours=8),
        "room_fee": room_fee,
        "renewal_count": checkin.get("renewal_count", 0) + 1
    }

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: Transaction, current_user: User = Depends(get_current_user)):
    """Create a new transaction record"""
    transaction_dict = transaction_data.dict()
    
    # Auto-populate created_by if not provided
    if not transaction_dict.get("created_by"):
        transaction_dict["created_by"] = current_user.id
    
    await db.transactions.insert_one(transaction_dict)
    return transaction_data

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 100,
    customer_id: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get transaction history with optional filters"""
    query = {}
    
    if customer_id:
        query["customer_id"] = customer_id
    if transaction_type:
        query["transaction_type"] = transaction_type
    if start_date and end_date:
        query["created_at"] = {
            "$gte": datetime.fromisoformat(start_date),
            "$lte": datetime.fromisoformat(end_date)
        }
    
    transactions = await db.transactions.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Transaction(**tx) for tx in transactions]

@api_router.post("/transactions/{transaction_id}/refund")
async def create_refund(
    transaction_id: str, 
    refund_amount: float, 
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Create a refund for a transaction"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can process refunds")
    
    # Find original transaction
    original_transaction = await db.transactions.find_one({"id": transaction_id})
    if not original_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if refund_amount > original_transaction["total_amount"]:
        raise HTTPException(status_code=400, detail="Refund amount cannot exceed original transaction amount")
    
    # Create refund transaction
    refund_transaction = Transaction(
        customer_id=original_transaction["customer_id"],
        customer_name=original_transaction["customer_name"],
        transaction_type="refund",
        total_amount=-refund_amount,  # Negative amount for refunds
        payment_method=original_transaction["payment_method"],
        is_refund=True,
        original_transaction_id=transaction_id,
        created_by=current_user.id,
        notes=notes
    )
    
    await db.transactions.insert_one(refund_transaction.dict())
    return {"message": "Refund processed successfully", "refund_id": refund_transaction.id}

# Discount System Models
class Discount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    amount: float  # Fixed amount discount (e.g., 25.0 for FREE LOCKER)
    description: Optional[str] = None  # E.g., "FREE LOCKER", "FREE CHANGING ROOM"
    code: Optional[str] = None  # Optional discount code
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiscountCreate(BaseModel):
    name: str
    amount: float
    description: Optional[str] = None
    code: Optional[str] = None

# Waitlist Models
class WaitlistEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    current_room_number: Optional[int] = None  # If customer is currently checked in
    current_room_type: Optional[RoomType] = None  # Current room type
    desired_room_type: RoomType  # What room type they want to upgrade to
    membership_type: MembershipType
    priority: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "waiting"  # waiting, notified, expired

class WaitlistCreate(BaseModel):
    customer_id: str
    current_room_number: Optional[int] = None  # If upgrading from current room
    current_room_type: Optional[RoomType] = None
    desired_room_type: RoomType  # Which waitlist to join
    membership_type: MembershipType

# Upgrade System Models  
class RoomUpgrade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    checkin_id: str
    old_room_type: RoomType
    old_room_number: int
    new_room_type: RoomType
    new_room_number: int
    upgrade_fee: float
    cleaning_fee: float = 5.0
    total_additional_cost: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Additional Items Management
class AdditionalItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    category: str = "general"
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdditionalItemCreate(BaseModel):
    name: str
    price: float
    category: str = "general"

# Additional Items Management
# Discount Management
@api_router.get("/discounts", response_model=List[Discount])
async def get_discounts(current_user: User = Depends(get_current_user)):
    """Get active discounts"""
    discounts = await db.discounts.find({"active": True}).to_list(1000)
    return [Discount(**discount) for discount in discounts]

@api_router.get("/admin/discounts", response_model=List[Discount])
async def get_all_discounts(current_user: User = Depends(get_current_user)):
    """Get all discounts for admin management"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can view all discounts")
    
    discounts = await db.discounts.find().to_list(1000)
    return [Discount(**discount) for discount in discounts]

@api_router.post("/discounts", response_model=Discount)
async def create_discount(discount_create: DiscountCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can create discounts")
    
    discount_doc = discount_create.dict()
    discount_doc["id"] = str(uuid.uuid4())
    discount_doc["active"] = True
    discount_doc["created_at"] = datetime.now(timezone.utc)
    
    await db.discounts.insert_one(discount_doc)
    return Discount(**discount_doc)

@api_router.put("/discounts/{discount_id}/toggle")
async def toggle_discount(discount_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can modify discounts")
    
    discount = await db.discounts.find_one({"id": discount_id})
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    new_status = not discount["active"]
    await db.discounts.update_one({"id": discount_id}, {"$set": {"active": new_status}})
    return {"message": f"Discount {'enabled' if new_status else 'disabled'}"}

@api_router.delete("/discounts/{discount_id}")
async def delete_discount(discount_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can delete discounts")
    
    result = await db.discounts.update_one({"id": discount_id}, {"$set": {"active": False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    return {"message": "Discount deleted successfully"}

# Waitlist Management
@api_router.get("/waitlist")
async def get_waitlist(current_user: User = Depends(get_current_user)):
    """Get waitlist organized by room types"""
    waitlist = await db.waitlist.find({"status": "waiting"}).sort("created_at", 1).to_list(1000)
    
    # Organize waitlist by desired room type
    organized_waitlist = {
        "regular_room": [],
        "small_room": [],
        "deluxe_room": []
    }
    
    for entry in waitlist:
        # Get customer info
        customer = await db.customers.find_one({"id": entry["customer_id"]})
        
        # Clean up the entry data for JSON serialization
        entry_data = {
            "id": entry["id"],
            "customer_id": entry["customer_id"],
            "current_room_number": entry.get("current_room_number"),
            "current_room_type": entry.get("current_room_type"),
            "desired_room_type": entry["desired_room_type"],
            "membership_type": entry["membership_type"],
            "priority": entry.get("priority", 1),
            "created_at": entry["created_at"],
            "status": entry.get("status", "waiting")
        }
        
        # Clean up customer data for JSON serialization
        if customer:
            customer_data = {k: v for k, v in customer.items() if k != "_id"}
            entry_data["customer"] = customer_data
        else:
            entry_data["customer"] = None
        
        # Add to appropriate waitlist
        desired_type = entry.get("desired_room_type", "regular_room")
        if desired_type in organized_waitlist:
            organized_waitlist[desired_type].append(entry_data)
    
    return organized_waitlist

@api_router.post("/waitlist", response_model=WaitlistEntry)
async def add_to_waitlist(waitlist_create: WaitlistCreate, current_user: User = Depends(get_current_user)):
    """Add customer to specific room type waitlist (can be currently checked in)"""
    
    # Check if customer exists
    customer = await db.customers.find_one({"id": waitlist_create.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer is already on this specific waitlist
    existing_waitlist = await db.waitlist.find_one({
        "customer_id": waitlist_create.customer_id,
        "desired_room_type": waitlist_create.desired_room_type,
        "status": "waiting"
    })
    
    if existing_waitlist:
        raise HTTPException(status_code=400, detail=f"Customer already on {waitlist_create.desired_room_type.replace('_', ' ')} waitlist. They can be on multiple different room type waitlists, but not the same one twice.")
    
    # Create waitlist entry
    waitlist_doc = waitlist_create.dict()
    waitlist_doc["id"] = str(uuid.uuid4())
    waitlist_doc["priority"] = 1
    waitlist_doc["created_at"] = datetime.now(timezone.utc)
    waitlist_doc["status"] = "waiting"
    
    await db.waitlist.insert_one(waitlist_doc)
    return WaitlistEntry(**waitlist_doc)

@api_router.delete("/waitlist/{entry_id}")
async def remove_from_waitlist(entry_id: str, current_user: User = Depends(get_current_user)):
    """Remove customer from waitlist"""
    result = await db.waitlist.update_one({"id": entry_id}, {"$set": {"status": "expired"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    return {"message": "Removed from waitlist"}

@api_router.post("/waitlist/add-from-checkin/{checkin_id}")
async def add_current_customer_to_waitlist(checkin_id: str, waitlist_data: dict, current_user: User = Depends(get_current_user)):
    """Add currently checked-in customer to waitlist for better room"""
    
    # Get current check-in info
    checkin = await db.check_ins.find_one({"id": checkin_id, "check_out_time": None})
    if not checkin:
        raise HTTPException(status_code=404, detail="Active check-in not found")
    
    desired_room_type = waitlist_data.get("desired_room_type")
    if not desired_room_type:
        raise HTTPException(status_code=400, detail="Desired room type is required")
    
    # Create waitlist entry with current room info
    waitlist_create = WaitlistCreate(
        customer_id=checkin["customer_id"],
        current_room_number=checkin["room_number"],
        current_room_type=checkin["room_type"],
        desired_room_type=desired_room_type,
        membership_type=checkin["membership_type"]
    )
    
    return await add_to_waitlist(waitlist_create, current_user)

# Room Upgrade System
@api_router.post("/checkin/{checkin_id}/upgrade")
async def upgrade_room(checkin_id: str, upgrade_data: dict, current_user: User = Depends(get_current_user)):
    # Get current check-in
    checkin = await db.check_ins.find_one({"id": checkin_id, "check_out_time": None})
    if not checkin:
        raise HTTPException(status_code=404, detail="Active check-in not found")
    
    new_room_type = upgrade_data["new_room_type"]
    new_room_number = upgrade_data["new_room_number"]
    
    # Check if new room is available
    existing_checkin = await db.check_ins.find_one({
        "room_number": new_room_number,
        "room_type": new_room_type,
        "check_out_time": None
    })
    if existing_checkin:
        raise HTTPException(status_code=400, detail="Room is already occupied")
    
    # Calculate upgrade cost
    is_weekend = is_weekend_time()
    old_room_fee = await get_room_pricing(RoomType(checkin["room_type"]), is_weekend)
    new_room_fee = await get_room_pricing(RoomType(new_room_type), is_weekend)
    upgrade_fee = max(0, new_room_fee - old_room_fee)
    
    # Cleaning fee only applies if customer is upgrading from or to a room (not locker)
    old_is_room = checkin["room_type"] != "locker"  
    new_is_room = new_room_type != "locker"
    cleaning_fee = 5.0 if (old_is_room or new_is_room) else 0
    
    total_additional_cost = upgrade_fee + cleaning_fee
    
    # Create upgrade record
    upgrade_doc = {
        "id": str(uuid.uuid4()),
        "checkin_id": checkin_id,
        "old_room_type": checkin["room_type"],
        "old_room_number": checkin["room_number"],
        "new_room_type": new_room_type,
        "new_room_number": new_room_number,
        "upgrade_fee": upgrade_fee,
        "cleaning_fee": cleaning_fee,
        "total_additional_cost": total_additional_cost,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.room_upgrades.insert_one(upgrade_doc)
    
    # Update check-in record
    await db.check_ins.update_one(
        {"id": checkin_id},
        {
            "$set": {
                "room_type": new_room_type,
                "room_number": new_room_number
            },
            "$inc": {"total_amount": total_additional_cost}
        }
    )
    
    return {
        "upgrade_id": upgrade_doc["id"],
        "additional_cost": total_additional_cost,
        "upgrade_fee": upgrade_fee,
        "cleaning_fee": cleaning_fee,
        "message": "Room upgraded successfully"
    }

@api_router.post("/admin/seed-default-items")
async def seed_default_items(current_user: User = Depends(get_current_user)):
    """Seed default additional items if they don't exist"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can seed default items")
    
    default_items = [
        {"name": "Condoms", "price": 2.0, "category": "health"},
        {"name": "Dildos", "price": 15.0, "category": "accessories"},
        {"name": "Cleaning Fee", "price": 5.0, "category": "fees"},
        {"name": "Lost Key Fee", "price": 10.0, "category": "fees"}
    ]
    
    created_items = []
    for item_data in default_items:
        # Check if item already exists
        existing = await db.additional_items.find_one({"name": item_data["name"], "active": True})
        if not existing:
            item_doc = {
                "id": str(uuid.uuid4()),
                "name": item_data["name"],
                "price": item_data["price"],
                "category": item_data["category"],
                "active": True,
                "created_at": datetime.now(timezone.utc)
            }
            await db.additional_items.insert_one(item_doc)
            created_items.append(item_doc["name"])
    
    return {"message": f"Created {len(created_items)} default items", "items": created_items}

@api_router.get("/admin/additional-items", response_model=List[AdditionalItem])
async def get_all_additional_items(current_user: User = Depends(get_current_user)):
    """Get all additional items for admin management"""
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can view all items")
    
    items = await db.additional_items.find().to_list(1000)
    return [AdditionalItem(**item) for item in items]

@api_router.get("/additional-items", response_model=List[AdditionalItem])
async def get_additional_items(current_user: User = Depends(get_current_user)):
    """Get active additional items for regular use"""
    items = await db.additional_items.find({"active": True}).to_list(1000)
    return [AdditionalItem(**item) for item in items]

@api_router.post("/additional-items", response_model=AdditionalItem)
async def create_additional_item(item_create: AdditionalItemCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can create items")
    
    item_doc = item_create.dict()
    item_doc["id"] = str(uuid.uuid4())
    item_doc["active"] = True
    item_doc["created_at"] = datetime.now(timezone.utc)
    
    await db.additional_items.insert_one(item_doc)
    return AdditionalItem(**item_doc)

@api_router.put("/additional-items/{item_id}")
async def update_additional_item(item_id: str, item_update: AdditionalItemCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can update items")
    
    result = await db.additional_items.update_one(
        {"id": item_id},
        {"$set": item_update.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated successfully"}

@api_router.put("/additional-items/{item_id}/toggle")
async def toggle_additional_item(item_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can modify items")
    
    item = await db.additional_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    new_status = not item["active"]
    await db.additional_items.update_one({"id": item_id}, {"$set": {"active": new_status}})
    return {"message": f"Item {'enabled' if new_status else 'disabled'}"}

@api_router.delete("/additional-items/{item_id}")
async def delete_additional_item(item_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can delete items")
    
    result = await db.additional_items.update_one(
        {"id": item_id},
        {"$set": {"active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

@api_router.get("/qr/membership-form")
async def get_membership_form_qr():
    """Generate QR code for membership form"""
    try:
        # Create QR code pointing to the membership form
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        membership_form_url = f"{frontend_url}/membership"
        
        import qrcode
        from io import BytesIO
        import base64
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(membership_form_url)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = BytesIO()
        qr_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "qr_code_url": f"data:image/png;base64,{img_str}",
            "membership_form_url": membership_form_url
        }
    except Exception as e:
        return {
            "qr_code_url": "https://via.placeholder.com/200x200?text=QR+Code",
            "membership_form_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/membership"
        }

@api_router.get("/reports/daily-sales")
async def get_daily_sales_report(date: str = None, current_user: User = Depends(get_current_user)):
    try:
        # If no date provided, use today
        if not date:
            date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
        # Parse the date and get start/end of day
        try:
            report_date = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
        except ValueError:
            # If date parsing fails, use today
            report_date = datetime.now(timezone.utc)
            
        start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = report_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get all transactions for the day
        transactions = await db.transactions.find({
            "created_at": {
                "$gte": start_of_day,
                "$lte": end_of_day
            }
        }).to_list(1000)
        
        # Separate regular transactions and refunds
        regular_transactions = [t for t in transactions if not t.get("is_refund", False)]
        refund_transactions = [t for t in transactions if t.get("is_refund", False)]
        
        # Calculate totals
        total_revenue = sum(t.get("total_amount", 0) for t in regular_transactions)
        total_refunds = abs(sum(t.get("total_amount", 0) for t in refund_transactions))  # Make positive for display
        net_revenue = total_revenue - total_refunds
        
        total_transactions = len(regular_transactions)
        
        # Payment method breakdown
        payment_breakdown = {
            "cash": {"count": 0, "revenue": 0, "refunds": 0},
            "card": {"count": 0, "revenue": 0, "refunds": 0}
        }
        
        for transaction in regular_transactions:
            payment_method = transaction.get("payment_method", "cash")
            if payment_method in payment_breakdown:
                payment_breakdown[payment_method]["count"] += 1
                payment_breakdown[payment_method]["revenue"] += transaction.get("total_amount", 0)
        
        for refund in refund_transactions:
            payment_method = refund.get("payment_method", "cash")
            if payment_method in payment_breakdown:
                payment_breakdown[payment_method]["refunds"] += abs(refund.get("total_amount", 0))
        
        # Transaction type breakdown
        transaction_type_breakdown = {}
        for transaction in regular_transactions:
            tx_type = transaction.get("transaction_type", "unknown")
            if tx_type not in transaction_type_breakdown:
                transaction_type_breakdown[tx_type] = {"count": 0, "revenue": 0}
            transaction_type_breakdown[tx_type]["count"] += 1
            transaction_type_breakdown[tx_type]["revenue"] += transaction.get("total_amount", 0)
        
        return {
            "date": date,
            "summary": {
                "total_transactions": total_transactions,
                "total_revenue": round(total_revenue, 2),
                "total_refunds": round(total_refunds, 2),
                "net_revenue": round(net_revenue, 2),
                "average_transaction": round(total_revenue / max(total_transactions, 1), 2)
            },
            "payment_breakdown": {
                method: {
                    "count": data["count"],
                    "revenue": round(data["revenue"], 2),
                    "refunds": round(data["refunds"], 2),
                    "net": round(data["revenue"] - data["refunds"], 2)
                }
                for method, data in payment_breakdown.items()
            },
            "transaction_type_breakdown": {
                tx_type: {
                    "count": data["count"],
                    "revenue": round(data["revenue"], 2)
                }
                for tx_type, data in transaction_type_breakdown.items()
            },
            "refund_summary": {
                "total_refunds": round(total_refunds, 2),
                "refund_count": len(refund_transactions),
                "refund_rate": round((len(refund_transactions) / max(total_transactions, 1)) * 100, 2)
            }
        }
        
    except Exception as e:
        print(f"Error generating sales report: {e}")
        return {
            "date": date or datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            "summary": {
                "total_transactions": 0,
                "total_revenue": 0.0,
                "total_refunds": 0.0,
                "net_revenue": 0.0,
                "average_transaction": 0.0
            },
            "payment_breakdown": {
                "cash": {"count": 0, "revenue": 0.0, "refunds": 0.0, "net": 0.0},
                "card": {"count": 0, "revenue": 0.0, "refunds": 0.0, "net": 0.0}
            },
            "transaction_type_breakdown": {},
            "refund_summary": {
                "total_refunds": 0.0,
                "refund_count": 0,
                "refund_rate": 0.0
            }
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