#!/bin/bash

script_dir=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")

cp $script_dir/node_modules/glpk.js/dist/glpk.wasm $script_dir/dist/glpk.wasm
