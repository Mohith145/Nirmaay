from app.api.model_card import get_model_card


def test_model_card_is_honest_about_missing_model():
    card = get_model_card()

    assert card["status"] == "demo placeholder"
    assert card["model_available"] is False
    assert card["sensitivity_by_class"] == "TBD"
    assert card["disclaimer"] == "Screening aid, not diagnosis."
