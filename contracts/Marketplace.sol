// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Marketplace is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;
    
    address public nftContract;
    uint256 MAX_PRICE = 5 ether;
     
    constructor() {
        nftContract = 0xF0d755B10B0B1B5c96d00d84152385F9Fd140739;
    }
     
    struct MarketItem {
        uint itemId;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }
     
    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(uint256 => bool) private listedTokens;
     
    event MarketItemListed (
        uint indexed itemId,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
     
    event MarketItemSold (
        uint indexed itemId,
        address owner
    );

    function setNFTContractAddress(address contractAddress) external onlyOwner {
        nftContract = contractAddress;
    }

    function setMaxPrice(uint256 max) external onlyOwner {
        MAX_PRICE = max;
    }

    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        require(!listedTokens[tokenId], "NFT already listed");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), "Contract doesn't have approval");
        require(msg.sender == IERC721(nftContract).ownerOf(tokenId), "NFT not owned");
        require(price <= MAX_PRICE, "Max Price exceeded");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        listedTokens[tokenId] = true;

        emit MarketItemListed(
                itemId,
                tokenId,
                msg.sender,
                address(0),
                price,
                false
            );
    }

    function purchaseNFT(address to, uint256 itemId) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        bool sold = idToMarketItem[itemId].sold;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        require(sold != true, "This Sale has alredy finished");
        emit MarketItemSold(
            itemId,
            to
        );

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).safeTransferFrom(idToMarketItem[itemId].seller, to, tokenId);
        idToMarketItem[itemId].owner = payable(to);
        _itemsSold.increment();
        idToMarketItem[itemId].sold = true;
        delete listedTokens[tokenId];
    }

    function delistNFT(uint256 itemId) public payable nonReentrant {
        uint tokenId = idToMarketItem[itemId].tokenId;
        require(!listedTokens[tokenId], "NFT already listed");
        require(msg.sender == IERC721(nftContract).ownerOf(tokenId), "NFT not owned");

        delete idToMarketItem[itemId];
    }
        
    //get all items for sale
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemIds.current();
        uint unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
      
}

/// Thanks for inspiration: https://github.com/dabit3/polygon-ethereum-nextjs-marketplace/