# Colony Survival Calculator

[![Validate and Deploy](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml)

Job/Resource ratio calculator for Colony Survival

# Requirements

| Name      | Version  | Instructions                                        |
| --------- | -------- | --------------------------------------------------- |
| Terraform | >= 1.3.7 | https://developer.hashicorp.com/terraform/downloads |

# Setup

Ensure that all scripts have the permission to run on your system, this can be done by running the following command:

```
chmod u+x $(find ./scripts/ -type f)
```

## Deploying infrastructure

Run the following command to setup the UI infrastructure for development:

```
./scripts/deploy.sh -e dev
```

## Tearing down infrastructure

Run the following command to remove any deployed UI infrastructure for development:

```
./scripts/deploy.sh -e dev -t
```
