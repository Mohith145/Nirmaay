"""
model.py — EfficientNet-B3 based binary classifier for oral cancer detection.

Architecture:
    EfficientNet-B3 (pretrained on ImageNet)
        └── Custom classifier head
                ├── BatchNorm1d
                ├── Dropout (0.5)
                ├── Linear(1536 → 512)
                ├── ReLU + Dropout
                └── Linear(512 → 2)  ← Cancer / Non-Cancer
"""

import torch
import torch.nn as nn
from torchvision import models

from config import NUM_CLASSES, DROPOUT_RATE, LEARNING_RATE, FINE_TUNE_LR


class OralCancerModel(nn.Module):
    """EfficientNet-B3 with a custom classification head for binary oral cancer detection."""

    def __init__(self, num_classes: int = NUM_CLASSES, dropout: float = DROPOUT_RATE):
        super(OralCancerModel, self).__init__()

        # Load pretrained EfficientNet-B3
        weights = models.EfficientNet_B3_Weights.IMAGENET1K_V1
        self.backbone = models.efficientnet_b3(weights=weights)

        # Freeze all backbone layers initially (feature extraction phase)
        for param in self.backbone.parameters():
            param.requires_grad = False

        # Replace classifier head
        in_features = self.backbone.classifier[1].in_features  # 1536 for B3
        self.backbone.classifier = nn.Sequential(
            nn.BatchNorm1d(in_features),
            nn.Dropout(p=dropout),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout / 2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    def unfreeze_backbone(self, num_layers: int = 20):
        """
        Gradually unfreeze the last `num_layers` backbone layers for fine-tuning.

        Args:
            num_layers: Number of layers from the end of the backbone to unfreeze.
        """
        all_layers = list(self.backbone.features.children())
        layers_to_unfreeze = all_layers[-num_layers:]
        for layer in layers_to_unfreeze:
            for param in layer.parameters():
                param.requires_grad = True
        unfrozen = sum(p.requires_grad for p in self.backbone.parameters())
        total    = sum(1 for _ in self.backbone.parameters())
        print(f"[unfreeze] Unfrozen {unfrozen}/{total} backbone parameters.")

    def freeze_backbone(self):
        """Re-freeze the entire backbone."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        print("[freeze] Backbone fully frozen.")


def build_model(device: torch.device) -> OralCancerModel:
    """Instantiate model and move to device."""
    model = OralCancerModel()
    model = model.to(device)
    total_params     = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\n[Model] EfficientNet-B3")
    print(f"   Total params    : {total_params:,}")
    print(f"   Trainable params: {trainable_params:,}")
    print(f"   Device          : {device}\n")
    return model


def get_optimizer(model: OralCancerModel, fine_tune: bool = False):
    """
    Returns Adam optimizer.
    - Phase 1 (fine_tune=False): Only trains the classifier head.
    - Phase 2 (fine_tune=True) : Lower LR for unfrozen backbone layers.
    """
    if not fine_tune:
        return torch.optim.Adam(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=LEARNING_RATE,
            weight_decay=1e-4
        )
    else:
        # Differential learning rates
        backbone_params   = [p for n, p in model.named_parameters()
                             if "backbone.features" in n and p.requires_grad]
        classifier_params = [p for n, p in model.named_parameters()
                             if "classifier" in n and p.requires_grad]
        return torch.optim.Adam([
            {"params": backbone_params,   "lr": FINE_TUNE_LR},
            {"params": classifier_params, "lr": LEARNING_RATE},
        ], weight_decay=1e-4)


def get_scheduler(optimizer, num_epochs: int):
    """Cosine annealing LR scheduler."""
    return torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=num_epochs, eta_min=1e-7
    )
