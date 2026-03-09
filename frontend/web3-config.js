/**
 * Degen-Office Web3 Configuration
 * Central hub for all blockchain interactions.
 * "Connecting your wallet is the new onboarding."
 */

const DegenWeb3 = (() => {
    // ═══════════════════════════════════════════════════
    // Chain Configuration (Sepolia Testnet)
    // ═══════════════════════════════════════════════════
    const CHAIN = {
        id: 196,
        name: 'X Layer',
        rpc: 'https://rpc.xlayer.tech',
        explorer: 'https://www.okx.com/explorer/xlayer',
        currency: { name: 'OKB', symbol: 'OKB', decimals: 18 }
    };

    // Contract addresses (updated after deployment)
    // These will be loaded from deployed-addresses.json or set manually
    let CONTRACT_ADDRESSES = {
        NiuMaCoin: '',
        DailyPOAP: '',
        BountyEscrow: '',
        DegenOffice: ''
    };

    // ABIs will be loaded dynamically
    let CONTRACT_ABIS = {};

    // State
    let provider = null;
    let signer = null;
    let connectedAddress = null;
    let currentRole = null;
    let contracts = {};
    let isMockMode = new URLSearchParams(window.location.search).has('mock');
    let cachedEthPrice = '2850.42';

    // ═══════════════════════════════════════════════════
    // Hybrid Demo Mode Store (localStorage persistence)
    // ═══════════════════════════════════════════════════
    const HYBRID_STORE = {
        save: (key, data) => localStorage.setItem(`degen_office_${key}`, JSON.stringify(data)),
        load: (key, defaultVal) => {
            const val = localStorage.getItem(`degen_office_${key}`);
            return val ? JSON.parse(val) : defaultVal;
        },
        getNiumaBalance: function (addr) {
            const balances = this.load('balances', {});
            return balances[addr] || '10000'; // Initial gift
        },
        updateNiumaBalance: function (addr, amount) {
            const balances = this.load('balances', {});
            const current = Number(balances[addr] || '10000');
            balances[addr] = String(current + Number(amount));
            this.save('balances', balances);
            return balances[addr];
        },
        getAttendance: function (addr) {
            const history = this.load('attendance', {});
            return history[addr] || [20260301, 20260302, 20260303];
        },
        addAttendance: function (addr, dayId) {
            const history = this.load('attendance', {});
            if (!history[addr]) history[addr] = [20260301, 20260302, 20260303];
            if (!history[addr].includes(dayId)) history[addr].push(dayId);
            this.save('attendance', history);
        },
        getBounties: function () {
            return this.load('bounties', [
                { id: 0, creator: '0xBoss...1234', description: '修复生产环境 Bug（凌晨3点）', amount: '1000', status: 0 },
                { id: 1, creator: '0xBoss...1234', description: '写单元测试（lol）', amount: '500', status: 0 },
                { id: 2, creator: '0xCTO...5678', description: '重构屎山代码', amount: '2000', status: 1 }
            ]);
        },
        addBounty: function (bounty) {
            const bounties = this.getBounties();
            bounties.push(bounty);
            this.save('bounties', bounties);
        },
        updateBounty: function (id, updates) {
            const bounties = this.getBounties();
            if (bounties[id]) {
                Object.assign(bounties[id], updates);
                this.save('bounties', bounties);
            }
        }
    };

    // Format address for display
    function shortAddr(addr) {
        if (!addr) return '???';
        return addr.slice(0, 6) + '...' + addr.slice(-4);
    }

    // ═══════════════════════════════════════════════════
    // Initialization
    // ═══════════════════════════════════════════════════
    async function init() {
        // Load ABIs
        try {
            const resp = await fetch('/static/contract-abis.json');
            CONTRACT_ABIS = await resp.json();
        } catch (e) {
            console.warn('⚠️ Could not load contract ABIs, using mock mode');
            isMockMode = true;
        }

        // Load deployed addresses
        try {
            const resp = await fetch('/static/deployed-addresses.json');
            const data = await resp.json();
            if (data.contracts) {
                CONTRACT_ADDRESSES = data.contracts;
            }
        } catch (e) {
            console.warn('⚠️ No deployed addresses found, using mock mode');
            isMockMode = true;
        }

        // Optional: warn if some addresses are missing, but don't force mock mode
        if (!isMockMode && Object.values(CONTRACT_ADDRESSES).some(a => !a)) {
            console.warn('⚠️ Some contract addresses missing. Related features will be disabled.');
        }

        console.log(isMockMode ? '🎭 Degen-Office: MOCK MODE' : '⛓️ Degen-Office: LIVE MODE');
    }

    // ═══════════════════════════════════════════════════
    // Wallet Connection
    // ═══════════════════════════════════════════════════
    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            // Fallback to pure mock if no MetaMask
            console.warn('MetaMask not detected. Using mock address.');
            connectedAddress = '0xDEGEN' + Math.random().toString(16).slice(2, 10) + '...COOL';
            currentRole = '👔 员工';
            return { address: connectedAddress, role: currentRole };
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        signer = await provider.getSigner();
        connectedAddress = accounts[0];

        // We don't force a switch to X Layer in Hybrid mode if we just want to demo the UI,
        // but it's better for "realism". Let's try but not fail.
        try {
            const network = await provider.getNetwork();
            if (Number(network.chainId) !== CHAIN.id) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x' + CHAIN.id.toString(16) }]
                });
            }
        } catch (e) {
            console.warn('Chain switch declined, proceeding anyway.');
        }

        // Initialize contract instances (only if addresses are provided)
        const workingContracts = {};
        if (CONTRACT_ADDRESSES.NiuMaCoin) {
            workingContracts.niuMaCoin = new ethers.Contract(CONTRACT_ADDRESSES.NiuMaCoin, CONTRACT_ABIS.NiuMaCoin, signer);
        }
        if (CONTRACT_ADDRESSES.DailyPOAP) {
            workingContracts.dailyPOAP = new ethers.Contract(CONTRACT_ADDRESSES.DailyPOAP, CONTRACT_ABIS.DailyPOAP, signer);
        }
        if (CONTRACT_ADDRESSES.BountyEscrow) {
            workingContracts.bountyEscrow = new ethers.Contract(CONTRACT_ADDRESSES.BountyEscrow, CONTRACT_ABIS.BountyEscrow, signer);
        }
        if (CONTRACT_ADDRESSES.DegenOffice) {
            workingContracts.degenOffice = new ethers.Contract(CONTRACT_ADDRESSES.DegenOffice, CONTRACT_ABIS.DegenOffice, signer);
        }

        // Atomic update to avoid partial state access
        contracts = workingContracts;

        // Get role
        try {
            if (contracts?.degenOffice) {
                currentRole = await contracts.degenOffice.getRoleName(connectedAddress);
            } else {
                currentRole = '👔 员工';
            }
        } catch (e) {
            console.warn('Failed to fetch role from contract:', e);
            currentRole = '👔 员工';
        }

        return { address: connectedAddress, role: currentRole };
    }

    function disconnectWallet() {
        provider = null;
        signer = null;
        connectedAddress = null;
        currentRole = null;
        contracts = {};
    }

    // ═══════════════════════════════════════════════════
    // SIWE (Sign-In with Ethereum)
    // ═══════════════════════════════════════════════════
    async function signIn() {
        if (!connectedAddress) throw new Error('Wallet not connected');
        const message = `Welcome to Degen-Office! 🏢⛓️\n\nSign this message to prove you own this wallet.\nNo gas fees. No hidden transactions.\nJust pure cryptographic flex.\n\nWallet: ${connectedAddress}\nTimestamp: ${new Date().toISOString()}\nChain: ${CHAIN.name}`;
        const signature = await signer ? await signer.signMessage(message) : 'MOCK_SIG_' + Math.random().toString(16);
        return { success: true, address: connectedAddress, signature };
    }

    // ═══════════════════════════════════════════════════
    // Token Operations
    // ═══════════════════════════════════════════════════
    async function getNiuMaBalance(address) {
        if (isMockMode) return HYBRID_STORE.getNiumaBalance(address || connectedAddress);
        if (!contracts?.niuMaCoin) return HYBRID_STORE.getNiumaBalance(address || connectedAddress);
        const addr = address || connectedAddress;
        try {
            const bal = await contracts.niuMaCoin.balanceOf(addr);
            return ethers.formatEther(bal);
        } catch (e) {
            return HYBRID_STORE.getNiumaBalance(addr);
        }
    }

    async function claimFaucet() {
        await _mockDelay();
        const newBalance = HYBRID_STORE.updateNiumaBalance(connectedAddress, '10000');
        return { hash: _mockHash(), confirmed: true, newBalance };
    }

    // ═══════════════════════════════════════════════════
    // Attendance (POAP)
    // ═══════════════════════════════════════════════════
    async function clockIn() {
        await _mockDelay();
        HYBRID_STORE.addAttendance(connectedAddress, _todayId());
        return { hash: _mockHash(), dayId: _todayId() };
    }

    async function hasClockedToday() {
        const history = HYBRID_STORE.getAttendance(connectedAddress);
        return history.map(String).includes(String(_todayId()));
    }

    async function getAttendanceHistory() {
        return HYBRID_STORE.getAttendance(connectedAddress);
    }

    async function depositStake(ethAmount) {
        await _mockDelay();
        return { hash: _mockHash(), confirmed: true };
    }

    // ═══════════════════════════════════════════════════
    // Bounty Operations
    // ═══════════════════════════════════════════════════
    async function createBounty(description, amount) {
        await _mockDelay();
        HYBRID_STORE.addBounty({
            id: HYBRID_STORE.getBounties().length,
            creator: shortAddr(connectedAddress),
            description, amount: String(amount), status: 0,
            timestamp: Date.now()
        });
        return { hash: _mockHash() };
    }

    async function claimBounty(bountyId) {
        await _mockDelay();
        HYBRID_STORE.updateBounty(bountyId, { status: 1, worker: shortAddr(connectedAddress) });
        return { hash: _mockHash() };
    }

    async function completeBounty(bountyId) {
        await _mockDelay();
        const bounties = HYBRID_STORE.getBounties();
        const b = bounties[bountyId];
        if (b) {
            HYBRID_STORE.updateBounty(bountyId, { status: 2 });
            HYBRID_STORE.updateNiumaBalance(connectedAddress, b.amount);
        }
        return { hash: _mockHash() };
    }

    async function getBounties() {
        return HYBRID_STORE.getBounties();
    }

    // ═══════════════════════════════════════════════════
    // Company & Rug Pull
    // ═══════════════════════════════════════════════════
    async function getCompanyStats() {
        const ethPrice = await getEthPrice();
        const stats = HYBRID_STORE.load('company_stats', {
            ethBalance: '4.2069',
            tokenBalance: '1000000',
            employeeCount: 7,
            rugPulled: false
        });

        return {
            ...stats,
            ethPrice: ethPrice || '2500.00'
        };
    }

    async function getEthPrice() {
        try {
            const resp = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
            const data = await resp.json();
            cachedEthPrice = data.price;
            return data.price;
        } catch (e) {
            console.warn('Failed to fetch real price, using fallback');
            return cachedEthPrice;
        }
    }

    async function executeRugPull() {
        await _mockDelay();
        HYBRID_STORE.save('company_stats', {
            ethBalance: '0',
            tokenBalance: '0',
            employeeCount: 7,
            rugPulled: true
        });
        return { hash: _mockHash(), confirmed: true };
    }

    async function registerEmployee() {
        await _mockDelay();
        return { hash: _mockHash(), confirmed: true };
    }

    // ═══════════════════════════════════════════════════
    // IPFS Upload (via backend proxy or Pinata)
    // ═══════════════════════════════════════════════════
    async function uploadToIPFS(content, filename) {
        if (isMockMode) {
            await _mockDelay();
            const fakeCID = 'Qm' + Array(44).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('');
            return { cid: fakeCID, url: `https://gateway.pinata.cloud/ipfs/${fakeCID}` };
        }
        const formData = new FormData();
        const blob = new Blob([content], { type: 'text/plain' });
        formData.append('file', blob, filename || 'announcement.txt');
        const resp = await fetch('/api/ipfs/upload', { method: 'POST', body: formData });
        return await resp.json();
    }

    // ═══════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════
    function _todayId() {
        const d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    function _mockHash() {
        return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    function _mockDelay() {
        return new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
    }

    function getExplorerUrl(txHash) {
        return `${CHAIN.explorer}/tx/${txHash}`;
    }

    function getState() {
        return {
            isConnected: !!connectedAddress,
            isMockMode,
            address: connectedAddress,
            shortAddress: shortAddr(connectedAddress),
            role: currentRole,
            chain: CHAIN,
            ethPrice: cachedEthPrice
        };
    }

    // Public API
    return {
        init, connectWallet, disconnectWallet, signIn,
        getNiuMaBalance, claimFaucet,
        clockIn, hasClockedToday, getAttendanceHistory, depositStake,
        createBounty, claimBounty, completeBounty, getBounties,
        getCompanyStats, getEthPrice, executeRugPull, registerEmployee,
        uploadToIPFS,
        getExplorerUrl, getState, shortAddr,
        CHAIN
    };
})();
