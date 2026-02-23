const WALLET_ADDR = "8A1jQsrACPy4yWbGzCJRFMZCay6sfnsDnY73dnN1dbiQPTb3fmi2e1hhHMQpmbUc4gKkAPWgaykERTJsFSAukW1iLDJUigP";

let timeLeft = 60;
let countdown = null;
let currentFilter = 'all'; // all, online, offline

async function fetchData() {
    if(!WALLET_ADDR) return;
    const listDiv = document.getElementById('worker-list');
    
    try {
        const resPool = await fetch(`https://www.supportxmr.com/api/miner/${WALLET_ADDR}/identifiers?_=${Date.now()}`);
        const onlineNow = await resPool.json();

        let history = {};
        try {
            const resHistory = await fetch(`data.json?t=${Date.now()}`);
            if (resHistory.ok) history = await resHistory.json();
        } catch (e) { console.log("Waiting for data.json..."); }

        const now = Date.now();
        let allWorkers = new Set([...Object.keys(history), ...onlineNow]);
        listDiv.innerHTML = "";
        let onCount = 0;

        Array.from(allWorkers).sort().forEach(name => {
            const isOn = onlineNow.includes(name);
            const hData = history[name] || { status: isOn ? 'online' : 'offline', since: now, first_seen: now };
            
            const bornTs = hData.first_seen || hData.since || now;
            const bornDate = new Date(bornTs).toLocaleDateString('vi-VN');

            if (isOn) onCount++;

            if (currentFilter === 'online' && !isOn) return;
            if (currentFilter === 'offline' && isOn) return;

            const card = document.createElement('div');
            card.className = `card ${isOn ? 'online' : 'offline'}`;
            
            const eventTime = new Date(hData.since);
            const fullTime = `${eventTime.getHours().toString().padStart(2,'0')}:${eventTime.getMinutes().toString().padStart(2,'0')} - ${eventTime.getDate().toString().padStart(2,'0')}/${(eventTime.getMonth()+1).toString().padStart(2,'0')}`;

            let timeDisplay = isOn ? 
                `UPTIME: <span class="time-val">${formatDuration(now - hData.since)}</span>` : 
                `DOWN SINCE: <span class="time-val" style="color:var(--neon-red)">${fullTime}</span>`;

            card.innerHTML = `
                <div class="born-tag">ENTRY_DATE: ${bornDate}</div>
                <span class="name">_ID: ${name}</span>
                <div class="info" style="color:${isOn ? 'var(--neon-green)' : 'var(--neon-red)'}">
                    STATUS: <b>${isOn ? '[ OPERATIONAL ]' : '[ DISCONNECTED ]'}</b>
                </div>
                <div class="info">${timeDisplay}</div>
            `;
            listDiv.appendChild(card);
        });

        document.getElementById('total-count').innerText = `${onCount}/${allWorkers.size}`;

    } catch (e) { 
        console.error(e);
        listDiv.innerHTML = `<div style='color:red; padding:20px;'>[ ERROR ]: CONNECTION_LOST</div>`;
    }
}

function setFilter(type) {
    currentFilter = type;
    document.querySelectorAll('.btn-main').forEach(btn => btn.classList.remove('active'));
    if(type === 'all') document.getElementById('btn-all').classList.add('active');
    if(type === 'online') document.getElementById('btn-on').classList.add('active');
    if(type === 'offline') document.getElementById('btn-off').classList.add('active');
    fetchData();
}

function formatDuration(ms) {
    let s = Math.floor(ms / 1000);
    let m = Math.floor(s / 60);
    let h = Math.floor(m / 60);
    let d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${s % 60}s`;
}

function initMonitor() {
    fetchData();
    if(countdown) clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--;
        if(document.getElementById('timer')) document.getElementById('timer').innerText = timeLeft;
        if(timeLeft <= 0) { timeLeft = 60; fetchData(); }
    }, 1000);
}

window.onload = initMonitor;
