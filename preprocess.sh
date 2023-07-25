#!/bin/bash

# Configuration
MODELNAME="amit"
BITRATE=48000
THREADCOUNT=8

# Command to run the Python script with the specified parameters
python3 trainset_preprocess_pipeline_print.py /content/dataset "$BITRATE" "$THREADCOUNT" logs/"$MODELNAME" True
