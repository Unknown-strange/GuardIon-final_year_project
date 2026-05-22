"""
Pydantic schemas for MQTT payloads (optional validation in handlers).
Canonical shapes: simulators/device_simulator.py
"""

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class LocationPayload(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    altitude: Optional[float] = None
    speed: Optional[float] = None


class BatteryPayload(BaseModel):
    level: Optional[int] = None
    voltage: Optional[float] = None
    charging: Optional[bool] = None


class SignalPayload(BaseModel):
    strength: Optional[int] = None
    quality: Optional[int] = None


class TelemetryPayload(BaseModel):
    device_id: str
    timestamp: Optional[str] = None
    location: LocationPayload = Field(default_factory=LocationPayload)
    battery: BatteryPayload = Field(default_factory=BatteryPayload)
    signal: SignalPayload = Field(default_factory=SignalPayload)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AlertPayload(BaseModel):
    device_id: str
    timestamp: Optional[str] = None
    alert_type: str = "SOS"
    priority: str = "high"
    location: LocationPayload = Field(default_factory=LocationPayload)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class StatusPayload(BaseModel):
    device_id: str
    timestamp: Optional[str] = None
    status: Optional[str] = None
    uptime_seconds: Optional[int] = None


class CheckInResponsePayload(BaseModel):
    device_id: str
    check_in_id: str
    status: str = "confirmed"
    timestamp: Optional[str] = None
