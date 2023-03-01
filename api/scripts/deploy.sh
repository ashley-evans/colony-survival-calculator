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

if [ -z $environment ]; then
    environment="dev"
fi

if [ -z $runtime ]; then
    runtime="node18"
fi

current_dir=$(pwd)
script_parent_dir=$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")
repository_dir="$(dirname "$script_parent_dir")"
infra_dir="$script_parent_dir/infra"
dist_dir="$script_parent_dir/dist"
src_dir=$(realpath --relative-to $current_dir "$script_parent_dir/src")

echo "Ensuring terraform is initialised..."

terraform -chdir="$infra_dir" init -input=false -backend-config="$repository_dir/infra/remote-state.tfbackend" > /dev/null

exit_code=$?
if [ $exit_code -ne 0 ]; then
    exit $exit_code
fi

echo "Switching to environment: $environment"

terraform -chdir="$infra_dir" workspace select $environment

exit_code=$?
if [ $exit_code -ne 0 ]; then
    exit $exit_code
fi

if [ $dryrun ]; then
    echo "Dry run deployment of UI for environment: $environment..."
    terraform -chdir="$infra_dir" plan -var-file="$infra_dir/$environment.tfvars"
elif [ $teardown ]; then
    echo "Tearing down UI for environment: $environment..."
    terraform -chdir="$infra_dir" apply -var-file="$infra_dir/$environment.tfvars" -destroy
else
    echo "Building API..."
    npm --prefix $script_parent_dir run build:clean

    echo "Copying package definitions..."
    $script_parent_dir/node_modules/.bin/copyfiles -E -u 1 \
        -e "$src_dir/**/node_modules/**" \
        "$src_dir/**/package*.json" \
        $dist_dir
    cp $script_parent_dir/package.json $dist_dir/package.json

    echo "Installing dependencies..."
    cp $script_parent_dir/lerna.dist.json $dist_dir/lerna.json
    cd $dist_dir && npx lerna bootstrap --ci -- --production

    echo "Bundle code for deployment..."
    cd $dist_dir && npx lerna exec -- $script_parent_dir/node_modules/.bin/esbuild handler.js --bundle --platform=node --target=$runtime --outfile=dist/index.js

    echo "Deploying UI for environment: $environment..."
    terraform -chdir="$infra_dir" apply -auto-approve -var-file="$infra_dir/$environment.tfvars"
fi
