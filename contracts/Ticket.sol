// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "base64-sol/base64.sol";

import "hardhat/console.sol";

contract Ticket is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string imageURI = "ipfs://QmPtUx44pEg6KtorBrcjNxJYwx7S1nY7NPoCpmLUXxcBts";
    address marketplaceContract;
    bool _transferLock;

    constructor() ERC721("Ticket", "TIK") {}

    event OwnershipApprovalRequest(address ownerAddress, uint256 tokenId, uint16 secret);

    function setMarketplaceContractAddress(address contractAddress) external onlyOwner {
        marketplaceContract = contractAddress;
    }

    function setTransferLock(bool val) external onlyOwner {
        _transferLock = val;
    }

    function safeMint(address to) public {
        _safeMint(to, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }

    /**
   * Override isApprovedForAll to auto-approve OS's proxy contract
   */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        // our marketplace contract
       if (_operator == address(marketplaceContract)) {
            return true;
        }

        // otherwise, use the default ERC1155.isApprovedForAll()
        return super.isApprovedForAll(_owner, _operator);
    }

    function proveOwnership(uint256 tokenId, uint16 secret) external {
        require(msg.sender == ownerOf(tokenId));
        emit OwnershipApprovalRequest(msg.sender, tokenId, secret);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(!_transferLock, "Trading Locked");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(!Address.isContract(to) && to != marketplaceContract, "ERC721: transfer not permitted");
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        require(!_transferLock, "Trading Locked");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(!Address.isContract(to) && to != marketplaceContract, "ERC721: transfer to smart contracts not permitted");
        _safeTransfer(from, to, tokenId, _data);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(!_transferLock, "Trading Locked");
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(!Address.isContract(to) && to != marketplaceContract, "ERC721: transfer to smart contracts not permitted");

        _transfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        string memory tokenIdToString = Strings.toString(tokenId);
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "NFT Ticket #', tokenIdToString, '", "description": "An NFT based version of traditional Event Tickets", "image": "', imageURI, '"}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}