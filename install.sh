#!/bin/bash

# Install required packages
apt-get -y install build-essential python3-dev ffmpeg
apt -y install -qq aria2
apt install nodejs npm

# Install Python packages
pip3 install faiss-cpu==1.7.2 fairseq gradio==3.14.0 ffmpeg ffmpeg-python praat-parselmouth pyworld numpy==1.23.5 numba==0.56.4 librosa==0.9.2

# Clone the repository and download pre-trained models
git clone --depth=1 -b stable https://github.com/fumiama/Retrieval-based-Voice-Conversion-WebUI
cd Retrieval-based-Voice-Conversion-WebUI
mkdir -p pretrained uvr5_weights

# Download pre-trained models using aria2c
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/D32k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o D32k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/D40k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o D40k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/D48k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o D48k.pth

aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/G32k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o G32k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/G40k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o G40k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/G48k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o G48k.pth

aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0D32k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0D32k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0D40k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0D40k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0D48k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0D48k.pth

aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0G32k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0G32k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0G40k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0G40k.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/pretrained/f0G48k.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/pretrained -o f0G48k.pth

aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/uvr5_weights/HP2-人声vocals+非人声instrumentals.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/uvr5_weights -o HP2-人声vocals+非人声instrumentals.pth
aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/uvr5_weights/HP5-主旋律人声vocals+其他instrumentals.pth -d /workspace/Retrieval-based-Voice-Conversion-WebUI/uvr5_weights -o HP5-主旋律人声vocals+其他instrumentals.pth

aria2c --console-log-level=error -c -x 16 -s 16 -k 1M https://huggingface.co/lj1995/VoiceConversionWebUI/resolve/main/hubert_base.pt -d /workspace/Retrieval-based-Voice-Conversion-WebUI -o hubert_base.pt

npm install express multer path fs
