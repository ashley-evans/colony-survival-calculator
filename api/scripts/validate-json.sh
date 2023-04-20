#!/bin/bash

script_dir=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")
script_parent_dir="$(dirname "$script_dir")"

json_folder="$script_parent_dir/src/json"
schema_folder="$json_folder/schemas"

npx --yes ajv-cli validate -s "$schema_folder/items.json" \
    -d "$json_folder/items.json" \
    -c "$script_dir/ts-json-keywords.js"
