//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./VotesToken.sol";

/**
 * @dev Initilizes Supply of votesToken
 */
contract VotesTokenWithSupply is VotesToken {
    /**
    * @dev Mints tokens to hodlers w/ allocations 
    * @dev Returns the difference between total supply and allocations to treasury
    * @param name Token Name
    * @param symbol Token Symbol
    * @param hodlers Array of token receivers
    * @param allocations Allocations for each receiver
    */
    constructor(
        string memory name,
        string memory symbol,
        address[] memory hodlers,
        uint256[] memory allocations
    ) VotesToken(name, symbol) {
        uint256 tokenSum;
        for (uint256 i = 0; i < hodlers.length; i++) {
            _mint(hodlers[i], allocations[i]);
            tokenSum += allocations[i];
        }
    }
}