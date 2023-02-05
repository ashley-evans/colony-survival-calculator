#!/bin/bash

usage() {
    echo "Usage:
    -e [Environment to deploy]
    -d [Flag: Dry-run]" 1>&2;
    exit 1;
}

while getopts "e:dh" opt; do
    case $opt in
        e)
            environment=$OPTARG
            ;;
        d)
            dryrun=true
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

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
root_dir="$( dirname "$script_dir")"

ui_infra_dir="$root_dir/infra/ui"

echo "Ensuring terraform is initialised..."

terraform -chdir="$ui_infra_dir" init -input=false -backend-config="../remote-state.tfbackend" > /dev/null

exit_code=$(echo $?)
if [ $exit_code -ne 0 ]; then
    exit $exit_code
fi

echo "Switching to environment: $environment"

terraform -chdir="$ui_infra_dir" workspace select $environment

exit_code=$(echo $?)
if [ $exit_code -ne 0 ]; then
    exit $exit_code
fi

exit_code=$(echo $?)
if [ $exit_code -ne 0 ]; then
    exit $exit_code
fi

if [ $dryrun ]; then
    echo "Dry run deployment of UI for environment: $environment..."
    terraform -chdir="$ui_infra_dir" plan -var-file="$ui_infra_dir/$environment.tfvars"
else
    echo "Deploying UI for environment: $environment..."
    terraform -chdir="$ui_infra_dir" apply -auto-approve -var-file="$ui_infra_dir/$environment.tfvars"
fi
