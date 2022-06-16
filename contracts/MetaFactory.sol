//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/governance/utils/IVotesUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./interfaces/IMetaFactory.sol";
import "@fractal-framework/core-contracts/contracts/interfaces/IDAO.sol";
import "@fractal-framework/core-contracts/contracts/interfaces/IDAOAccessControl.sol";

// Give the metafactory a temporary execute role (this is done in the DAO / access control creation)
// Create the DAO and access control contracts
// Create the DAO modules
// Add actions roles
// Add Module roles

/// @notice A factory contract for deploying DAOs along with any desired modules within one transaction
contract MetaFactory is IMetaFactory, ERC165 {
    /// @notice A function for executing function calls to deploy an MVD, modules, and initialize them
    /// @param targets An array of addresses to target for the function calls
    /// @param values An array of ether values to send with the function calls
    /// @param calldatas An array of bytes defining the function calls
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external {
        if (
            targets.length != values.length ||
            targets.length != calldatas.length
        ) revert UnequalArrayLengths();
        string memory errorMessage = "DAO: call reverted without message";
        uint256 targetlength = targets.length;
        for (uint256 i = 0; i < targetlength; ) {
            (bool success, bytes memory returndata) = targets[i].call{
                value: values[i]
            }(calldatas[i]);
            Address.verifyCallResult(success, returndata, errorMessage);
            unchecked {
                i++;
            }
        }
        emit Executed(targets, values, calldatas);
    }

    /// @notice Returns whether a given interface ID is supported
    /// @param interfaceId An interface ID bytes4 as defined by ERC-165
    /// @return bool Indicates whether the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IMetaFactory).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
