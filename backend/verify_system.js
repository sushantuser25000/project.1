const { ethers } = require('ethers');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function main() {
    console.log("🔍 Starting Full System Verification...");
    console.log("---------------------------------------");

    const verificationResult = {
        backend: { status: 'pending', details: '' },
        registration: { status: 'pending', details: '' },
        login: { status: 'pending', details: '' },
        upload: { status: 'pending', details: '' },
        overall: 'success'
    };

    // 1. Health Check
    try {
        const healthRes = await axios.get(`${API_URL}/api/health`);
        const health = healthRes.data;
        console.log("✅ Backend Health:", health.status === 'ok' ? 'OK' : 'FAIL');
        verificationResult.backend.status = health.status === 'ok' ? 'success' : 'failed';
        verificationResult.backend.details = `Network: ${health.network ? 'Connected' : 'Disconnected'}, Contract: ${health.contractAddress}`;
    } catch (e) {
        console.error("❌ Backend unresponsive:", e.message);
        verificationResult.backend.status = 'failed';
        verificationResult.backend.details = e.message;
        verificationResult.overall = 'failed';
        await writeResult(verificationResult);
        process.exit(1);
    }

    // 2. Register User
    console.log("\n👤 Testing User Registration...");
    const timestamp = Date.now();
    const email = `test_user_${timestamp}@example.com`;
    const username = `User_${timestamp}`;

    let userContext = {};

    try {
        const regRes = await axios.post(`${API_URL}/api/auth/register`, {
            email, username
        });
        const regData = regRes.data;

        if (!regData.success) throw new Error(regData.error || 'Registration failed');

        console.log("✅ Registration Successful");
        userContext.privateKey = regData.privateKey;
        const wallet = new ethers.Wallet(regData.privateKey);
        userContext.address = wallet.address;
        userContext.wallet = wallet;
        console.log("   - Address:", userContext.address);

        verificationResult.registration.status = 'success';
        verificationResult.registration.details = `Registered: ${userContext.address}`;

    } catch (e) {
        console.error("❌ Registration Failed:", e.message);
        verificationResult.registration.status = 'failed';
        verificationResult.registration.details = e.message;
        verificationResult.overall = 'failed';
        await writeResult(verificationResult);
        process.exit(1);
    }

    // 3. Login / Verify
    console.log("\n🔑 Testing Login/Verification...");
    try {
        // Get Nonce
        const nonceRes = await axios.get(`${API_URL}/api/auth/nonce/${userContext.address}`);
        const nonceData = nonceRes.data;
        if (!nonceData.success) throw new Error('Failed to get nonce');

        // Sign
        const signature = await userContext.wallet.signMessage(nonceData.nonce);

        // Verify
        const verifyRes = await axios.post(`${API_URL}/api/auth/verify`, {
            message: nonceData.nonce,
            signature,
            address: userContext.address
        });
        const verifyData = verifyRes.data;

        if (!verifyData.success || !verifyData.verified) throw new Error('Verification failed');
        console.log("✅ Login Verification Successful");

        verificationResult.login.status = 'success';
        verificationResult.login.details = 'Signature valid & user verified';

    } catch (e) {
        console.error("❌ Login Failed:", e.message);
        verificationResult.login.status = 'failed';
        verificationResult.login.details = e.message;
        verificationResult.overall = 'failed';
        await writeResult(verificationResult);
        process.exit(1);
    }

    // 4. Test Upload (Google Drive)
    console.log("\n☁️ Testing Document Upload (Google Drive)...");
    try {
        const testFilePath = path.join(__dirname, 'test_upload.txt');
        fs.writeFileSync(testFilePath, `This is a test document uploaded at ${new Date().toISOString()}`);

        const form = new FormData();
        form.append('document', fs.createReadStream(testFilePath));
        form.append('address', userContext.address);
        form.append('docType', 'Test Document');
        form.append('docName', 'System Verification Test');

        // Upload with Axios
        const uploadRes = await axios.post(`${API_URL}/api/documents/upload`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        const uploadData = uploadRes.data;

        if (uploadData.success) {
            console.log("✅ Upload Successful!");
            console.log("   - Drive ID:", uploadData.path);
            verificationResult.upload.status = 'success';
            verificationResult.upload.details = `Drive ID: ${uploadData.path}, Verification ID: ${uploadData.verificationId}`;
        } else {
            console.error("❌ Upload Failed:", uploadData.error);
            verificationResult.upload.status = 'failed';
            verificationResult.upload.details = uploadData.error;
            verificationResult.overall = 'partial_success'; // Not strictly failed
        }

    } catch (e) {
        console.error("❌ Upload Test Error:", e.message);
        verificationResult.upload.status = 'failed';
        verificationResult.upload.details = e.message;
        verificationResult.overall = 'partial_success';
    }

    console.log("\n---------------------------------------");
    console.log("✅ VERIFICATION COMPLETE");

    await writeResult(verificationResult);
}

async function writeResult(result) {
    fs.writeFileSync('verification_summary.json', JSON.stringify(result, null, 2), 'utf8');
}

main();
