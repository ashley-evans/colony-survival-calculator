#!/bin/bash

script_parent_dir=$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")

json_folder="$script_parent_dir/src/json"
schema_folder="$json_folder/schemas"

npx --yes ajv-cli -s "$schema_folder/items.json" -d "$json_folder/items.json"
