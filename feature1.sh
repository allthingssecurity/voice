#!/bin/bash

# Configuration
MODELNAME="amit"
THREADCOUNT=8
ALGO="harvest"

# Command to run the Python script with the specified parameters
python3 extract_f0_print.py logs/"$MODELNAME" "$THREADCOUNT" "$ALGO"
