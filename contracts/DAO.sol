pragma solidity ^0.8.9;

contract DAO {
    struct Proposal {
        uint id;
        string name;
        uint amount;
        address payable recipient;
        uint votes;
        uint end; // time of end of Proposal
        bool executed;
    }
    mapping(address => bool) public investors;
    mapping(address => uint) public shares;
    mapping(uint => Proposal) public proposals;
    mapping(address => mapping(uint => bool)) public votes;
    uint public totalShares;
    uint public availableFunds;
    uint public contributionEnd; // close-ended fund, cannot contribute more money once this contribution period ends
    uint public nextProposalId;
    uint public voteTime;
    uint public quorum; // threshold of yes votes for a proposal to be executed
    address public admin;
    
    constructor(
        uint contributionTime,
        uint _voteTime,
        uint _quorum) {
            require(_quorum > 0 && _quorum < 100, "quorum must be between 0 and 100");
            
            contributionEnd = block.timestamp + contributionTime;
            voteTime = _voteTime;
            quorum = _quorum;
            admin = msg.sender;
    }
    
    function contribute() payable external {
        require(block.timestamp < contributionEnd, "cannot contribute after contributionEnd");
        
        investors[msg.sender] = true;
        shares[msg.sender] += msg.value; // 1 wei = 1 share
        totalShares += msg.value;
        availableFunds += msg.value;
    }
    
    function redeemShares(uint amount) external {
        require(shares[msg.sender] >= amount, "not enough shares");
        require(availableFunds >= amount, "not enough availableFunds");
        
        shares[msg.sender] -= amount;
        availableFunds -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    function transferShare(uint amount, address to) external {
        require(shares[msg.sender] >= amount, "not enough shares");
        
        shares[msg.sender] -= amount;
        shares[to] += amount;
        investors[to] = true;
    }
    
    function createProposal(
        string memory name,
        uint amount,
        address payable recipient) 
        external
        onlyInvestors() {
            require(availableFunds >= amount, "amount too big");
            
            proposals[nextProposalId] = Proposal(
                nextProposalId,
                name,
                amount,
                recipient,
                0,
                block.timestamp + voteTime,
                false
            );
            
            availableFunds -= amount;
            nextProposalId++;
        }
        
    function vote(uint proposalId) external onlyInvestors() {
        Proposal storage proposal = proposals[proposalId];
        require(votes[msg.sender][proposalId] == false, "investor can only vote once for a proposal");
        require(block.timestamp < proposal.end, "can only vote until proposal end");
        
        votes[msg.sender][proposalId] = true;
        proposal.votes += shares[msg.sender];
        
    }
    
    function executeProposal(uint proposalId) external onlyAdmin() {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.end, "cannot execute a proposal before end date");
        require(proposal.executed == false, "cannot execute a proposal already executed");
        require((proposal.votes / totalShares) * 100 >= quorum, "cannot execute a proposal with votes below quorum");
        
        _transferEther(proposal.amount, proposal.recipient);
    }
    
    function withdrawEther(uint amount, address payable to) external onlyAdmin() {
        _transferEther(amount, to);
    }
    
    receive() payable external {
        availableFunds += msg.value;
    }
    
    function _transferEther(uint amount, address payable to) internal onlyAdmin() {
        require(amount <= availableFunds, "not enough availableFunds");
        availableFunds -= amount;
        to.transfer(amount);
    }
    
    modifier onlyInvestors() {
        require(investors[msg.sender] == true, "only investors");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }
}
