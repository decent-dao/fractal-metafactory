# Fractal-Metafactory

## Architecture

Metafactory deploys MVD, Governor Contract, Treasury, Token, and any other associated modules.


### Metafactory.sol

The Metafactory contract acts as a factory proxy which quickly sets up a MVD and attaches any modules that a user would like to include. It creates permissions in the access control and removes renounces its role at the end of setup

## Local Setup & Testing

Clone the repository:
```shell
git clone ...
```

Lookup the recommended Node version to use in the .nvmrc file and install and use the correct version:
```shell
nvm install 
nvm use
```

Install necessary dependencies:
```shell
npm install
```

Compile contracts to create typechain files:
```shell
npm run compile
```

Run the tests
```shell
npm run test
```

## Local Hardhat deployment

To deploy the base Fractal contracts open a terminal and run:
```shell
npx hardhat node
```
This will deploy the following contracts and log the addresses they were deployed to:
 - MetaFactory

Deploys all other contracts for testing purposes

## Creating a module

Each module should inherit the MVD contracts to include:
 - moduleBase.sol 
 - IModuleBaseFactory.sol

Install the npm package
 ```shell
npm i fractal-contracts-package
```

Including un-compiled contracts within typechain-types. Follow theses steps hardhat plug-in https://www.npmjs.com/package/hardhat-dependency-compiler

