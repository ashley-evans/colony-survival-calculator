#!/bin/bash

set -e

script_dir="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

# Generate all

yarn json2ts -i "$script_dir/schemas/*.json" -o "$script_dir/types/generated/" --enableConstEnums false
yarn json2ts --cwd "$script_dir/../../api/src/json/schemas" -i "$script_dir/../../api/src/json/schemas/*.json" -o "$script_dir/types/generated/" --enableConstEnums false

# Convert .d.ts to .ts to ensure included in build output

find "$script_dir/types/generated/" -type f -name "*.d.ts" -exec sh -c 'mv "$0" "${0%.d.ts}.ts"' {} \;
