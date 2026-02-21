const { ethers } = require("ethers");
require("dotenv").config({ path: "../backend/.env" });

async function main() {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545", { chainId: 2025, name: "unknown" });
    const ORG_ABI = [
        "function organizations(address) public view returns (string name, address wallet, bool isAuthorized, uint256 registeredAt)",
        "function getAllOrganizations() public view returns (address[])",
        "function getVerificationStatus(string memory) public view returns (uint8 status, address verifierOrg, string memory rejectionReason, uint256 lastUpdated)",
        "event OrganizationRegistered(address indexed wallet, string name)",
        "event VerificationRequested(string indexed verificationId, address indexed uploader, address indexed targetOrg)",
        "event DocumentVerified(string indexed verificationId, address indexed verifier, uint256 timestamp)"
    ];

    const orgAddress = process.env.ORG_REGISTRY_ADDRESS;
    console.log(`Auditing OrgRegistry at: ${orgAddress}`);
    const contract = new ethers.Contract(orgAddress, ORG_ABI, provider);

    console.log("\n--- Authorized Organizations ---");
    const orgs = await contract.getAllOrganizations();
    for (const org of orgs) {
        const data = await contract.organizations(org);
        console.log(`- ${org}: ${data.name} (Authorized: ${data.isAuthorized})`);
    }

    console.log("\n--- Recent Verification Requests ---");
    const filter = contract.filters.VerificationRequested();
    const events = await contract.queryFilter(filter, -100);

    if (events.length === 0) {
        console.log("No Verification Requests found in the last 100 blocks.");
    }

    for (const e of events) {
        const args = e.args;
        console.log(`\nDoc ID: ${args.verificationId}`);
        console.log(`  Requested By: ${args.uploader}`);
        console.log(`  Target Org:   ${args.targetOrg}`);

        try {
            const status = await contract.getVerificationStatus(args.verificationId);
            const statusMap = ["NONE", "PENDING", "VERIFIED", "REJECTED"];
            console.log(`  Current Status: ${statusMap[status.status]}`);
            if (status.status === 3) console.log(`  Rejection Reason: ${status.rejectionReason}`);
        } catch (err) {
            console.log(`  Error fetching state: ${err.message}`);
        }
    }
}

main().catch(console.error);
