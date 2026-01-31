# core/model.py

from speechbrain.pretrained import SpeakerRecognition

_VERIFIER = None


def get_verifier():
    global _VERIFIER

    if _VERIFIER is None:
        _VERIFIER = SpeakerRecognition.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="pretrained_models/ecapa"
        )

    return _VERIFIER
