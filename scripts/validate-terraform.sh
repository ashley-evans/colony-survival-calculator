#!/bin/bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
root_dir="$( dirname "$script_dir")"

folders=$(find $root_dir -type f -name '*.tf' -exec dirname {} \; | uniq)
for folder in $folders; do
    echo "Validating all terraform files in $folder"
    terraform -chdir=$folder validate

    exit_code=$(echo $?)
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi
done
