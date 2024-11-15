// test/Token.test.js
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("CustomToken", function () {
  let token: { admin: () => any; addMinter: (arg0: any) => any; authorizedMinters: (arg0: any) => any; connect: (arg0: any) => { (): any; new(): any; addMinter: { (arg0: any): any; new(): any; }; removeMinter: { (arg0: any): any; new(): any; }; mint: { (arg0: any, arg1: any): any; new(): any; }; transfer: { (arg0: any, arg1: any): any; new(): any; }; approve: { (arg0: any, arg1: any): any; new(): any; }; transferFrom: { (arg0: any, arg1: any, arg2: any): any; new(): any; }; }; removeMinter: (arg0: any) => any; balanceOf: (arg0: any) => any; totalSupply: () => any; allowance: (arg0: any, arg1: any) => any; };
  let owner: { address: any; };
  let minter: { address: any; };
  let user1: { address: any; };
  let user2: { address: any; };
  const initialSupply = ethers.parseUnits("1000", 18);

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Token");
    token = await Token.deploy("Starknet Token", "STK", 18);
  });

  describe("Access Control Tests", function () {
    it("should set the deployer as admin", async function () {
      expect(await token.admin()).to.equal(owner.address);
    });

    it("should allow admin to add minter", async function () {
      await token.addMinter(minter.address);
      expect(await token.authorizedMinters(minter.address)).to.be.true;
    });

    it("should prevent non-admin from adding minter", async function () {
      await expect(
        token.connect(user1).addMinter(minter.address)
      ).to.be.revertedWith("Admin alone can call this function");
    });

    it("should allow admin to remove minter", async function () {
      await token.addMinter(minter.address);
      await token.removeMinter(minter.address);
      expect(await token.authorizedMinters(minter.address)).to.be.false;
    });

    it("should prevent non-admin from removing minter", async function () {
      await token.addMinter(minter.address);
      await expect(
        token.connect(user1).removeMinter(minter.address)
      ).to.be.revertedWith("Admin alone can call this function");
    });
  });

  describe("Minting Tests", function () {
    beforeEach(async function () {
      await token.addMinter(minter.address);
    });

    it("should allow minter to mint tokens", async function () {
      await token.connect(minter).mint(user1.address, initialSupply);
      expect(await token.balanceOf(user1.address)).to.equal(initialSupply);
    });

    it("should prevent non-minter from minting tokens", async function () {
      await expect(
        token.connect(user1).mint(user2.address, initialSupply)
      ).to.be.revertedWith("Minters alone can initiate this function");
    });

    it("should update total supply after minting", async function () {
      await token.connect(minter).mint(user1.address, initialSupply);
      expect(await token.totalSupply()).to.equal(initialSupply);
    });
  });

  describe("Regular User Functions Tests", function () {
    beforeEach(async function () {
      await token.addMinter(minter.address);
      await token.connect(minter).mint(user1.address, initialSupply);
    });

    it("should allow users to check balances", async function () {
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(initialSupply);
    });

    it("should allow users to transfer tokens", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await token.connect(user1).transfer(user2.address, transferAmount);
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("should allow users to approve spending", async function () {
      const approvalAmount = ethers.parseUnits("100", 18);
      await token.connect(user1).approve(user2.address, approvalAmount);
      expect(await token.allowance(user1.address, user2.address)).to.equal(
        approvalAmount
      );
    });

    it("should allow transferFrom with proper approval", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await token.connect(user1).approve(user2.address, transferAmount);
      await token
        .connect(user2)
        .transferFrom(user1.address, user2.address, transferAmount);
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });
});