// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct User {
        address userAddress;
        string username;
        uint256 registeredAt;
        bool isActive;
    }
    
    struct Document {
        uint256 id;
        string docType;
        string fileName;
        string ipfsHash; 
        bytes32 contentHash;
        string verificationId;
        uint256 uploadedAt;
    }

    mapping(address => User) public users;
    mapping(address => bool) public isRegistered;
    mapping(address => Document[]) public userDocuments;
    address[] public userAddresses;
    
    event UserRegistered(address indexed userAddress, string username, uint256 timestamp);
    event UserUpdated(address indexed userAddress, string username, uint256 timestamp);
    event UserDeactivated(address indexed userAddress, uint256 timestamp);
    event DocumentUploaded(address indexed userAddress, uint256 docId, string docType, string fileName);

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    // ... modifiers ...

    function addDocument(string memory _docType, string memory _fileName, string memory _ipfsHash, bytes32 _contentHash, string memory _verificationId) public onlyRegistered onlyActive {
        Document memory newDoc = Document({
            id: userDocuments[msg.sender].length,
            docType: _docType,
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            contentHash: _contentHash,
            verificationId: _verificationId,
            uploadedAt: block.timestamp
        });
        
        userDocuments[msg.sender].push(newDoc);
        emit DocumentUploaded(msg.sender, newDoc.id, _docType, _fileName);
    }
    
    function getUserDocuments(address _userAddress) public view returns (Document[] memory) {
        require(isRegistered[_userAddress], "User not registered");
        return userDocuments[_userAddress];
    }
    
    function getMyDocuments() public view onlyRegistered returns (Document[] memory) {
        return userDocuments[msg.sender];
    }
    
    modifier onlyActive() {
        require(users[msg.sender].isActive, "User account is deactivated");
        _;
    }
    
    function registerUser(string memory _username) public {
        require(!isRegistered[msg.sender], "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            registeredAt: block.timestamp,
            isActive: true
        });
        
        isRegistered[msg.sender] = true;
        userAddresses.push(msg.sender);
        
        emit UserRegistered(msg.sender, _username, block.timestamp);
    }
    
    function updateUsername(string memory _newUsername) public onlyRegistered onlyActive {
        require(bytes(_newUsername).length > 0, "Username cannot be empty");
        
        users[msg.sender].username = _newUsername;
        
        emit UserUpdated(msg.sender, _newUsername, block.timestamp);
    }
    
    function deactivateAccount() public onlyRegistered {
        users[msg.sender].isActive = false;
        
        emit UserDeactivated(msg.sender, block.timestamp);
    }
    
    function getUserInfo(address _userAddress) public view returns (
        address userAddress,
        string memory username,
        uint256 registeredAt,
        bool isActive
    ) {
        require(isRegistered[_userAddress], "User not found");
        User memory user = users[_userAddress];
        return (user.userAddress, user.username, user.registeredAt, user.isActive);
    }
    
    function getMyInfo() public view onlyRegistered returns (
        address userAddress,
        string memory username,
        uint256 registeredAt,
        bool isActive
    ) {
        User memory user = users[msg.sender];
        return (user.userAddress, user.username, user.registeredAt, user.isActive);
    }
    
    function getTotalUsers() public view returns (uint256) {
        return userAddresses.length;
    }
    
    function verifySignature(bytes32 message, bytes memory signature) public pure returns (address) {
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(message);
        return recoverSigner(ethSignedMessageHash, signature);
    }
    
    function getEthSignedMessageHash(bytes32 messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }
    
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }
    
    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
