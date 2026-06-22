document.addEventListener("DOMContentLoaded", () => {
    const writeBtn = document.getElementById('btn-write');
    const readBtn = document.getElementById('btn-read');
    
    const leaderLog = document.getElementById('leader-log');
    const follower1Log = document.getElementById('follower-1-log');
    const follower2Log = document.getElementById('follower-2-log');
    const statusText = document.getElementById('replication-status');

    let globalCounter = 0;
    
    // Database State
    let leaderState = "Data V0";
    let follower1State = "Data V0";
    let follower2State = "Data V0";

    function appendLog(element, text, isSafe = false) {
        const div = document.createElement('div');
        div.className = `log-entry ${isSafe ? 'safe' : 'dirty'}`;
        div.textContent = text;
        element.appendChild(div);
        element.scrollTop = element.scrollHeight;
    }

    writeBtn.addEventListener('click', () => {
        globalCounter++;
        const newData = `Data V${globalCounter}`;
        
        // 1. Leader writes instantly
        leaderState = newData;
        appendLog(leaderLog, `WAL: Saved ${newData}`);
        statusText.textContent = `Write successful on Leader. Streaming WAL to Followers...`;
        statusText.style.color = "var(--text-muted)";

        // 2. Follower 1 gets the data after 800ms
        setTimeout(() => {
            follower1State = newData;
            appendLog(follower1Log, `Replicated: ${newData}`, true);
        }, 800);

        // 3. Follower 2 gets the data after 1500ms (more network lag)
        setTimeout(() => {
            follower2State = newData;
            appendLog(follower2Log, `Replicated: ${newData}`, true);
            statusText.textContent = `All nodes synchronized to ${newData}.`;
            statusText.style.color = "#10b981";
        }, 1500);
    });

    readBtn.addEventListener('click', () => {
        // Load Balancer randomly picks Follower 1 or 2 for the read
        const useFollower1 = Math.random() > 0.5;
        const targetNode = useFollower1 ? follower1Log : follower2Log;
        const readData = useFollower1 ? follower1State : follower2State;
        
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.style.borderLeftColor = '#3b82f6';
        div.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        div.textContent = `Client Read: ${readData}`;
        
        targetNode.appendChild(div);
        targetNode.scrollTop = targetNode.scrollHeight;

        // Check if the read data matches the leader
        if (readData !== leaderState) {
            statusText.textContent = `STALE READ DETECTED! Client saw ${readData}, but Leader has ${leaderState}.`;
            statusText.style.color = "#ef4444";
        }
    });

    // Initial State Display
    appendLog(leaderLog, `Init: ${leaderState}`, true);
    appendLog(follower1Log, `Init: ${follower1State}`, true);
    appendLog(follower2Log, `Init: ${follower2State}`, true);
});