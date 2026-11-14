def test_health_worker_registers_searches_and_screens_patient(client, users):
    headers = users["hw"]["headers"]
    response = client.post("/patients", headers=headers, json={
        "full_name": "Camp Participant",
        "email": "camp-participant@example.test",
        "password": "temporary-password",
        "age": 42,
        "phone": "9876543210",
        "gender": "female",
        "camp_token": "CAMP-42",
        "consent_given": True,
    })
    assert response.status_code == 201, response.text
    patient = response.json()
    assert patient["id"] > 0
    assert patient["camp_token"] == "CAMP-42"
    assert patient["age"] == 42

    intake = client.post("/intakes", headers=headers, json={
        "patient_id": patient["id"],
        "age": 42,
        "tobacco": "none",
    })
    assert intake.status_code == 201, intake.text

    search = client.get("/patients", headers=headers, params={"q": "CAMP-42"})
    assert search.status_code == 200, search.text
    assert [item["id"] for item in search.json()] == [patient["id"]]


def test_health_worker_cannot_register_without_consent(client, users):
    response = client.post("/patients", headers=users["hw"]["headers"], json={
        "full_name": "No Consent",
        "email": "no-consent@example.test",
        "password": "temporary-password",
        "consent_given": False,
    })
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "consent_required"


def test_patient_cannot_use_staff_directory(client, users):
    response = client.get("/patients", headers=users["patient"]["headers"])
    assert response.status_code == 403
