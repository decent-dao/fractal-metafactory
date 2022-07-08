//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

import "@fractal-framework/core-contracts/contracts/ModuleFactoryBase.sol";
import "./ITreasuryModuleFactory.sol";
import "./ITreasuryModule.sol";

/// @notice A factory contract for deploying Treasury Modules
contract TreasuryModuleFactory is
    ModuleFactoryBase,
    ITreasuryModuleFactory
{
    event TreasuryCreated(
        address indexed treasuryAddress,
        address indexed accessControl
    );

    function initialize() external initializer {
        __initFactoryBase();
        _registerInterface(type(ITreasuryModuleFactory).interfaceId);
    }

    /// @dev Creates a Treasury module
    /// @param creator The address creating the module
    /// @param data The array of bytes used to create the module
    /// @return address[] The array of addresses of the created module
    function create(address creator, bytes[] calldata data)
        external
        override
        returns (address[] memory)
    {
        address[] memory createdContracts = new address[](1);

        address accessControl = abi.decode(data[0], (address));
        address treasuryImplementation = abi.decode(data[1], (address));
        bytes32 salt = abi.decode(data[2], (bytes32));

        createdContracts[0] = Create2.deploy(
            0,
            keccak256(abi.encodePacked(creator, msg.sender, block.chainid, salt)),
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(treasuryImplementation, "")
            )
        );
        ITreasuryModule(payable(createdContracts[0])).initialize(accessControl);

        emit TreasuryCreated(createdContracts[0], accessControl);

        return createdContracts;
    }
}