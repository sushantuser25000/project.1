// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OrgRegistry {
    struct Organization {
        string name;
        address wallet;
        bool isAuthorized;
        uint256 registeredAt;
    }

    struct VerificationLog {
        string verificationId;
        address verifierOrg;
        uint256 timestamp;
        string remarks;
    }

    mapping(address => Organization) public organizations;
    mapping(string => VerificationLog[]) public documentAuditTrail;
    address public owner;

    event OrganizationRegistered(address indexed wallet, string name);
    event DocumentVerified(string indexed verificationId, address indexed verifier, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorizedOrg() {
        require(organizations[msg.sender].isAuthorized, "Not an authorized organization");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerOrganization(string memory _name, address _wallet) public onlyOwner {
        organizations[_wallet] = Organization({
            name: _name,
            wallet: _wallet,
            isAuthorized: true,
            registeredAt: block.timestamp
        });
        emit OrganizationRegistered(_wallet, _name);
    }

    function deactivateOrganization(address _wallet) public onlyOwner {
        organizations[_wallet].isAuthorized = false;
    }

    function verifyDocument(string memory _verificationId, string memory _remarks) public onlyAuthorizedOrg {
        VerificationLog memory log = VerificationLog({
            verificationId: _verificationId,
            verifierOrg: msg.sender,
            timestamp: block.timestamp,
            remarks: _remarks
        });

        documentAuditTrail[_verificationId].push(log);
        emit DocumentVerified(_verificationId, msg.sender, block.timestamp);
    }

    function getAuditTrail(string memory _verificationId) public view returns (VerificationLog[] memory) {
        return documentAuditTrail[_verificationId];
    }
}
