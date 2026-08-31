import { RelayPoolWorker } from '../../index';

const logEl = document.getElementById('log')!;
const startBtn = document.getElementById('start')!;
const animEl = document.getElementById('anim')!;

// Simple main-thread animation to show responsiveness
let pos = 0;
let dir = 1;
function animate() {
    pos += 2 * dir;
    if (pos > 300 || pos < 0) dir *= -1;
    animEl.style.left = pos + 'px';
    requestAnimationFrame(animate);
}
animate();

function log(msg: string) {
    const el = document.createElement('div');
    el.className = 'event';
    el.textContent = `${new Date().toLocaleTimeString()}: ${msg}`;
    logEl.insertBefore(el, logEl.firstChild);
}

startBtn.onclick = () => {
    log('Starting worker...');
    
    // In a real app, you'd point this to the built worker JS file
    // For this example, we assume it's available at this path
    const worker = new Worker(new URL('../../lib/nostr-relaypool.worker.js', import.meta.url), { type: 'module' });
    const pool = new RelayPoolWorker(worker);

    const relays = [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.snort.social"
    ];

    pool.onerror((url, err) => log(`Error from ${url}: ${err}`));
    pool.onnotice((url, msg) => log(`Notice from ${url}: ${msg}`));

    log('Subscribing to global feed (kind 1)...');
    pool.subscribe(
        [{ kinds: [1], limit: 10 }],
        relays,
        (event, isAfterEose, relayURL) => {
            log(`[${relayURL}] Event ${event.id.slice(0,8)}: ${event.content.slice(0, 50)}...`);
        }
    );

    startBtn.disabled = true;
    startBtn.textContent = 'Subscribed';
};
