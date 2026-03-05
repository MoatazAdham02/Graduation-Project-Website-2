import torch.nn as nn
from monai.networks.nets import DenseNet121

class MyMedicalModel(nn.Module):
    def __init__(self):
        super(MyMedicalModel, self).__init__()
        # نفس الإعدادات اللي في كود التدريب بتاعك بالظبط
        self.model = DenseNet121(
            spatial_dims=3,   # لأنه 3D
            in_channels=1,    # أسود وأبيض
            out_channels=2    # Normal و Abnormal
        )

    def forward(self, x):
        return self.model(x)
