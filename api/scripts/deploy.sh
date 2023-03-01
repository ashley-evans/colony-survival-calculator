#!/bin/bash

usage() {
    echo "Usage:
    -e [Environment to deploy]
    -d [Flag: Dry-run]
    -t [Flag: Teardown environment]" 1>&2;
    exit 1;
}

while getopts "e:dth" opt; do
    case $opt in
        e)
            environment=$OPTARG
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

script_parent_dir=$(dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")
repository_dir="$(dirname "$script_parent_dir")"
infra_dir="$script_parent_dir/infra"

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
    echo "Deploying UI for environment: $environment..."
    terraform -chdir="$infra_dir" apply -auto-approve -var-file="$infra_dir/$environment.tfvars"
fi
