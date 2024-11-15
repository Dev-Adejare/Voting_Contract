const hre = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Voting Contract", function () {
  async function VotingConract() {
    const [owner, voter1, voter2, voter3] = await hre.ethers.getSigners();

    const VotingLib = await hre.ethers.getContractFactory("VotingLib");
    const votingLib = await VotingLib.deploy();
    const votingLibAddress = await votingLib.getAddress();
    const Voting = await hre.ethers.getContractFactory("Voting", {
      libraries: {
        VotingLib: votingLibAddress,
      },
    });
    const voting = await Voting.deploy();
    await voting.getAddress();
    return { voting, owner, voter1, voter2, voter3 };
  }

  describe("Voting Process Tests", function () {
    beforeEach(async function () {
      const { voting } = await loadFixture(VotingConract);
      // Add candidates and start voting
      await voting.addCandidate(1);
      await voting.addCandidate(2);
      // await voting.startVoting();
    });

    it("should correctly add candidates", async function () {
      const { voting } = await loadFixture(VotingConract);
      expect(await voting.isCandidateExists(1)).to.be.true;
      expect(await voting.isCandidateExists(2)).to.be.true;
      expect(await voting.isCandidateExists(3)).to.be.false;
    });

    it("should allow voters to cast votes", async function () {
      const { voting, voter1 } = await loadFixture(VotingConract);
      await voting.connect(voter1).vote(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
      expect(await voting.getVotesForCandidate(1)).to.equal(1);
    });

    it("should prevent double voting", async function () {
      const { voting, voter1 } = await loadFixture(VotingConract);
      await voting.connect(voter1).vote(1);
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "Voter has already voted"
      );
    });

    it("should prevent voting for non-existent candidate", async function () {
      const { voting, voter1 } = await loadFixture(VotingConract);
      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith(
        "Invalid candidate"
      );
    });

    it("should correctly tally votes and determine winner", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      // Cast votes
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      await voting.connect(voter3).vote(1);

      // Check individual vote counts
      expect(await voting.getVotesForCandidate(1)).to.equal(2);
      expect(await voting.getVotesForCandidate(2)).to.equal(1);

      // Check winner
      const [winnerId, winningVotes] = await voting.getWinner();
      expect(winnerId).to.equal(1);
      expect(winningVotes).to.equal(2);
    });

    it("should handle ties by selecting the first candidate", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);

      const [winnerId, winningVotes] = await voting.getWinner();
      expect(winningVotes).to.equal(1);
    });
  });

  describe("Voting Status Tests", function () {
    beforeEach(async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      await voting.addCandidate(1);
    });

    it("should prevent voting when voting is not open", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "Voting is not open"
      );
    });

    it("should allow voting after voting is opened", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      await voting.startVoting();
      await voting.connect(voter1).vote(1);
      expect(await voting.hasVoted(voter1.address)).to.be.true;
    });

    it("should prevent voting after voting is closed", async function () {
      const { voting, voter1, voter2, voter3 } = await loadFixture(
        VotingConract
      );
      await voting.startVoting();
      await voting.endVoting();
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "Voting is not open"
      );
    });
  });
});