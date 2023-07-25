import os,sys,pdb,torch
now_dir = os.getcwd()
sys.path.append(now_dir)
import argparse
import glob
import sys
import torch
import numpy as np
from multiprocessing import cpu_count

from infer_pack.models import (
    SynthesizerTrnMs256NSFsid,
    SynthesizerTrnMs256NSFsid_nono,
    SynthesizerTrnMs768NSFsid,
    SynthesizerTrnMs768NSFsid_nono,
)

class Config:
    def __init__(self, device, is_half):
        self.device = device
        self.is_half = is_half
        self.n_cpu = 0
        self.gpu_name = None
        self.gpu_mem = None
        self.x_pad, self.x_query, self.x_center, self.x_max = self.device_config()

    def device_config(self) -> tuple:
        # ... (the rest of the method remains unchanged)

f0_up_key = int(sys.argv[1])  # transpose value
input_path = sys.argv[2]
opt_path = sys.argv[3]
model_path = sys.argv[4]
device = sys.argv[5]
is_half = sys.argv[6]
f0method = sys.argv[7]  # pm or harvest
file_index = sys.argv[8]  # .index file
file_index2 = sys.argv[9]
index_rate = float(sys.argv[10])  # search feature ratio
filter_radius = float(sys.argv[11])  # median filter
resample_sr = float(sys.argv[12])  # resample audio in post-processing
rms_mix_rate = float(sys.argv[13])  # search feature
protect = float(sys.argv[14])  # protect audio

print(sys.argv)

if is_half.lower() == 'true':
    is_half = True
else:
    is_half = False

config = Config(device, is_half)
now_dir = os.getcwd()
sys.path.append(now_dir)
from vc_infer_pipeline import VC
from infer_pack.models import SynthesizerTrnMs256NSFsid, SynthesizerTrnMs256NSFsid_nono
from my_utils import load_audio
from fairseq import checkpoint_utils
from scipy.io import wavfile

hubert_model = None

def load_hubert():
    global hubert_model
    models, _, _ = checkpoint_utils.load_model_ensemble_and_task(
        ["hubert_base.pt"],
        suffix="",
    )
    hubert_model = models[0]
    hubert_model = hubert_model.to(config.device)
    if config.is_half:
        hubert_model = hubert_model.half()
    else:
        hubert_model = hubert_model.float()
    hubert_model.eval()

def vc_single(
    sid=0,
    input_audio_path=None,
    f0_up_key=0,
    f0_file=None,
    f0_method="pm",
    file_index="",  # .index file
    file_index2="",
    # file_big_npy,
    index_rate=1.0,
    filter_radius=3,
    resample_sr=0,
    rms_mix_rate=1.0,
    protect=0.38
):
    global tgt_sr, net_g, vc, hubert_model, version
    if input_audio_path is None:
        return "You need to upload an audio file", None

    f0_up_key = int(f0_up_key)
    audio = load_audio(input_audio_path, 16000)
    audio_max = np.abs(audio).max() / 0.95

    if audio_max > 1:
        audio /= audio_max
    times = [0, 0, 0]

    if hubert_model is None:
        load_hubert()

    if_f0 = cpt.get("f0", 1)

    file_index = (
        (
            file_index.strip(" ")
            .strip('"')
            .strip("\n")
            .strip('"')
            .strip(" ")
            .replace("trained", "added")
        )
        if file_index != ""
        else file_index2
    )

    audio_opt = vc.pipeline(
        hubert_model,
        net_g,
        sid,
        audio,
        input_audio_path,
        times,
        f0_up_key,
        f0_method,
        file_index,
        # file_big_npy,
        index_rate,
        if_f0,
        filter_radius,
        tgt_sr,
        resample_sr,
        rms_mix_rate,
        version,
        f0_file=f0_file,
        protect=protect
    )
    return audio_opt

def get_vc(model_path):
    global n_spk, tgt_sr, net_g, vc, cpt, version
    if model_path == "" or model_path == []:
        global hubert_model
        if hubert_model is not None:
            print("clean_empty_cache")
            del net_g, n_spk, vc, hubert_model, tgt_sr
            hubert_model = net_g = n_spk = vc = hubert_model = tgt_sr = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    if_f0 = cpt.get("f0", 1)
    version = cpt.get("version", "v1")
    if version == "v1":
        if if_f0 == 1:
            net_g = SynthesizerTrnMs256NSFsid(*cpt["config"], is_half=config.is_half)
        else:
            net_g = SynthesizerTrnMs256NSFsid_nono(*cpt["config"])
    elif version == "v2":
        if if_f0 == 1:
            net_g = SynthesizerTrnMs768NSFsid(*cpt["config"], is_half=config.is_half)
        else:
            net_g = SynthesizerTrnMs768NSFsid_nono(*cpt["config"])
    del net_g, cpt
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    cpt = None
    return {"visible": False, "type": "update"}

print("loading %s" % model_path)  # Changed 'person' to 'model_path'
cpt = torch.load(model_path, map_location="cpu")  # Changed 'person' to 'model_path'
tgt_sr = cpt["config"][-1]
cpt["config"][-3] = cpt["weight"]["emb_g.weight"].shape[0]  
if_f0 = cpt.get("f0", 1)
version = cpt.get("version", "v1")
if version == "v1":
    if if_f0 == 1:
        net_g = SynthesizerTrnMs256NSFsid(*cpt["config"], is_half=config.is_half)
    else:
        net_g = SynthesizerTrnMs256NSFsid_nono(*cpt["config"])
elif version == "v2":
    if if_f0 == 1:
        net_g = SynthesizerTrnMs768NSFsid(*cpt["config"], is_half=config.is_half)
    else:
        net_g = SynthesizerTrnMs768NSFsid_nono(*cpt["config"])
del net_g.enc_q
print(net_g.load_state_dict(cpt["weight"], strict=False))
net_g.eval().to(config.device)
if config.is_half:
    net_g = net_g.half()
else:
    net_g = net_g.float()
vc = VC(tgt_sr, config)
n_spk = cpt["config"][-3]
return {"visible": True, "maximum": n_spk, "__type__": "update"}

get_vc(model_path)
wav_opt = vc_single(
    0,
    input_path,
    f0_up_key,
    None,
    f0method,
    file_index,
    file_index2,
    index_rate,
    filter_radius,
    resample_sr,
    rms_mix_rate,
    protect
)
wavfile.write(opt_path, tgt_sr, wav_opt)
