// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Token contract", function() {
    // Mocha has four functions that let you hook into the the test runner's
    // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

    // They're very useful to setup the environment for tests, and to clean it
    // up after they run.

    // A common pattern is to declare some variables, and assign them in the
    // `before` and `beforeEach` callbacks.

    let Token;
    let hardhatToken;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    // `beforeEach` will run before each test, re-deploying the contract every
    // time. It receives a callback, which can be async.
    beforeEach(async function() {
        // Get the ContractFactory and Signers here.
        Token = await ethers.getContractFactory("MyToken");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // To deploy our contract, we just have to call Token.deploy() and await
        // for it to be deployed(), which happens once its transaction has been
        // mined.

        hardhatToken = await Token.deploy();
    });

    // You can nest describe calls to create subsections.
    describe("Deployment", function() {
        it("Should set the right owner", async function() {
            expect(await hardhatToken.owner()).to.equal(owner.address);
        });

        // it("Should have the correct metadata", async function() {
        //     await hardhatToken.safeMint(owner.address);
        //     const tokenURI = await hardhatToken.tokenURI(0);
        //     console.log(tokenURI)
        // });
    });

    describe("Transactions", function() {
        it("Should be able to mint an NFT", async function() {
            const initialBalance = await hardhatToken.balanceOf(owner.address);
            await hardhatToken.safeMint(owner.address);
            balanceAfterMint = await hardhatToken.balanceOf(owner.address);
            expect(balanceAfterMint).to.equal(initialBalance + 1);
        });

        it("Should be able to transfer an NFT", async function() {
            await hardhatToken.safeMint(owner.address);
            let ownerOfNFT = await hardhatToken.ownerOf(0);
            expect(ownerOfNFT).to.equal(owner.address);
            const initialAddr1Balance = await hardhatToken.balanceOf(owner.address);
            const initialAddr2Balance = await hardhatToken.balanceOf(addr2.address);
            await hardhatToken.transferFrom(owner.address, addr2.address, 0);
            const addr1Balance = await hardhatToken.balanceOf(owner.address);
            const addr2Balance = await hardhatToken.balanceOf(addr2.address);
            ownerOfNFT = await hardhatToken.ownerOf(0);
            expect(ownerOfNFT).to.equal(addr2.address);
            expect(addr1Balance).to.equal(initialAddr1Balance - 1);
            expect(addr2Balance).to.equal(initialAddr2Balance + 1);
        });
    });

    describe("Validating", function() {
        it("Should be able prove ownership of an NFT", async function() {
            await hardhatToken.safeMint(owner.address);
            const tokenId = 0;
            const ownerOfNFT = await hardhatToken.ownerOf(tokenId);
            expect(ownerOfNFT).to.equal(owner.address);
            const secret = "42985";
            await expect(hardhatToken.proveOwnership(tokenId, secret))
                .to.emit(hardhatToken, 'OwnershipApprovalRequest')
                .withArgs(owner.address, tokenId, secret);
        });
    });
});