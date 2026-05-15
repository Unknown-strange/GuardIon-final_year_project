"""
Register Simulator Devices in Database
Registers the simulated devices so backend can process their messages
"""

from app.database import SessionLocal
from app.models.user import User
from app.models.child import Child
from app.models.device import Device, DeviceStatus
from app.utils.security import get_password_hash

print("="*60)
print("GuardIOn - Register Simulator Devices")
print("="*60)

db = SessionLocal()

try:
    # Check if test user exists
    test_user = db.query(User).filter(User.email == "simulator@test.com").first()
    
    if not test_user:
        print("\n1. Creating test user...")
        test_user = User(
            name="Simulator Test User",
            email="simulator@test.com",
            password=get_password_hash("simulator123"),
            phone_number="+2348000000000"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"   ✓ User created: {test_user.email}")
    else:
        print(f"\n1. ✓ Test user already exists: {test_user.email}")
    
    # Check if test children exist
    children = []
    child_names = ["Child One", "Child Two", "Child Three"]
    
    print("\n2. Creating test children...")
    for name in child_names:
        child = db.query(Child).filter(
            Child.user_id == test_user.id,
            Child.name == name
        ).first()
        
        if not child:
            child = Child(
                user_id=test_user.id,
                name=name,
                age=8
            )
            db.add(child)
            db.commit()
            db.refresh(child)
            print(f"   ✓ Child created: {name}")
        else:
            print(f"   ✓ Child already exists: {name}")
        
        children.append(child)
    
    # Register simulated devices
    device_ids = ["ESP32-SIM001", "ESP32-SIM002", "ESP32-SIM003"]
    
    print("\n3. Registering simulated devices...")
    for i, device_id in enumerate(device_ids):
        device = db.query(Device).filter(Device.device_id == device_id).first()
        
        if not device:
            device = Device(
                device_id=device_id,
                child_id=children[i].id,
                status=DeviceStatus.ACTIVE,
                battery_level=100
            )
            db.add(device)
            db.commit()
            db.refresh(device)
            print(f"   ✓ Device registered: {device_id} → {children[i].name}")
        else:
            print(f"   ✓ Device already registered: {device_id}")
    
    print("\n" + "="*60)
    print("✅ All simulator devices registered successfully!")
    print("="*60)
    print(f"\nTest User Login:")
    print(f"  Email: simulator@test.com")
    print(f"  Password: simulator123")
    print(f"\nDevices:")
    print(f"  - ESP32-SIM001 (Child One)")
    print(f"  - ESP32-SIM002 (Child Two)")
    print(f"  - ESP32-SIM003 (Child Three)")
    print("="*60)

except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
finally:
    db.close()
