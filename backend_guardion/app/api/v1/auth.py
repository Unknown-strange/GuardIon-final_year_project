"""
Authentication API Endpoints
Handles user registration, login, OTP verification, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets

from app.api.deps import get_db, get_current_user
from app.models.email_verification import OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    GoogleAuthRequest,
    GoogleCodeExchangeRequest,
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.otp import (
    ForgotPasswordRequest,
    MessageResponse,
    OtpPurposeEnum,
    ResendOtpRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupVerifyRequest,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.otp_service import issue_otp, load_payload, verify_otp
from app.services.google_auth_service import (
    exchange_google_authorization_code,
    verify_google_id_token,
)
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)

router = APIRouter()


def _tokens_for_user(user: User) -> TokenResponse:
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Legacy direct registration (no OTP).
    Prefer POST /auth/signup/request + /auth/signup/verify for production apps.
    """
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    db_user = User(
        name=user_data.name,
        email=user_data.email.lower(),
        password=get_password_hash(user_data.password),
        phone_number=user_data.phone_number,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/signup/request", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def signup_request(payload: SignupRequest, db: Session = Depends(get_db)):
    """Start signup — sends a one-time verification code to the user's email."""
    email = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    ok, error = issue_otp(
        db,
        email=email,
        purpose=OtpPurpose.SIGNUP,
        recipient_name=payload.name,
        payload={
            "name": payload.name.strip(),
            "password_hash": get_password_hash(payload.password),
            "phone_number": payload.phone_number,
        },
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=error)

    return MessageResponse(message="Verification code sent to your email.")


@router.post("/signup/verify", response_model=TokenResponse)
def signup_verify(payload: SignupVerifyRequest, db: Session = Depends(get_db)):
    """Verify signup OTP and create the user account."""
    email = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    record, error = verify_otp(
        db,
        email=email,
        purpose=OtpPurpose.SIGNUP,
        code=payload.code.strip(),
    )
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    data = load_payload(record)
    name = data.get("name")
    password_hash = data.get("password_hash")
    if not name or not password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please register again.",
        )

    db_user = User(
        name=name,
        email=email,
        password=password_hash,
        phone_number=data.get("phone_number"),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return _tokens_for_user(db_user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password reset OTP when the email belongs to an existing account."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this email.",
        )

    ok, error = issue_otp(
        db,
        email=email,
        purpose=OtpPurpose.PASSWORD_RESET,
        recipient_name=user.name,
        payload={"user_id": str(user.id)},
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=error)

    return MessageResponse(message="Verification code sent to your email.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and set a new password."""
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request.")

    _, error = verify_otp(
        db,
        email=email,
        purpose=OtpPurpose.PASSWORD_RESET,
        code=payload.code.strip(),
    )
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    user.password = get_password_hash(payload.new_password)
    db.commit()

    return MessageResponse(message="Password updated successfully. You can sign in now.")


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    """Resend OTP for signup or password reset."""
    from app.models.email_verification import EmailVerification

    email = payload.email.strip().lower()
    purpose = OtpPurpose(payload.purpose.value)

    if purpose == OtpPurpose.SIGNUP:
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        prior = (
            db.query(EmailVerification)
            .filter(
                EmailVerification.email == email,
                EmailVerification.purpose == OtpPurpose.SIGNUP.value,
            )
            .order_by(EmailVerification.created_at.desc())
            .first()
        )
        if not prior or not prior.payload_json:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending signup found. Please register again.",
            )
        data = load_payload(prior)
        ok, error = issue_otp(
            db,
            email=email,
            purpose=OtpPurpose.SIGNUP,
            recipient_name=data.get("name", "Guardian"),
            payload=data,
        )
    else:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found for this email.",
            )
        ok, error = issue_otp(
            db,
            email=email,
            purpose=OtpPurpose.PASSWORD_RESET,
            recipient_name=user.name,
            payload={"user_id": str(user.id)},
        )

    if not ok:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=error)

    return MessageResponse(message="Verification code sent to your email.")


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return JWT tokens."""
    email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _tokens_for_user(user)


def _user_from_google_id_info(id_info: dict, db: Session) -> User:
    email = (id_info.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide an email address.",
        )
    if not id_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified.",
        )

    name = (id_info.get("name") or email.split("@")[0]).strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            password=get_password_hash(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Sign in or register using a Google ID token from the mobile app."""
    from app.config import settings

    if not settings.google_client_ids:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured on the server.",
        )

    try:
        id_info = verify_google_id_token(payload.id_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    user = _user_from_google_id_info(id_info, db)
    return _tokens_for_user(user)


@router.post("/google/code", response_model=TokenResponse)
def google_auth_code_exchange(payload: GoogleCodeExchangeRequest, db: Session = Depends(get_db)):
    """Exchange a Google OAuth authorization code and sign in (Expo Go / Web client flow)."""
    from app.config import settings

    if not settings.google_client_ids:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured on the server.",
        )

    try:
        token_response = exchange_google_authorization_code(
            code=payload.code,
            redirect_uri=payload.redirect_uri,
            code_verifier=payload.code_verifier,
        )
        id_info = verify_google_id_token(token_response["id_token"])
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )

    user = _user_from_google_id_info(id_info, db)
    return _tokens_for_user(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    token = payload.refresh_token
    decoded = decode_token(token)

    if decoded is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return _tokens_for_user(user)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's information."""
    return current_user
