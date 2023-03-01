#!/bin/bash

usage() {
    echo "Usage:
    -r [Required: Root path to search for terraform files in]" 1>&2;
    exit 1;
}

while getopts "r:h" opt; do
    case $opt in
        r)
            root=$OPTARG
            ;;
        h)
            usage
            ;;
        ?)
            usage
            ;;
    esac
done

if [ -z $root ]; then
    usage
fi

script_parent_dir=$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")

folders=$(find $root -type f -name '*.tf' ! -path "*/.terraform/*" -exec dirname {} \; | uniq)
for folder in $folders; do
    echo "Ensuring terraform is initialised..."
    terraform -chdir="$folder" init -input=false -backend-config="$script_parent_dir/infra/remote-state.tfbackend" > /dev/null

    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi

    echo "Validating all terraform files in $folder..."
    terraform -chdir="$folder" validate

    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi
done
