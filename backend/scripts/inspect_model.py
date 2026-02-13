import torch
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

def inspect_weights():
    weight_path = os.path.join("..", "pretrained_models", "rawnet2.pth")
    if not os.path.exists(weight_path):
        print(f"File not found: {weight_path}")
        return

    with open("model_info.txt", "w") as f:
        print(f"Loading {weight_path}...", file=f)
        try:
            state_dict = torch.load(weight_path, map_location='cpu')
            
            # Check if it's a full model or state_dict
            if isinstance(state_dict, dict):
                print("Type: state_dict (Dictionary)", file=f)
                keys = list(state_dict.keys())
                print(f"Total keys: {len(keys)}", file=f)
                print("First 10 keys and shapes:", file=f)
                for k in keys[:10]:
                    print(f"  {k}: {state_dict[k].shape}", file=f)
                
                # Check for SincConv weights
                if 'Sinc_conv.low_hz_' in state_dict:
                     print(f"Sinc_conv.low_hz_: {state_dict['Sinc_conv.low_hz_'].shape}", file=f)
                if 'Sinc_conv.band_hz_' in state_dict:
                     print(f"Sinc_conv.band_hz_: {state_dict['Sinc_conv.band_hz_'].shape}", file=f)

                # Check for Residual Block weights
                if 'block0.conv1.weight' in state_dict:
                     print(f"block0.conv1.weight: {state_dict['block0.conv1.weight'].shape}", file=f)
                
                # Check for Attention weights
                if 'fc_attention0.0.weight' in state_dict:
                     print(f"fc_attention0.0.weight: {state_dict['fc_attention0.0.weight'].shape}", file=f)


            else:
                print(f"Type: {type(state_dict)} (Likely full model)", file=f)

        except Exception as e:
            print(f"Error loading: {e}", file=f)

if __name__ == "__main__":
    inspect_weights()
