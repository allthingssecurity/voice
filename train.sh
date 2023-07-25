#!/bin/bash

# Configuration
MODELNAME="amit"
USEGPU="0"
BATCHSIZE=1
MODELEPOCH=20
EPOCHSAVE=20
MODELSAMPLE="40k"
CACHEDATA=1
ONLYLATEST=0

# Command to run the Python file with the specified parameters
python3 train_nsf_sim_cache_sid_load_pretrain.py -e "$MODELNAME" -sr "$MODELSAMPLE" -f0 1 -bs "$BATCHSIZE" -g "$USEGPU" -te "$MODELEPOCH" -se "$EPOCHSAVE" -pg pretrained/f0G"$MODELSAMPLE".pth -pd pretrained/f0D"$MODELSAMPLE".pth -l "$ONLYLATEST" -c "$CACHEDATA"
