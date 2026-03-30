#!/bin/bash

pattern="localhost\|127\.0\.0\.1"

file="./src"

grep -r "$pattern" "$file"
if [ $? -eq 0 ]; then
	echo "Error: Pattern '$pattern' found in $file"
    exit 1
fi

echo "Pattern '$pattern' not found. No error."
