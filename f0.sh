#!/bin/bash

# Configuration
MODELNAME="amit"

# Command to run the Python script with the specified parameters
python3 extract_feature_print.py cpu 1 0 0 logs/"$MODELNAME"
