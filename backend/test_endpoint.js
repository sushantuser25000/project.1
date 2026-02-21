const axios = require('axios');

async function testBackend() {
    try {
        console.log("Sending request to backend...");
        const res = await axios.post('http://localhost:5000/api/documents/request-verification', {
            verificationId: "req_test_abc",
            targetOrg: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            userPrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            docInfo: {}
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.log("Error:", e.message);
        if (e.response) console.log(e.response.data);
    }
}
testBackend();
