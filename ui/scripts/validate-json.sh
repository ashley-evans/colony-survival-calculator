#!/bin/bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
root_dir="$( dirname "$script_dir")"

schema_folder="$root_dir/src/schemas"
static_json_folder="$root_dir/public/json"

npx --yes ajv-cli -s "$schema_folder/items.json" -d "$static_json_folder/items.json"
