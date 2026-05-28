const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexteraX Platform", function () {
  // Contracts
  let soulboundNFT;
  let paymentToken;
  let guideRegistry;
  let paymentSystem;

  // Signers
  let owner;
  let guide1;
  let guide2;
  let tourist1;
  let tourist2;

  // Constants
  const initialSupply = 1000000; // 1 million tokens
  const decimals = 18;
  const platformFeeRate = 200; // 2%

  beforeEach(async function () {
    // Get signers
    [owner, guide1, guide2, tourist1, tourist2] = await ethers.getSigners();

    // Deploy SoulboundNFT
    const SoulboundNFT = await ethers.getContractFactory("SoulboundNFT");
    soulboundNFT = await SoulboundNFT.deploy();

    // Deploy PaymentToken
    const PaymentToken = await ethers.getContractFactory("PaymentToken");
    paymentToken = await PaymentToken.deploy(
      "NexteraX Payment Token",
      "NXPT",
      initialSupply,
      decimals
    );

    // Deploy GuideRegistry
    const GuideRegistry = await ethers.getContractFactory("GuideRegistry");
    guideRegistry = await GuideRegistry.deploy(await soulboundNFT.getAddress());

    // Transfer ownership of SoulboundNFT to GuideRegistry
    await soulboundNFT.transferOwnership(await guideRegistry.getAddress());

    // Deploy PaymentSystem
    const PaymentSystem = await ethers.getContractFactory("PaymentSystem");
    paymentSystem = await PaymentSystem.deploy(
      await paymentToken.getAddress(),
      await guideRegistry.getAddress(),
      platformFeeRate
    );

    // Transfer some tokens to tourists for testing
    const amount = ethers.parseUnits("1000", decimals);
    await paymentToken.transfer(await tourist1.getAddress(), amount);
    await paymentToken.transfer(await tourist2.getAddress(), amount);
  });

  describe("Guide Registration and Verification", function () {
    it("Should register a new guide", async function () {
      await guideRegistry.addGuide(
        await guide1.getAddress(),
        "John Doe",
        "City Tours"
      );

      const guideDetails = await guideRegistry.getGuideDetails(await guide1.getAddress());
      expect(guideDetails[0]).to.equal("John Doe");
      expect(guideDetails[1]).to.equal("City Tours");
      expect(guideDetails[2]).to.equal(false); // isVerified
      expect(guideDetails[3]).to.equal(0); // verificationDate
      expect(guideDetails[4]).to.equal(0); // tokenId
    });

    it("Should verify a guide and mint a SoulboundNFT", async function () {
      await guideRegistry.addGuide(
        await guide1.getAddress(),
        "John Doe",
        "City Tours"
      );

      await guideRegistry.verifyGuide(await guide1.getAddress());

      const guideDetails = await guideRegistry.getGuideDetails(await guide1.getAddress());
      expect(guideDetails[2]).to.equal(true); // isVerified
      expect(guideDetails[3]).to.not.equal(0); // verificationDate
      expect(guideDetails[4]).to.equal(1); // tokenId

      // Check NFT ownership
      expect(await soulboundNFT.ownerOf(1)).to.equal(await guide1.getAddress());
    });

    it("Should not allow transferring the SoulboundNFT", async function () {
      await guideRegistry.addGuide(
        await guide1.getAddress(),
        "John Doe",
        "City Tours"
      );

      await guideRegistry.verifyGuide(await guide1.getAddress());

      // Try to transfer the NFT
      await expect(
        soulboundNFT.connect(guide1).transferFrom(
          await guide1.getAddress(),
          await guide2.getAddress(),
          1
        )
      ).to.be.revertedWith("Token is soulbound and cannot be transferred");
    });
  });

  describe("Payment System", function () {
    beforeEach(async function () {
      // Register and verify guide1
      await guideRegistry.addGuide(
        await guide1.getAddress(),
        "John Doe",
        "City Tours"
      );
      await guideRegistry.verifyGuide(await guide1.getAddress());

      // Approve payment system to spend tourist tokens
      const amount = ethers.parseUnits("1000", decimals);
      await paymentToken.connect(tourist1).approve(await paymentSystem.getAddress(), amount);
      await paymentToken.connect(tourist2).approve(await paymentSystem.getAddress(), amount);
    });

    it("Should allow tourists to pay verified guides", async function () {
      const paymentAmount = ethers.parseUnits("100", decimals);
      const platformFee = (paymentAmount * BigInt(platformFeeRate)) / BigInt(10000);
      const guideAmount = paymentAmount - platformFee;

      // Initial balances
      const initialGuideBalance = await paymentToken.balanceOf(await guide1.getAddress());
      const initialOwnerBalance = await paymentToken.balanceOf(await owner.getAddress());

      // Make payment
      await paymentSystem.connect(tourist1).makePayment(
        await guide1.getAddress(),
        paymentAmount,
        "Full day city tour"
      );

      // Check balances after payment
      expect(await paymentToken.balanceOf(await guide1.getAddress())).to.equal(
        initialGuideBalance + guideAmount
      );
      expect(await paymentToken.balanceOf(await owner.getAddress())).to.equal(
        initialOwnerBalance + platformFee
      );

      // Check payment record
      const paymentCount = await paymentSystem.getPaymentCount();
      expect(paymentCount).to.equal(1);

      const payment = await paymentSystem.getPaymentDetails(0);
      expect(payment.tourist).to.equal(await tourist1.getAddress());
      expect(payment.guide).to.equal(await guide1.getAddress());
      expect(payment.amount).to.equal(paymentAmount);
      expect(payment.serviceDescription).to.equal("Full day city tour");
    });

    it("Should not allow payments to unverified guides", async function () {
      // Register guide2 but don't verify
      await guideRegistry.addGuide(
        await guide2.getAddress(),
        "Jane Smith",
        "Food Tours"
      );

      const paymentAmount = ethers.parseUnits("100", decimals);

      // Try to make payment to unverified guide
      await expect(
        paymentSystem.connect(tourist1).makePayment(
          await guide2.getAddress(),
          paymentAmount,
          "Food tour"
        )
      ).to.be.revertedWith("Guide is not verified");
    });
  });
});