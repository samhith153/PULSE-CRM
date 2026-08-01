from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DBSession, require_permission
from app.schemas.common import StandardResponse
from app.schemas.email import EmailResponse, SMTPSendRequest
from app.services.smtp_service import SMTPService

router = APIRouter()


@router.post(
    "/send",
    response_model=StandardResponse[EmailResponse],
    summary="Send Email via SMTP",
    dependencies=[Depends(require_permission("email:send"))],
)
async def send_email(
    payload: SMTPSendRequest,
    current_user: CurrentUser,
    db: DBSession,
):
    svc = SMTPService(db)

    email = await svc.send_smtp_email(
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        receiver=str(payload.receiver),
        subject=payload.subject,
        html_body=payload.html_body,
        external_entity_type=payload.external_entity_type,
        external_entity_id=payload.external_entity_id,
    )

    return {
        "success": True,
        "message": "Email sent successfully.",
        "data": email,
    }