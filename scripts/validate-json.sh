#!/bin/bash

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
root_dir="$( dirname "$script_dir")"

json_folder="$root_dir/src/assets/json"

npx ajv-cli -s "$json_folder/schemas/item.json" -d "$json_folder/items/*.json"
