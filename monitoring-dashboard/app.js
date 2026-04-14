document.addEventListener('DOMContentLoaded', () => {

    // Generate random string for hashes
    const generateHash = (len = 16) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `0x${result}...`;
    };

    // 1. Initial 35 user live transactions
    const transactionsList = document.getElementById('live-transactions');
    const txTypes = [
        { type: 'send', icon: 'ph-arrow-up-right', colorClass: 'send', text: 'Sent to' },
        { type: 'receive', icon: 'ph-arrow-down-left', colorClass: 'receive', text: 'Received from' }
    ];
    
    let txCount = 0;
    
    const addTransaction = (prepend = false) => {
        if (txCount >= 35 && !prepend) return;
        
        const txT = txTypes[Math.floor(Math.random() * txTypes.length)];
        const amount = (Math.random() * 500 + 10).toFixed(2);
        const hash = generateHash(8);
        const userHash = generateHash(6);
        
        const txEl = document.createElement('div');
        txEl.className = 'tx-item';
        txEl.innerHTML = `
            <div class="tx-info">
                <div class="tx-icon ${txT.colorClass}"><i class="ph ${txT.icon}"></i></div>
                <div class="tx-details">
                    <h4>${txT.text} ${userHash}</h4>
                    <p>Hash: ${hash}</p>
                </div>
            </div>
            <div class="tx-amount">
                <div class="amount ${txT.colorClass === 'receive' ? 'text-green' : ''}">
                    ${txT.type === 'receive' ? '+' : '-'}${amount} XLM
                </div>
                <div class="time">Just now</div>
            </div>
        `;
        
        if (prepend) {
            transactionsList.prepend(txEl);
            if (transactionsList.children.length > 35) {
                transactionsList.removeChild(transactionsList.lastChild);
            }
        } else {
            transactionsList.appendChild(txEl);
        }
        txCount++;
    };

    // Initialize 35 transactions
    for (let i = 0; i < 15; i++) {
        addTransaction();
    }
    
    // Simulate live transactions coming in
    setInterval(() => {
        addTransaction(true);
        // Animate count KPI
        const txCountEl = document.getElementById('tx-count');
        const currentCount = parseInt(txCountEl.textContent.replace(/,/g, ''));
        txCountEl.textContent = (currentCount + 1).toLocaleString();
    }, 4500);

    // 2. Weekly Activity Chart (Bar Chart CSS)
    const chartContainer = document.getElementById('weekly-chart');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    days.forEach(day => {
        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        
        // Random height between 20% and 90%
        const heightPercent = Math.floor(Math.random() * 70) + 20;
        
        // Set height after slight delay for animation
        setTimeout(() => {
            bar.style.height = `${heightPercent}%`;
        }, 100);
        
        const label = document.createElement('span');
        label.textContent = day;
        
        barWrapper.appendChild(bar);
        barWrapper.appendChild(label);
        chartContainer.appendChild(barWrapper);
    });

    // 3. Monitored Wallets Mocking
    const walletsList = document.getElementById('monitored-wallets');
    const mockWallets = [
        { name: "Organizers Pool", hash: generateHash(8), bal: "450,210 XLM" },
        { name: "Beneficiary Escrow", hash: generateHash(8), bal: "12,400 XLM" },
        { name: "Relifo Treasury", hash: generateHash(8), bal: "1,200,000 XLM" },
        { name: "Campaign: Africa Relief", hash: generateHash(8), bal: "8,500 XLM" },
        { name: "Campaign: Water Wells", hash: generateHash(8), bal: "3,250 XLM" },
    ];

    mockWallets.forEach(wallet => {
        const wEl = document.createElement('div');
        wEl.className = 'wallet-item';
        wEl.innerHTML = `
            <div class="wallet-profile">
                <div class="wallet-avatar"><i class="ph ph-wallet"></i></div>
                <div class="wallet-info">
                    <h4>${wallet.name}</h4>
                    <p>${wallet.hash}</p>
                </div>
            </div>
            <div class="wallet-balance">${wallet.bal}</div>
        `;
        walletsList.appendChild(wEl);
    });

    // 4. Recent Activity
    const activityFeed = document.getElementById('recent-activity');
    const activities = [
        { dot: 'blue', text: 'New beneficiary <strong style="color:var(--text-primary)">Alex M.</strong> registered to <em>Africa Relief</em>', time: '5 mins ago' },
        { dot: 'purple', text: 'Campaign <strong>Water Wells</strong> reached 50% milestone', time: '12 mins ago' },
        { dot: 'orange', text: 'System update: Stellar Oracle synced', time: '1 hour ago' },
        { dot: 'blue', text: 'Organizer <strong>John D.</strong> verified 5 beneficiaries', time: '3 hours ago' },
    ];

    activities.forEach(act => {
        const actEl = document.createElement('div');
        actEl.className = 'activity-item';
        actEl.innerHTML = `
            <div class="activity-dot ${act.dot}"></div>
            <div class="activity-details">
                <p>${act.text}</p>
                <span>${act.time}</span>
            </div>
        `;
        activityFeed.appendChild(actEl);
    });
});
