#!/bin/bash

usage() {
    echo "Usage:
    -e [Environment to deploy]
    -r [Lambda target runtime]
    -d [Flag: Dry-run]
    -t [Flag: Teardown environment]" 1>&2;
    exit 1;
}

while getopts "e:r:dth" opt; do
    case $opt in
        e)
            environment=$OPTARG
            ;;
        r)
            runtime=$OPTARG
            ;;
        d)
            dryrun=true
            ;;
        t)
            teardown=true
            ;;
        h)
            usage
            ;;
        ?)
            usage
            ;;
    esac
done

set -e

if [ -z $environment ]; then
    environment="dev"
fi

if [ -z $runtime ]; then
    runtime="node20"
fi

current_dir=$(pwd)
script_parent_dir=$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")
repository_dir="$(dirname "$script_parent_dir")"
infra_dir="$script_parent_dir/infra"
dist_dir="$script_parent_dir/dist"
src_dir=$(realpath --relative-to $current_dir "$script_parent_dir/src")

echo "Ensuring terraform is initialised..."

terraform -chdir="$infra_dir" init -input=false -backend-config="$repository_dir/infra/remote-state.tfbackend" > /dev/null

echo "Switching to environment: $environment"

terraform -chdir="$infra_dir" workspace select $environment

echo "Building API..."
yarn --cwd $script_parent_dir run build:clean

echo "Copying package definitions and post-build scripts..."
folder_diff=$(( $(echo "$src_dir" | tr -cd '/' | wc -c) + 1 ))
yarn copyfiles -E -F -u $folder_diff \
    "$src_dir/**/node_modules/**" \
    "$src_dir/**/package*.json" \
    "$src_dir/**/post-build.sh" \
    $dist_dir

echo "Bundle code for deployment..."
find $dist_dir -type f -name "handler.js" -exec sh -c 'yarn esbuild "$0" --bundle --platform=node --target=$runtime --outfile="$(dirname "$0")/dist/index.js"' {} \;

echo "Run post-build scripts..."
find $dist_dir -type f -name "handler.js" -exec sh -c 'cd "$(dirname $0)" && test -f post-build.sh && ./post-build.sh || true' {} \;

if [ $dryrun ]; then
    echo "Dry run deployment of API for environment: $environment..."
    terraform -chdir="$infra_dir" plan -var-file="$infra_dir/$environment.tfvars"
elif [ $teardown ]; then
    echo "Tearing down API for environment: $environment..."
    terraform -chdir="$infra_dir" apply -var-file="$infra_dir/$environment.tfvars" -destroy
else
    echo "Deploying API for environment: $environment..."
    terraform -chdir="$infra_dir" apply -auto-approve -var-file="$infra_dir/$environment.tfvars"
fi
