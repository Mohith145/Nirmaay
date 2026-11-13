from enum import StrEnum


class Role(StrEnum):
    patient = "patient"
    health_worker = "health_worker"
    doctor = "doctor"
    admin = "admin"
