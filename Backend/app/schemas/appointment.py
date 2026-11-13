from pydantic import BaseModel, ConfigDict

from app.core.disclaimer import DISCLAIMER

JITSI_NOTICE = (
    "Demo uses public Jitsi (meet.jit.si), which is not suitable for real patient data. "
    "Production needs self-hosted Jitsi or signed-token rooms. Consent is required before the "
    "call. Do not record."
)


class AppointmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    case_id: int


class AppointmentOut(BaseModel):
    id: int
    case_id: int
    doctor_id: int
    patient_id: int
    room_id: str
    join_url: str
    notice: str = JITSI_NOTICE
    disclaimer: str = DISCLAIMER
