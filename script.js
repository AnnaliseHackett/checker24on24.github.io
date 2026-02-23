const WALLET_ADDR = "8A1jQsrACPy4yWbGzCJRFMZCay6sfnsDnY73dnN1dbiQPTb3fmi2e1hhHMQpmbUc4gKkAPWgaykERTJsFSAukW1iLDJUigP";

let timeLeft = 60;
let countdown = null;
let showOnlyOff = false;

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
            const hData = history[name] || { status: isOn ? 'online' : 'offline', since: now };
            
            let displaySince = hData.since;
            if (hData.status === 'online' && !isOn) displaySince = now; 
            if (hData.status === 'offline' && isOn) displaySince = now; 

            if (isOn) onCount++;
            if (showOnlyOff && isOn) return;

            const card = document.createElement('div');
            
            card.className = `card ${isOn ? 'online' : 'offline'}`;
            
            const eventTime = new Date(displaySince);
            const fullTime = `${eventTime.getHours().toString().padStart(2,'0')}:${eventTime.getMinutes().toString().padStart(2,'0')} - ${eventTime.getDate().toString().padStart(2,'0')}/${(eventTime.getMonth()+1).toString().padStart(2,'0')}/${eventTime.getFullYear()}`;

            let timeDisplay = isOn ? 
                `UPTIME: <span class="time-val">${formatDuration(now - displaySince)}</span>` : 
                `DOWN SINCE: <span class="time-val" style="color:var(--neon-red)">${fullTime}</span>`;

            card.innerHTML = `
                <span class="name">pokemon: ${name}</span>
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

function initMonitor() {
    fetchData();
    if(countdown) clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--;
        if(document.getElementById('timer')) document.getElementById('timer').innerText = timeLeft;
        if(timeLeft <= 0) { timeLeft = 60; fetchData(); }
    }, 1000);
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

function toggleFilter() {
    showOnlyOff = !showOnlyOff;
    const btn = document.getElementById('filter-btn');
    if(btn) {
        btn.innerText = showOnlyOff ? "FILTER_OFFLINE: ON" : "FILTER_OFFLINE: OFF";
        btn.classList.toggle('active', showOnlyOff);
    }
    fetchData();
}

window.onload = initMonitor;


