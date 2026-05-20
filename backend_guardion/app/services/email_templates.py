"""
HTML email templates for GuardIon transactional messages.
"""


def otp_email_html(
    *,
    recipient_name: str,
    otp_code: str,
    purpose: str,
    expires_minutes: int,
) -> str: 
    headline = "Verify your GuardIon account" if purpose == "signup" else "Reset your password"
    intro = (
        "Use the verification code below to complete your GuardIon registration."
        if purpose == "signup"
        else "Use the verification code below to reset your GuardIon password."
    )
    safe_name = recipient_name.strip() or "there"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#EAF4FF;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#EAF4FF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;border:1px solid #E5E7EB;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#072B59 0%,#0B3D7A 100%);padding:28px 32px;">
              <div style="font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:0.3px;">GuardIon</div>
              <div style="font-size:13px;color:#D3E3F4;margin-top:6px;">Child safety monitoring</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">Hi {safe_name},</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#072B59;">{headline}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4B5563;">{intro}</p>

              <div style="text-align:center;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:16px;padding:24px 16px;margin-bottom:24px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6B7280;margin-bottom:10px;">Verification code</div>
                <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#072B59;font-family:Consolas,Monaco,monospace;">{otp_code}</div>
              </div>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4B5563;">
                This code expires in <strong>{expires_minutes} minutes</strong>. For your security, do not share it with anyone.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9CA3AF;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #E5E7EB;background:#FAFCFF;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9CA3AF;text-align:center;">
                © GuardIon · Secure child monitoring
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def otp_email_text(*, recipient_name: str, otp_code: str, purpose: str, expires_minutes: int) -> str:
    headline = "Verify your GuardIon account" if purpose == "signup" else "Reset your GuardIon password"
    safe_name = recipient_name.strip() or "there"
    return f"""Hi {safe_name},

{headline}

Your verification code is: {otp_code}

This code expires in {expires_minutes} minutes.

If you did not request this, you can ignore this email.

— GuardIon
"""
