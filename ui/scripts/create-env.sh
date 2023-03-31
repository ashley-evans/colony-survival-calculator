#!/bin/bash

usage() {
    echo "Usage:
    -e [Environment to deploy]" 1>&2;
    exit 1;
}

while getopts "e:h" opt; do
    case $opt in
        e)
            environment=$OPTARG
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
api_infra_dir="$repository_dir/api/infra"

set -e

echo "Ensuring terraform is initialised for API..."
terraform -chdir="$api_infra_dir" init -input=false -backend-config="$repository_dir/infra/remote-state.tfbackend" > /dev/null

echo "Switching to API environment: $environment"
terraform -chdir="$api_infra_dir" workspace select $environment

identity_pool_id=$(terraform -chdir="$api_infra_dir" output identity_pool_id)
graphql_api_url=$(terraform -chdir="$api_infra_dir" output graphql_api_url)

echo "Creating .env file..."

env_file_path="$script_parent_dir/.env"
echo "VITE_IDENTITY_POOL_ID=$identity_pool_id" > $env_file_path
echo "VITE_GRAPHQL_API_URL=$graphql_api_url" >> $env_file_path
echo "VITE_AWS_REGION=\"eu-west-1\"" >> $env_file_path
