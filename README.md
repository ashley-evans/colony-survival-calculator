# Colony Survival Calculator

[![Validate and Create Release](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml)
[![Deploy Release](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/cd.yml/badge.svg)](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/cd.yml)

Job/Resource ratio calculator for Colony Survival

## Active Deployments

The currently deployed version of the application can be found at the following URLs:

- https://factorycalculator.com/
- https://factorycalculator.co.uk/

## Requirements

| Name      | Version   | Instructions                                        |
| --------- | --------- | --------------------------------------------------- |
| Terraform | >= 1.10.5 | https://developer.hashicorp.com/terraform/downloads |

## Setup

Ensure that all scripts have the permission to run on your system, this can be done by running the following command:

```sh
chmod u+x $(find . -type f -name "*.sh" | egrep -v "(/node_modules/|/\.husky/)")
```

## Installing dependencies

The project uses Lerna to run tasks against packages inside the repository. Running the following command will install all required dependencies for all packages:

```sh
yarn ci
```

### Deploying infrastructure

#### Deploying

Run the following command to setup the infrastructure for development:

```sh
yarn lerna run deploy -- -e dev
```

#### Tearing down

Run the following command to remove any deployed infrastructure for development:

```sh
yarn lerna run deploy -- -e dev -t
```

#### CI Setup

To enable the Github actions to deploy the infrastructure for production/testing, you must first create the deployment role in AWS by running the following command:

> Note: This requires the ARNs of a S3 Bucket, DynamoDB table, Read/write policy to access the bucket and table, and an OpenID Connect Provider that is configured to work with Github Actions

```sh
terraform apply -chdir=./infra/deploy
```

Once applied, the `deploy_role_arn` needs to be set as a repository secret under the name `DEPLOY_ROLE_ARN` in Github
