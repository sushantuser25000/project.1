
const { ethers } = require('ethers');

async function main() {
    const API_URL = 'http://localhost:5000/api/auth';

    console.log("Starting Login Flow Test...");

    // 1. Register
    try {
        console.log("1. Registering new user...");
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'testlogin2@example.com',
                username: 'TestLoginUser2'
            })
        });
        const regData = await regRes.json();

        if (!regData.success) {
            console.error("❌ Register Failed:", regData);
            return;
        }

        const privateKey = regData.privateKey;
        console.log("✅ Registered! Key:", privateKey);

        // 2. Recover Wallet
        const userWallet = new ethers.Wallet(privateKey);
        console.log("🔑 Recovered Address:", userWallet.address);

        // 3. Get Nonce
        console.log("2. Getting Nonce...");
        const nonceRes = await fetch(`${API_URL}/nonce/${userWallet.address}`);
        const nonceData = await nonceRes.json();

        if (!nonceData.success) {
            console.error("❌ Failed to get nonce", nonceData);
            return;
        }
        console.log("✅ Nonce:", nonceData.nonce);

        // 4. Sign
        console.log("3. Signing Nonce...");
        const signature = await userWallet.signMessage(nonceData.nonce);
        console.log("✍️ Signature:", signature);

        // 5. Verify
        console.log("4. Verifying Signature...");
        const verifyRes = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: nonceData.nonce,
                signature: signature,
                address: userWallet.address
            })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success && verifyData.verified && verifyData.registered) {
            console.log("✅ LOGIN SUCCESSFUL!");
            console.log("User Info:", verifyData.user);
        } else {
            console.error("❌ LOGIN FAILED:", verifyData);
        }

    } catch (e) {
        console.error("❌ Unexpected Error:", e);
    }
}

main();
