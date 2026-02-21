const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { ethers } = require('ethers');
require('dotenv').config();

const API_URL = 'http://localhost:5000';
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
// Pass static network to prevent dynamic querying issues
const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId: 2025, name: "unknown" });

// Test Accounts
// Admin (Org) - Hardhat #0 (Funded with 100 ETH earlier)
const adminPk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const adminWallet = new ethers.Wallet(adminPk, provider);
const orgAddress = adminWallet.address;

// User
const userPk = adminPk;
const userWallet = adminWallet;

// Load UserAuth ABI
const UserAuthJSON = require('../hardhat-example/artifacts/contracts/UserAuth.sol/UserAuth.json');

// Force Legacy Transaction (Type 0) for Geth PoA compatibility
const txOverrides = {
    type: 0,
    gasPrice: 1000000000, // 1 gwei
    gasLimit: 500000
};

async function testWorkflow() {
    console.log("=== STARTING END-TO-END VERIFICATION TEST ===");
    console.log("Using Legacy Type 0 Transactions");

    try {
        // 1. Get Contract Instance
        const userContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, UserAuthJSON.abi, userWallet);

        // Optional: Register User 1 just in case
        console.log("\n1. Registering test user...");
        try {
            const regTx = await userContract.registerUser("TestUser1", txOverrides);
            await regTx.wait();
            console.log("   ✅ User registered!");
        } catch (e) {
            console.log("   (User likely already registered or call failed)");
        }

        // 2. Upload Document
        console.log("\n2. Uploading test document to backend...");
        const formData = new FormData();
        const testFileContent = Buffer.from('Test document content for verification workflow');
        formData.append('document', testFileContent, { filename: 'test_doc.pdf', contentType: 'application/pdf' });
        formData.append('address', userWallet.address);
        formData.append('docType', 'Academic Transcript');
        formData.append('docName', 'My Transcript');

        const uploadRes = await axios.post(`${API_URL}/api/documents/upload`, formData, {
            headers: { ...formData.getHeaders(), 'Bypass-Tunnel-Reminder': 'true' }
        });

        if (!uploadRes.data.success) throw new Error("Upload failed: " + JSON.stringify(uploadRes.data));
        const { path, contentHash, verificationId } = uploadRes.data;
        console.log(`   ✅ Uploaded! Verification ID: ${verificationId}`);

        // 3. Add Document to Blockchain (UserAuth)
        console.log("\n3. Adding document metadata to blockchain...");
        const addTx = await userContract.addDocument(
            'Academic Transcript', 'My Transcript', path, contentHash, verificationId,
            txOverrides
        );
        await addTx.wait();
        console.log("   ✅ Document added to blockchain.");

        // 4. Request Verification
        console.log("\n4. Requesting verification from Admin Org...");
        const reqRes = await axios.post(`${API_URL}/api/documents/request-verification`, {
            verificationId,
            targetOrg: orgAddress,
            userPrivateKey: userPk,
            docInfo: {
                fileName: 'My Transcript',
                docType: 'Academic Transcript',
                ipfsHash: path,
                verificationId
            },
            ...txOverrides
        });
        if (!reqRes.data.success) throw new Error("Request failed");
        console.log("   ✅ Verification Request Sent.");

        // 5. Admin checks pending queue
        console.log("\n5. Admin checking pending queue...");
        const pendingRes = await axios.get(`${API_URL}/api/admin/pending/${orgAddress}`);
        console.log(`   Pending documents for Org: ${pendingRes.data.count}`);

        const docInQueue = pendingRes.data.documents.find(d => d.verificationId === verificationId);
        if (!docInQueue) throw new Error("Document not found in admin queue!");
        console.log("   ✅ Document found in queue.");

        // 6. Admin Rejects Document
        console.log("\n6. Admin rejecting document...");
        const rejectRes = await axios.post(`${API_URL}/api/admin/reject`, {
            verificationId,
            reason: "Blurry image, please re-upload.",
            adminPrivateKey: adminPk,
            ...txOverrides
        });
        if (!rejectRes.data.success) throw new Error("Rejection failed");
        console.log("   ✅ Document Rejected successfully.");

        // 7. Check final status
        console.log("\n7. Checking final on-chain status...");
        const statusRes = await axios.get(`${API_URL}/api/verify/status/${verificationId}`);
        console.log("   Status Data:", statusRes.data);

        if (statusRes.data.status === 3 && statusRes.data.rejectionReason === "Blurry image, please re-upload.") {
            console.log("\n🎉 TEST PASSED: Full rejection workflow works flawlessly!");
        } else {
            console.log("\n❌ TEST FAILED: Status mismatch.");
        }

    } catch (error) {
        console.error("\n❌ TEST ERROR:", error.response ? error.response.data : error.message);
    }
}

testWorkflow();
