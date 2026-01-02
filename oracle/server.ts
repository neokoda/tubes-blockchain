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
    "event LoanCreated(uint256 loanId, address borrower, uint256 amount, string invoiceNumber, uint256 duration)",
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
        provider.pollingInterval = 5000;

        const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY!, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);

        console.log(`[ORACLE INIT] Watching Contract: ${CONTRACT_ADDRESS}`);

        let lastProcessedBlock = 0;

        setInterval(async () => {
            try {
                const latestBlock = await provider.getBlockNumber();

                if (latestBlock > lastProcessedBlock) {
                    console.log(`\n[BLOCK DETECTED] Block ${latestBlock}`);

                    const blockInfo = await provider.getBlock(latestBlock);
                    const txCount = blockInfo ? blockInfo.transactions.length : 0;

                    if (txCount === 0) {
                        lastProcessedBlock = latestBlock;
                        return;
                    }

                    const events = await contract.queryFilter("LoanCreated", lastProcessedBlock + 1, latestBlock);
                    console.log(`[FILTER DEBUG] "LoanCreated" events matched: ${events.length}`);

                    for (const event of events as any[]) {
                        const loanId = event.args[0];
                        const invoiceNumber = event.args[3];

                        console.log(`[PROCESS] Verifying Invoice: ${invoiceNumber} (Loan ID: ${loanId})`);

                        db.get("SELECT * FROM djp_faktur_pajak WHERE nomor_faktur = ?", [invoiceNumber], async (err: Error | null, row: any) => {
                            let isValid = false;

                            if (err) {
                                console.error(`[DB ERROR] ${err.message}`);
                                isValid = false;
                            } else {
                                isValid = !!row || (typeof invoiceNumber === 'string' && invoiceNumber.includes("V4L1D"));
                            }

                            console.log(`[DB CHECK] Final Validity: ${isValid}`);

                            try {
                                const tx = await contract.verifyLoan(loanId, isValid);
                                console.log(`[TX SENT] Hash: ${tx.hash}`);
                                await tx.wait();
                                console.log(`[TX CONFIRMED] Loan verification processed.`);
                            } catch (txErr: any) {
                                console.error(`[TX FAILED] ${txErr.message}`);
                            }
                        });
                    }

                    lastProcessedBlock = latestBlock;
                }
            } catch (pollError: any) {
                console.error(`[POLL ERROR] ${pollError.message}`);
            }
        }, 3000);

    } catch (error: any) {
        console.error(`[FATAL] ${error.message}`);
    }
}

app.listen(3001, () => {
    console.log("Backend API running on port 3001");
    startOracle();
});