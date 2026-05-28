// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SoulboundNFT.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Re-added ERC20 import
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlatformCore is Ownable {
    SoulboundNFT public soulboundNFT;
    // IERC20 public paymentToken; // Re-added ERC20 token declaration

    struct Guide {
        address walletAddress;
        string name;
        string serviceType;
        bool isVerified;
        uint256 nftTokenId;
        bool isRegistered; // New field to indicate if a guide is registered (even if not verified)
    }

    struct Tourist {
        address walletAddress;
        string name;
        bool isRegistered;
    }

    mapping(address => Guide) public guides;
    mapping(address => Tourist) public tourists;
    address[] public registeredGuideAddresses; // Stores all registered guide addresses (verified or not)
    address[] public registeredTouristAddresses; // Stores all registered tourist addresses

    event GuideRegistered(address indexed guideAddress, string name, string serviceType);
    event GuideVerified(address indexed guideAddress, uint256 nftTokenId);
    event PaymentMade(address indexed tourist, address indexed guide, uint256 amount);
    event TouristRegistered(address indexed touristAddress, string name);
    event GuideRemoved(address indexed guideAddress);
    event TouristRemoved(address indexed touristAddress);

    constructor(address initialOwner, address _soulboundNFTAddress)
    {
        _transferOwnership(initialOwner); // Explicitly set owner
        soulboundNFT = SoulboundNFT(_soulboundNFTAddress);
        // paymentToken = IERC20(_paymentTokenAddress); // Re-added ERC20 token assignment
    }

    // --- Guide Management ---

    function registerGuide(string memory name, string memory serviceType) public {
        require(msg.sender != address(0), "Invalid guide address");
        require(!guides[msg.sender].isRegistered, "Guide already registered");

        guides[msg.sender] = Guide({
            walletAddress: msg.sender,
            name: name,
            serviceType: serviceType,
            isVerified: false,
            nftTokenId: 0,
            isRegistered: true
        });
        registeredGuideAddresses.push(msg.sender);

        emit GuideRegistered(msg.sender, name, serviceType);
    }

    function verifyGuide(address guideAddress, string memory name, string memory serviceType, string memory areaOfExpertise, string memory location, uint256 expiryDate) public onlyOwner {
        require(guides[guideAddress].isRegistered, "Guide not registered");
        require(!guides[guideAddress].isVerified, "Guide already verified");

        // Mint Soulbound NFT and get the tokenId directly
        uint256 tokenId = soulboundNFT.safeMint(guideAddress, name, serviceType, areaOfExpertise, location, expiryDate);

        guides[guideAddress].isVerified = true;
        guides[guideAddress].nftTokenId = tokenId;

        emit GuideVerified(guideAddress, tokenId);
    }

    function removeGuide(address guideAddress) public onlyOwner {
        require(guides[guideAddress].isRegistered, "Guide not registered");

        // Reset guide information
        delete guides[guideAddress];

        // Remove from registeredGuideAddresses array (this is an expensive operation for dynamic arrays)
        for (uint i = 0; i < registeredGuideAddresses.length; i++) {
            if (registeredGuideAddresses[i] == guideAddress) {
                registeredGuideAddresses[i] = registeredGuideAddresses[registeredGuideAddresses.length - 1];
                registeredGuideAddresses.pop();
                break;
            }
        }

        emit GuideRemoved(guideAddress);
    }

    function isGuideVerified(address guideAddress) public view returns (bool) {
        return guides[guideAddress].isVerified;
    }

    function getRegisteredGuides() public view returns (address[] memory) {
        return registeredGuideAddresses;
    }

    // --- Tourist Management ---

    function registerTourist(string memory name) public {
        require(msg.sender != address(0), "Invalid tourist address");
        require(!tourists[msg.sender].isRegistered, "Tourist already registered");

        tourists[msg.sender] = Tourist({
            walletAddress: msg.sender,
            name: name,
            isRegistered: true
        });
        registeredTouristAddresses.push(msg.sender);

        emit TouristRegistered(msg.sender, name);
    }

    function removeTourist(address touristAddress) public onlyOwner {
        require(tourists[touristAddress].isRegistered, "Tourist not registered");

        // Reset tourist information
        delete tourists[touristAddress];

        // Remove from registeredTouristAddresses array (expensive operation)
        for (uint i = 0; i < registeredTouristAddresses.length; i++) {
            if (registeredTouristAddresses[i] == touristAddress) {
                registeredTouristAddresses[i] = registeredTouristAddresses[registeredTouristAddresses.length - 1];
                registeredTouristAddresses.pop();
                break;
            }
        }

        emit TouristRemoved(touristAddress);
    }

    function isTouristRegistered(address touristAddress) public view returns (bool) {
        return tourists[touristAddress].isRegistered;
    }

    function getRegisteredTourists() public view returns (address[] memory) {
        return registeredTouristAddresses;
    }

    // --- Payment Functionality ---

    function payGuide(address payable guideAddress) public payable { // Changed to public payable for ETH
        require(guides[guideAddress].isVerified, "Guide not verified");
        require(msg.value > 0, "Payment amount must be greater than zero");

        (bool sent, ) = guideAddress.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        emit PaymentMade(msg.sender, guideAddress, msg.value);
    }

    // Function to retrieve guide details by address
    function getGuideDetails(address guideAddress) public view returns (
        address walletAddress,
        string memory name,
        string memory serviceType,
        bool isVerified,
        uint256 nftTokenId,
        bool isRegistered
    ) {
        Guide storage guide = guides[guideAddress];
        return (
            guide.walletAddress,
            guide.name,
            guide.serviceType,
            guide.isVerified,
            guide.nftTokenId,
            guide.isRegistered
        );
    }

    // Function to retrieve tourist details by address
    function getTouristDetails(address touristAddress) public view returns (
        address walletAddress,
        string memory name,
        bool isRegistered
    ) {
        Tourist storage tourist = tourists[touristAddress];
        return (
            tourist.walletAddress,
            tourist.name,
            tourist.isRegistered
        );
    }
}
