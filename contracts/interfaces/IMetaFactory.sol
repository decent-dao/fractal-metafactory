//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@fractal-framework/core-contracts/contracts/interfaces/IDAOFactory.sol";

interface IMetaFactory {
    event Executed(address[] targets, uint256[] values, bytes[] calldatas);

    error UnequalArrayLengths();

    /// @notice A function for executing function calls to deploy an MVD, modules, and initialize them
    /// @param targets An array of addresses to target for the function calls
    /// @param values An array of ether values to send with the function calls
    /// @param calldatas An array of bytes defining the function calls
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) external;
}
