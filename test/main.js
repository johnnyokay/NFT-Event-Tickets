// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Token contract", function() {
    let Ticket;
    let ticket;
    let Marketplace;
    let marketplace;

    let owner;
    let addr1;
    let addr2;
    let addrs;
    let provider;

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function() {
        Ticket = await ethers.getContractFactory("Ticket");
        Marketplace = await ethers.getContractFactory("Marketplace");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        provider = ethers.provider;

        ticket = await Ticket.deploy();
        marketplace = await Marketplace.deploy();
        marketplace.setNFTContractAddress(ticket.address);
        ticket.setMarketplaceContractAddress(marketplace.address);
    });

    // You can nest describe calls to create subsections.
    describe("Deployment", function() {
        it("Should set the right owner", async function() {
            expect(await ticket.owner()).to.equal(owner.address);
        });

        // it("Should have the correct metadata", async function() {
        //     await ticket.safeMint(owner.address);
        //     const tokenURI = await ticket.tokenURI(0);
        //     console.log(tokenURI)
        // });
    });

    describe("Transactions", function() {
        it("Should be able approved", async function() {
            const initialBalance = await ticket.balanceOf(owner.address);
            await ticket.safeMint(owner.address);
            balanceAfterMint = await ticket.balanceOf(owner.address);
            expect(balanceAfterMint).to.equal(initialBalance + 1);

            const isApproved = await ticket.isApprovedForAll(
                owner.address,
                marketplace.address
            );
            expect(isApproved).to.equal(true);
        });

        it("Should be able to mint an NFT", async function() {
            const initialBalance = await ticket.balanceOf(owner.address);
            await ticket.safeMint(owner.address);
            balanceAfterMint = await ticket.balanceOf(owner.address);
            expect(balanceAfterMint).to.equal(initialBalance + 1);
        });

        it("Should be able to transfer an NFT", async function() {
            await ticket.safeMint(owner.address);
            let ownerOfNFT = await ticket.ownerOf(0);
            expect(ownerOfNFT).to.equal(owner.address);
            const initialAddr1Balance = await ticket.balanceOf(owner.address);
            const initialAddr2Balance = await ticket.balanceOf(addr2.address);
            await ticket.transferFrom(owner.address, addr2.address, 0);
            const addr1Balance = await ticket.balanceOf(owner.address);
            const addr2Balance = await ticket.balanceOf(addr2.address);
            ownerOfNFT = await ticket.ownerOf(0);
            expect(ownerOfNFT).to.equal(addr2.address);
            expect(addr1Balance).to.equal(initialAddr1Balance - 1);
            expect(addr2Balance).to.equal(initialAddr2Balance + 1);
        });
    });

    describe("Marketplace", function() {
        it("Should list an NFT", async function() {
            const initialBalance = await ticket.balanceOf(owner.address);
            await ticket.safeMint(owner.address);
            balanceAfterMint = await ticket.balanceOf(owner.address);
            expect(balanceAfterMint).to.equal(initialBalance + 1);

            let ownerBalance = await provider.getBalance(owner.address);

            await marketplace.listNFT(0, 1);
            await marketplace.listNFT(0, 1);

            await marketplace.purchaseNFT(addr2.address, 1, { value: 1 });
            console.log(await marketplace.fetchMarketItems());

            let ownerBalance2 = await provider.getBalance(owner.address);
        });

        it("Transfer Lock", async function() {
            await ticket.safeMint(owner.address);
            let ownerOfNFT = await ticket.ownerOf(0);
            expect(ownerOfNFT).to.equal(owner.address);
            const initialAddr1Balance = await ticket.balanceOf(owner.address);
            const initialAddr2Balance = await ticket.balanceOf(addr2.address);
            await ticket.transferFrom(
                owner.address,
                "0x83888708685BA300315118a90d49fCA8060D217d",
                0
            );
            const addr1Balance = await ticket.balanceOf(owner.address);
            const addr2Balance = await ticket.balanceOf(addr2.address);
            ownerOfNFT = await ticket.ownerOf(0);
            console.log(ownerOfNFT);
            expect(ownerOfNFT).to.equal(addr2.address);
            expect(addr1Balance).to.equal(initialAddr1Balance - 1);
            expect(addr2Balance).to.equal(initialAddr2Balance + 1);
        });

        it("Should be able to transfer an NFT", async function() {
            await ticket.safeMint(owner.address);
            let ownerOfNFT = await ticket.ownerOf(0);
            expect(ownerOfNFT).to.equal(owner.address);
            const initialAddr1Balance = await ticket.balanceOf(owner.address);
            const initialAddr2Balance = await ticket.balanceOf(addr2.address);
            await ticket.transferFrom(owner.address, addr2.address, 0);
            const addr1Balance = await ticket.balanceOf(owner.address);
            const addr2Balance = await ticket.balanceOf(addr2.address);
            ownerOfNFT = await ticket.ownerOf(0);
            expect(ownerOfNFT).to.equal(addr2.address);
            expect(addr1Balance).to.equal(initialAddr1Balance - 1);
            expect(addr2Balance).to.equal(initialAddr2Balance + 1);
        });
    });

    describe("Validating", function() {
        it("Should be able prove ownership of an NFT", async function() {
            await ticket.safeMint(owner.address);
            const tokenId = 0;
            const ownerOfNFT = await ticket.ownerOf(tokenId);
            expect(ownerOfNFT).to.equal(owner.address);
            const secret = 4298;
            await expect(ticket.proveOwnership(tokenId, secret))
                .to.emit(ticket, "OwnershipApprovalRequest")
                .withArgs(owner.address, tokenId, secret);
        });
    });
});