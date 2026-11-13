import pytest

from app.services.llm.settings import LLMSettings


def test_llm_settings_defaults_to_four_second_timeout():
    settings = LLMSettings.from_env({})

    assert settings.timeout_seconds == 4.0
    assert settings.api_key is None


@pytest.mark.parametrize("timeout", ["2", "6", "not-a-number"])
def test_llm_settings_rejects_timeout_outside_project_limit(timeout):
    with pytest.raises(ValueError, match="LLM_TIMEOUT_SECONDS"):
        LLMSettings.from_env({"LLM_TIMEOUT_SECONDS": timeout})
