const hre = require("hardhat");

async function main() {
  try {
    console.log(" ##### Deploying Voting Contract ###### ");

    const [owner, voterA, voterB, voterC] = await hre.ethers.getSigners();

    const VotingLib = await hre.ethers.getContractFactory("VotingLib");
    const votingLib = await VotingLib.deploy();
    const votingLibAddress = await votingLib.getAddress();
    const Voting = await hre.ethers.getContractFactory("Voting", {
      libraries: {
        VotingLib: votingLibAddress,
      },
    });
    const voting = await Voting.deploy();
    const votingAddress = await voting.getAddress();

    console.log(`Voting Contract deployed to: ${votingAddress}`);
    console.log(`Owner address: ${owner.address}`);

    console.log("\nAdding candidates...");
    await voting.addCandidate(1);
    await voting.addCandidate(2);
    console.log("Added candidates with IDs: A, B");

    console.log("\nStarting voting session...");
    await voting.startVoting();
    console.log("Voting session started");

    console.log("\nCasting votes...");
    const vote1 = await voting.connect(voterA).vote(1);
    await vote1.wait();
    console.log(`VoterA (${voterA.address}) voted for candidate A`);

    const vote2 = await voting.connect(voterB).vote(2);
    await vote2.wait();
    console.log(`VoterB (${voterB.address}) voted for candidate B`);

    const vote3 = await voting.connect(voterC).vote(1);
    await vote3.wait();
    console.log(`VoterC (${voterC.address}) voted for candidate A`);

    console.log("\nRetrieving winner...");
    const [winnerId, winningVotes] = await voting.getWinner();
    console.log(`Winning Candidate ID: ${winnerId}`);
    console.log(`Winning Vote Count: ${winningVotes}`);

    const votesA = await voting.getVotesForCandidate(1);
    const votesB = await voting.getVotesForCandidate(2);

    console.log("\nFinal Vote Counts:");
    console.log(`Candidate A: ${votesA} votes`);
    console.log(`Candidate B: ${votesB} votes`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });