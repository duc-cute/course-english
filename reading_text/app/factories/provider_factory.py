from app.core.constants import ALIGNMENT_PROVIDERS, STT_PROVIDERS, TTS_PROVIDERS
from app.core.exception import ProviderNotFoundError, ProviderNotReadyError
from app.providers.base.base_alignment_provider import BaseAlignmentProvider
from app.providers.base.base_stt_provider import BaseSTTProvider
from app.providers.base.base_tts_provider import BaseTTSProvider

_TTS_REGISTRY: dict[str, type[BaseTTSProvider]] = {}
_ALIGNMENT_REGISTRY: dict[str, type[BaseAlignmentProvider]] = {}
_STT_REGISTRY: dict[str, type[BaseSTTProvider]] = {}

_TTS_INSTANCES: dict[str, BaseTTSProvider] = {}
_ALIGNMENT_INSTANCES: dict[str, BaseAlignmentProvider] = {}
_STT_INSTANCES: dict[str, BaseSTTProvider] = {}


class ProviderFactory:
    """Returns provider implementations — business logic never branches on vendor name."""

    @staticmethod
    def register_tts(name: str, cls: type[BaseTTSProvider]) -> None:
        _TTS_REGISTRY[name.lower()] = cls

    @staticmethod
    def register_alignment(name: str, cls: type[BaseAlignmentProvider]) -> None:
        _ALIGNMENT_REGISTRY[name.lower()] = cls

    @staticmethod
    def register_stt(name: str, cls: type[BaseSTTProvider]) -> None:
        _STT_REGISTRY[name.lower()] = cls

    @staticmethod
    def get_tts_provider(name: str) -> BaseTTSProvider:
        key = name.lower()
        if key in _TTS_INSTANCES:
            return _TTS_INSTANCES[key]

        cls = _TTS_REGISTRY.get(key)
        if cls is None:
            if key in TTS_PROVIDERS:
                raise ProviderNotReadyError(name)
            raise ProviderNotFoundError(name)

        instance = cls()
        _TTS_INSTANCES[key] = instance
        return instance

    @staticmethod
    def get_alignment_provider(name: str) -> BaseAlignmentProvider:
        key = name.lower()
        if key in _ALIGNMENT_INSTANCES:
            return _ALIGNMENT_INSTANCES[key]

        cls = _ALIGNMENT_REGISTRY.get(key)
        if cls is None:
            if key in ALIGNMENT_PROVIDERS:
                raise ProviderNotReadyError(name)
            raise ProviderNotFoundError(name)
        instance = cls()
        _ALIGNMENT_INSTANCES[key] = instance
        return instance

    @staticmethod
    def get_stt_provider(name: str) -> BaseSTTProvider:
        key = name.lower()
        if key in _STT_INSTANCES:
            return _STT_INSTANCES[key]

        cls = _STT_REGISTRY.get(key)
        if cls is None:
            if key in STT_PROVIDERS:
                raise ProviderNotReadyError(name)
            raise ProviderNotFoundError(name)
        instance = cls()
        _STT_INSTANCES[key] = instance
        return instance

    @staticmethod
    def list_tts_providers() -> list[str]:
        return sorted(_TTS_REGISTRY.keys())

    @staticmethod
    def list_registered() -> dict[str, list[str]]:
        return {
            "tts": sorted(_TTS_REGISTRY.keys()),
            "alignment": sorted(_ALIGNMENT_REGISTRY.keys()),
            "stt": sorted(_STT_REGISTRY.keys()),
        }

    @staticmethod
    def clear_instances() -> None:
        """Test helper — reset singleton cache."""
        _TTS_INSTANCES.clear()
        _ALIGNMENT_INSTANCES.clear()
        _STT_INSTANCES.clear()

    @staticmethod
    def clear_registry() -> None:
        """Test helper — reset registrations."""
        _TTS_REGISTRY.clear()
        _ALIGNMENT_REGISTRY.clear()
        _STT_REGISTRY.clear()
        ProviderFactory.clear_instances()
