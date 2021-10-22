const { expectRevert, time } = require("@openzeppelin/test-helpers");
const DAO = artifacts.require("DAO");

contract("DAO", (accounts) => {
    let dao = null;
    const admin = accounts[0];
    const investor1 = accounts[1];
    const investor2 = accounts[2];
    const investor3 = accounts[3];
    const nonInvestor = accounts[4];

    // contract parameters
    const contributionTime = 300;
    const voteTime = 300;
    const quorum = 50;

    beforeEach(async() => {
        dao = await DAO.new(contributionTime, voteTime, quorum, { from: admin });
    });

    it("should initialize contract correctly", async() => {
        const _voteTime = await dao.voteTime();
        const _quorom = await dao.quorum();
        const _admin = await dao.admin();

        assert(_voteTime.toNumber() === voteTime);
        assert(_quorom.toNumber() === quorum);
        assert(_admin === admin);
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

    it("should allow multiple investors to contribute", async() => {
        await dao.contribute({ from: investor1, value: 1000 });
        await dao.contribute({ from: investor2, value: 2000 });

        const isInvestor1 = await dao.investors(investor1);
        const isInvestor2 = await dao.investors(investor2);
        const availableFunds = await dao.availableFunds();
        const investorShares1 = await dao.shares(investor1);
        const investorShares2 = await dao.shares(investor2);
        const totalShares = await dao.totalShares();

        assert(isInvestor1);
        assert(isInvestor2);
        assert(availableFunds.toNumber() === 3000);
        assert(investorShares1.toNumber() === 1000);
        assert(investorShares2.toNumber() === 2000);
        assert(totalShares.toNumber() === 3000);
    });

    it("should close contribution ability after contribution time period", async() => {
        await time.increase(contributionTime + 1000);
        await expectRevert(
            dao.contribute({ from: investor1, value: 1000 }),
            "cannot contribute after contributionEnd"
        );
    });

    it("should withdraw ether", async() => {
        await dao.contribute({ from: investor1, value: 1000 });
        const balanceBefore = await web3.eth.getBalance(investor1);
        await dao.withdrawEther(1000, investor1);
        const balanceAfter = await web3.eth.getBalance(investor1);
        balanceAfterBN = web3.utils.toBN(balanceAfter);
        balanceBeforeBN = web3.utils.toBN(balanceBefore);

        assert(balanceAfterBN.sub(balanceBeforeBN).toNumber() === 1000);
    });

    it("should create proposal", async() => {
        await dao.contribute({ from: investor1, value: 1000 });
        await dao.createProposal("token", 1000, accounts[5], { from: investor1 });
        const proposal = await dao.proposals(0);

        assert(proposal.name === "token");
        assert(proposal.amount.toNumber() === 1000);
        assert(proposal.recipient === accounts[5]);
        assert(proposal.votes.toNumber() === 0);
        assert(proposal.executed === false);
    });

    it("should NOT allow a non-investor to create proposal", async() => {
        await dao.contribute({ from: investor1, value: 1000 });
        expectRevert(
            dao.createProposal("token", 1000, accounts[5], { from: investor1 }),
            "only investors"
        );
    });

})