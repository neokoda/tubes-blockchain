import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { ethers } from 'ethers';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sql = sqlite3.verbose();
const db = new sql.Database('./chainvoice.db');

const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const RPC_URL = process.env.RPC_URL;

const CONTRACT_ABI = [
    "event LoanCreated(uint256 loanId, address borrower, uint256 amount, string invoiceNumber)",
    "function verifyLoan(uint256 _loanId, bool _isValid) external",
    "function loans(uint256) view returns (uint256 id, address borrower, uint256 amountRequested, uint256 amountFunded, string ipfsHash, string invoiceNumber, uint256 interestRate, uint8 state, address[] investors)"
];

app.post('/api/profile', (req, res) => {
    const { wallet_address, business_name, description, npwp } = req.body;
    db.run(
        `INSERT OR REPLACE INTO users (wallet_address, business_name, description, npwp) VALUES (?, ?, ?, ?)`,
        [wallet_address, business_name, description, npwp],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Profile saved successfully" });
        }
    );
});

app.get('/api/profile/:address', (req, res) => {
    db.get("SELECT * FROM users WHERE wallet_address = ?", [req.params.address], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

async function startOracle() {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        provider.pollingInterval = 100000;

        const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        console.log(`Oracle Active`);
        console.log(`Listening to Contract: ${CONTRACT_ADDRESS}`);
        console.log(`Mode: Manual Polling (Safe for Localhost)`);

        let lastProcessedBlock = await provider.getBlockNumber();

        setInterval(async () => {
            try {
                const latestBlock = await provider.getBlockNumber();

                if (latestBlock > lastProcessedBlock) {
                    console.log(`Scanning blocks ${lastProcessedBlock + 1} to ${latestBlock}...`);

                    const events = await contract.queryFilter(
                        "LoanCreated",
                        lastProcessedBlock + 1,
                        latestBlock
                    );

                    for (const event of events) {
                        const loanId = event.args[0];
                        const borrower = event.args[1];
                        const amount = event.args[2];
                        const invoiceNumber = event.args[3];

                        console.log(`\nNew Loan Request Detected!`);
                        console.log(`- Loan ID: ${loanId}`);
                        console.log(`- Borrower: ${borrower}`);
                        console.log(`- Invoice No: ${invoiceNumber}`);

                        db.get("SELECT * FROM djp_faktur_pajak WHERE nomor_faktur = ?", [invoiceNumber], async (err, row) => {
                            if (err) {
                                console.error("Database Error:", err);
                                return;
                            }

                            let isValid = false;

                            if (row) {
                                console.log(`VALID: Invoice found in DJP Database.`);
                                console.log(`(Seller NPWP: ${row.npwp_penjual}, Value: ${row.nominal_total})`);
                                isValid = true;
                            } else {
                                console.log(`INVALID: Invoice '${invoiceNumber}' not found in DJP Records.`);
                            }

                            try {
                                console.log(`Submitting verification result (${isValid}) to Blockchain...`);
                                const tx = await contract.verifyLoan(loanId, isValid);
                                await tx.wait();
                                console.log(`Verification Transaction Confirmed!`);
                            } catch (txError) {
                                console.error("Failed to submit verification transaction:", txError.message);
                            }
                        });
                    }

                    lastProcessedBlock = latestBlock;
                }
            } catch (pollError) {
                console.error("Polling Error (Retrying...):", pollError.message);
            }
        }, 3000);

    } catch (error) {
        console.error("Oracle Connection Error:", error.message);
    }
}

app.listen(3001, () => {
    console.log("Backend API running on port 3001");
    startOracle();
});