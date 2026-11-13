"""Reset the database to seed data: drop all tables, recreate, seed, clear temp uploads."""

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.db import models  # noqa: F401
from app.db.seed import seed_demo
from app.db.session import Base, SessionLocal, engine


def main() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    shutil.rmtree(get_settings().upload_dir, ignore_errors=True)
    with SessionLocal() as db:
        print("seeded:", seed_demo(db))
    print("Demo logins (password from DEMO_PASSWORD): admin@, doctor@, healthworker@, patient@ demo.nirmay.test")


if __name__ == "__main__":
    main()
