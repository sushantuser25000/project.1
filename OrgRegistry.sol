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

    // Verification request status enum
    enum VerificationStatus { NONE, PENDING, VERIFIED, REJECTED }

    struct VerificationRequest {
        string verificationId;
        address requester;
        address verifierOrg;
        VerificationStatus status;
        string rejectionReason;
        uint256 lastUpdated;
    }

    mapping(address => Organization) public organizations;
    mapping(string => VerificationLog[]) public documentAuditTrail;
    mapping(string => VerificationRequest) public verificationRequests;
    address[] public orgAddresses;
    address public owner;

    event OrganizationRegistered(address indexed wallet, string name);
    event DocumentVerified(string indexed verificationId, address indexed verifier, uint256 timestamp);
    event VerificationRequested(string indexed verificationId, address indexed uploader, address indexed targetOrg);
    event DocumentRejected(string indexed verificationId, address indexed verifier, string reason);

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
        orgAddresses.push(_wallet);
        emit OrganizationRegistered(_wallet, _name);
    }

    function deactivateOrganization(address _wallet) public onlyOwner {
        organizations[_wallet].isAuthorized = false;
    }

    function getAllOrganizations() public view returns (address[] memory) {
        return orgAddresses;
    }

    // User requests verification from a specific org
    function requestVerification(string memory _verificationId, address _org) public {
        require(organizations[_org].isAuthorized, "Target org not authorized");
        require(
            verificationRequests[_verificationId].status == VerificationStatus.NONE ||
            verificationRequests[_verificationId].status == VerificationStatus.REJECTED,
            "Verification already in progress or completed"
        );

        verificationRequests[_verificationId] = VerificationRequest({
            verificationId: _verificationId,
            requester: msg.sender,
            verifierOrg: _org,
            status: VerificationStatus.PENDING,
            rejectionReason: "",
            lastUpdated: block.timestamp
        });

        emit VerificationRequested(_verificationId, msg.sender, _org);
    }

    // Authorized org verifies a document
    function verifyDocument(string memory _verificationId, string memory _remarks) public onlyAuthorizedOrg {
        VerificationRequest storage req = verificationRequests[_verificationId];
        require(req.status == VerificationStatus.PENDING, "Not pending");
        require(req.verifierOrg == msg.sender, "Not assigned verifier");

        req.status = VerificationStatus.VERIFIED;
        req.lastUpdated = block.timestamp;

        VerificationLog memory log = VerificationLog({
            verificationId: _verificationId,
            verifierOrg: msg.sender,
            timestamp: block.timestamp,
            remarks: _remarks
        });

        documentAuditTrail[_verificationId].push(log);
        emit DocumentVerified(_verificationId, msg.sender, block.timestamp);
    }

    // Authorized org rejects a document
    function rejectDocument(string memory _verificationId, string memory _reason) public onlyAuthorizedOrg {
        VerificationRequest storage req = verificationRequests[_verificationId];
        require(req.status == VerificationStatus.PENDING, "Not pending");
        require(req.verifierOrg == msg.sender, "Not assigned verifier");

        req.status = VerificationStatus.REJECTED;
        req.rejectionReason = _reason;
        req.lastUpdated = block.timestamp;

        emit DocumentRejected(_verificationId, msg.sender, _reason);
    }

    function getVerificationStatus(string memory _verificationId) public view returns (
        VerificationStatus status,
        address verifierOrg,
        string memory rejectionReason,
        uint256 lastUpdated
    ) {
        VerificationRequest memory req = verificationRequests[_verificationId];
        return (req.status, req.verifierOrg, req.rejectionReason, req.lastUpdated);
    }

    function getAuditTrail(string memory _verificationId) public view returns (VerificationLog[] memory) {
        return documentAuditTrail[_verificationId];
    }
}
