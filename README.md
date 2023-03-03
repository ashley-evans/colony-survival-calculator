# Colony Survival Calculator

[![Validate and Create Release](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/ci.yml)
[![Deploy Release](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/cd.yml/badge.svg)](https://github.com/ashley-evans/colony-survival-calculator/actions/workflows/cd.yml)

Job/Resource ratio calculator for Colony Survival

## Active Deployments

The currently deployed version of the application can be found at the following URLs:

-   https://factorycalculator.com/
-   https://factorycalculator.co.uk/

## Requirements

| Name      | Version  | Instructions                                        |
| --------- | -------- | --------------------------------------------------- |
| Terraform | >= 1.3.7 | https://developer.hashicorp.com/terraform/downloads |

## Setup

Ensure that all scripts have the permission to run on your system, this can be done by running the following command:

```sh
chmod u+x $(find . -type f -name "*.sh" | egrep -v "(/node_modules/|/\.husky/)")
```

## Installing dependencies

The project uses Lerna to run tasks against packages inside the repository. Running the following command will install all required dependencies for all packages:

```sh
npm run ci
```

### Deploying infrastructure

Run the following command to setup the UI infrastructure for development:

```sh
npx lerna run deploy -- -e dev
```

### Tearing down infrastructure

Run the following command to remove any deployed UI infrastructure for development:

```sh
npx lerna run deploy -- -e dev -t
```