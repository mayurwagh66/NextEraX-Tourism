// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SoulboundNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct GuideCertification {
        string guideName;
        string serviceType;
        string areaOfExpertise; // New field
        string location;        // New field
        uint256 expiryDate;     // New field
        uint256 verificationDate;
    }

    mapping(uint256 => GuideCertification) public certifications;

    event GuideCertified(address indexed owner, uint256 indexed tokenId, string guideName, string serviceType, string areaOfExpertise, string location, uint256 expiryDate, uint256 verificationDate);

    constructor(address initialOwner)
        ERC721("SoulboundGuideCertificate", "SGCNFT")
    {
        _transferOwnership(initialOwner); // Explicitly set owner
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://example.com/api/nft/"; // Placeholder for metadata URI
    }

    function safeMint(address to, string memory guideName, string memory serviceType, string memory areaOfExpertise, string memory location, uint256 expiryDate) public onlyOwner returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);

        certifications[tokenId] = GuideCertification({
            guideName: guideName,
            serviceType: serviceType,
            areaOfExpertise: areaOfExpertise,
            location: location,
            expiryDate: expiryDate,
            verificationDate: block.timestamp
        });

        emit GuideCertified(to, tokenId, guideName, serviceType, areaOfExpertise, location, expiryDate, block.timestamp);
        return tokenId;
    }

    // Override to prevent transfers
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721)
    {
        require(from == address(0) || to == address(0), "Soulbound: NFT cannot be transferred after minting");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
