// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OrgRegistry {
    enum VerificationStatus { NONE, PENDING, VERIFIED, REJECTED }

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

    struct VerificationRecord {
        address uploader;
        address verifierOrg;
        VerificationStatus status;
        string rejectionReason;
        uint256 lastUpdated;
    }

    mapping(address => Organization) public organizations;
    address[] public orgList;
    mapping(string => VerificationLog[]) public documentAuditTrail;
    mapping(string => VerificationRecord) public verifications;
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
        if (organizations[_wallet].registeredAt == 0) {
            orgList.push(_wallet);
        }
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

    function getAllOrganizations() public view returns (address[] memory) {
        return orgList;
    }

    function requestVerification(string memory _verificationId, address _org) public {
        require(organizations[_org].isAuthorized, "Target organization is not authorized");
        
        verifications[_verificationId] = VerificationRecord({
            uploader: msg.sender,
            verifierOrg: _org,
            status: VerificationStatus.PENDING,
            rejectionReason: "",
            lastUpdated: block.timestamp
        });

        emit VerificationRequested(_verificationId, msg.sender, _org);
    }

    function verifyDocument(string memory _verificationId, string memory _remarks) public onlyAuthorizedOrg {
        require(verifications[_verificationId].verifierOrg == msg.sender, "Not the assigned verifier");
        
        VerificationLog memory log = VerificationLog({
            verificationId: _verificationId,
            verifierOrg: msg.sender,
            timestamp: block.timestamp,
            remarks: _remarks
        });

        verifications[_verificationId].status = VerificationStatus.VERIFIED;
        verifications[_verificationId].lastUpdated = block.timestamp;

        documentAuditTrail[_verificationId].push(log);
        emit DocumentVerified(_verificationId, msg.sender, block.timestamp);
    }

    function rejectDocument(string memory _verificationId, string memory _reason) public onlyAuthorizedOrg {
        require(verifications[_verificationId].verifierOrg == msg.sender, "Not the assigned verifier");
        
        verifications[_verificationId].status = VerificationStatus.REJECTED;
        verifications[_verificationId].rejectionReason = _reason;
        verifications[_verificationId].lastUpdated = block.timestamp;

        emit DocumentRejected(_verificationId, msg.sender, _reason);
    }

    function getAuditTrail(string memory _verificationId) public view returns (VerificationLog[] memory) {
        return documentAuditTrail[_verificationId];
    }

    function getVerificationStatus(string memory _verificationId) public view returns (VerificationStatus status, address verifierOrg, string memory rejectionReason, uint256 lastUpdated) {
        VerificationRecord memory record = verifications[_verificationId];
        return (record.status, record.verifierOrg, record.rejectionReason, record.lastUpdated);
    }
}
