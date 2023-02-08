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
elif [ $teardown ]; then
    echo "Tearing down UI for environment: $environment..."
    terraform -chdir="$ui_infra_dir" apply -var-file="$ui_infra_dir/$environment.tfvars" -destroy
else
    echo "Deploying UI for environment: $environment..."
    terraform -chdir="$ui_infra_dir" apply -auto-approve -var-file="$ui_infra_dir/$environment.tfvars"
    
    exit_code=$(echo $?)
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi

    dist_dir="$root_dir/dist"

    echo "Cleaning built file directory..."
    rm -rf $dist_dir

    exit_code=$(echo $?)
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi

    echo "Building UI..."
    npm --prefix $root_dir run build

    exit_code=$(echo $?)
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi

    bucket=$(terraform -chdir="$ui_infra_dir" output -raw static_file_bucket_name)
    
    echo "Deploying built files to S3 bucket: $bucket..."
    aws s3 cp $dist_dir "s3://$bucket" --recursive

    exit_code=$(echo $?)
    if [ $exit_code -ne 0 ]; then
        exit $exit_code
    fi

    cloudfront_dist_id=$(terraform -chdir="$ui_infra_dir" output -raw static_file_distribution_id)

    echo "Invalidating Cloudfront cache: $cloudfront_dist_id"
    aws cloudfront create-invalidation \
        --distribution-id $cloudfront_dist_id \
        --paths "/*" \
        --no-paginate | cat
fi
