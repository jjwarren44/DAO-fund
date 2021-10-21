const { expectRevert } = require("@openzeppelin/test-helpers");
const DAO = artifacts.require("DAO");

contract("DAO", (accounts) => {
    let dao = null;
    let admin = accounts[0];
    let investor1 = accounts[1];
    let investor2 = accounts[2];
    let investor3 = accounts[3];
    let nonInvestor = accounts[4];

    beforeEach(async() => {
        dao = await DAO.new(30, 30, 50);
    });

    it("should allow contribution", async() => {
        await dao.contribute({ from: investor1, value: 1000 });

        const isInvestor = await dao.investors(investor1);
        const availableFunds = await dao.availableFunds();
        const investorShares = await dao.shares(investor1);
        const totalShares = await dao.totalShares();

        assert(isInvestor);
        assert(availableFunds.toNumber() === 1000);
        assert(investorShares.toNumber() === 1000);
        assert(totalShares.toNumber() === 1000);
    });
})