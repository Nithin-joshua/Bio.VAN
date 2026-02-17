import torch
import os
import sys

# Add backend to path to import core
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from core.rawnet_model import RawNet2

RAWNET_CONFIG = {
    'nb_fil': 20,
    'first_conv': 128,
    'sample_rate': 16000,
    'min_low_hz': 50,
    'min_band_hz': 50,
    'gru_node': 1024,
    'nb_gru_layer': 3,
    'nb_fc_node': 1024,
    'nb_classes': 2
}

def generate_user_weights():
    print("Generating dummy RawNet2 weights...")
    model = RawNet2(RAWNET_CONFIG)
    
    save_dir = os.path.join(os.path.dirname(__file__), '..', 'pretrained_models')
    os.makedirs(save_dir, exist_ok=True)
    
    save_path = os.path.join(save_dir, 'rawnet2.pth')
    
    torch.save(model.state_dict(), save_path)
    print(f"Dummy weights saved to: {save_path}")
    print("NOTE: These are random weights. The model will run but will NOT detect spoofing accurately.")

if __name__ == "__main__":
    generate_user_weights()
