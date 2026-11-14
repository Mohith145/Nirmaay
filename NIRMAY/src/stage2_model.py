"""
stage2_model.py — EfficientNet-B3 Cancer TYPE Classifier (Stage 2)

Classifies a confirmed-cancer image into one of 8 oral cancer types:
    0  SCC (Squamous Cell Carcinoma)
    1  Verrucous Carcinoma
    2  Salivary Gland Cancer
    3  Adenoid Cystic Carcinoma
    4  Melanoma
    5  Lymphoma
    6  Sarcoma
    7  Odontogenic Tumour
"""

import torch
import torch.nn as nn
from torchvision import models

from config import STAGE2_NUM_CLASSES, STAGE2_CLASS_NAMES, DROPOUT_RATE, LEARNING_RATE, FINE_TUNE_LR


class CancerTypeModel(nn.Module):
    """
    EfficientNet-B3 fine-tuned for 8-class oral cancer type classification.
    Identical backbone to Stage 1 but with an 8-way output head.
    """

    def __init__(self, num_classes: int = STAGE2_NUM_CLASSES, dropout: float = DROPOUT_RATE):
        super(CancerTypeModel, self).__init__()

        weights = models.EfficientNet_B3_Weights.IMAGENET1K_V1
        self.backbone = models.efficientnet_b3(weights=weights)

        # Freeze backbone initially
        for param in self.backbone.parameters():
            param.requires_grad = False

        in_features = self.backbone.classifier[1].in_features  # 1536

        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    def unfreeze_backbone(self, num_layers: int = 20):
        all_layers = list(self.backbone.features.children())
        for layer in all_layers[-num_layers:]:
            for param in layer.parameters():
                param.requires_grad = True
        trainable = sum(p.requires_grad for p in self.backbone.parameters())
        total     = sum(1 for _ in self.backbone.parameters())
        print(f"[Stage2] Unfrozen {trainable}/{total} backbone parameters.")


def build_stage2_model(device: torch.device, num_classes: int = STAGE2_NUM_CLASSES, class_names: list = None) -> CancerTypeModel:
    if class_names is None:
        class_names = STAGE2_CLASS_NAMES
    model = CancerTypeModel(num_classes=num_classes)
    model = model.to(device)
    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\n[Stage 2 Model] EfficientNet-B3 ({num_classes}-class)")
    print(f"   Classes         : {class_names}")
    print(f"   Total params    : {total:,}")
    print(f"   Trainable params: {trainable:,}")
    print(f"   Device          : {device}\n")
    return model


def get_stage2_optimizer(model: CancerTypeModel, fine_tune: bool = False):
    if not fine_tune:
        return torch.optim.Adam(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=LEARNING_RATE, weight_decay=1e-4
        )
    backbone_params   = [p for n, p in model.named_parameters()
                         if "backbone.features" in n and p.requires_grad]
    classifier_params = [p for n, p in model.named_parameters()
                         if "classifier" in n and p.requires_grad]
    return torch.optim.Adam([
        {"params": backbone_params,   "lr": FINE_TUNE_LR},
        {"params": classifier_params, "lr": LEARNING_RATE},
    ], weight_decay=1e-4)
