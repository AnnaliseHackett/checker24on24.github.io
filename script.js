// [ SETTINGS ]
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

        const resHistory = await fetch(`data.json?t=${Date.now()}`);
        let history = {};
        if (resHistory.ok) {
            history = await resHistory.json();
        }

        const now = Date.now();
        let allWorkers = new Set([...Object.keys(history), ...onlineNow]);
        listDiv.innerHTML = "";
        let onCount = 0;

        Array.from(allWorkers).sort().forEach(name => {
            const isOn = onlineNow.includes(name);
            const statusStr = isOn ? 'online' : 'offline';

            if (!history[name]) {
                history[name] = { status: statusStr, since: now };
            }
            
            if (history[name].status !== statusStr) {
                history[name].status = statusStr;
                history[name].since = now;
            }

            if (isOn) onCount++;
            if (showOnlyOff && isOn) return;

            const card = document.createElement('div');
            card.className = `card ${isOn ? 'online' : 'offline'}`;
            
            let timeDisplay = "";
            const eventTime = new Date(history[name].since);
            const day = String(eventTime.getDate()).padStart(2, '0');
            const mon = String(eventTime.getMonth() + 1).padStart(2, '0');
            const yr = eventTime.getFullYear();
            const hr = String(eventTime.getHours()).padStart(2, '0');
            const min = String(eventTime.getMinutes()).padStart(2, '0');
            const fullTime = `${hr}:${min} - ${day}/${mon}/${yr}`;

            if (isOn) {
                timeDisplay = `UPTIME: <span class="time-val">${formatDuration(now - history[name].since)}</span>`;
            } else {
                timeDisplay = `DOWN SINCE: <span class="time-val" style="color:var(--neon-red)">${fullTime}</span>`;
            }

            card.innerHTML = `
                <span class="name">_ID: ${name}</span>
                <div class="info" style="color:${isOn ? 'var(--neon-green)' : 'var(--neon-red)'}">
                    STATUS: <b>${isOn ? '[ OPERATIONAL ]' : '[ DISCONNECTED ]'}</b>
                </div>
                <div class="info">${timeDisplay}</div>
                <div class="info" style="font-size:9px; opacity:0.3; margin-top:10px;">LST_CHK: ${new Date().toLocaleTimeString()}</div>
            `;
            listDiv.appendChild(card);
        });

        document.getElementById('total-count').innerText = `${onCount}/${allWorkers.size}`;

        localStorage.setItem('uptime_history', JSON.stringify(history));

    } catch (e) { 
        console.error("SYNC_ERROR: Check if data.json exists on GitHub"); 
    }
}

function initMonitor() {
    fetchData();
    if(countdown) clearInterval(countdown);
    countdown = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if(timeLeft <= 0) { timeLeft = 60; fetchData(); }
    }, 1000);
}

function toggleFilter() {
    showOnlyOff = !showOnlyOff;
    const btn = document.getElementById('filter-btn');
    btn.innerText = showOnlyOff ? "FILTER_OFFLINE: ON" : "FILTER_OFFLINE: OFF";
    btn.classList.toggle('active', showOnlyOff);
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

window.onload = initMonitor;
