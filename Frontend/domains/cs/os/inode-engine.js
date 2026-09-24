/**
 * Operating Systems: Chapter 5 Inode File System Interactive Engine
 * Developed for SCME Platform
 */

document.addEventListener("DOMContentLoaded", () => {
    initInodeSimulator();
});

function initInodeSimulator() {
    const btnCreate = document.getElementById("btn-inode-create");
    const btnAppend = document.getElementById("btn-inode-append");
    const btnHardlink = document.getElementById("btn-inode-hardlink");
    const btnDelete = document.getElementById("btn-inode-delete");
    const btnReset = document.getElementById("btn-inode-reset");

    const spanInodeNum = document.getElementById("inode-num-val");
    const spanLinks = document.getElementById("inode-links-val");
    const spanFileSize = document.getElementById("inode-size-val");
    const spanBlocks = document.getElementById("inode-blocks-val");
    const directBlocksBox = document.getElementById("inode-direct-blocks");
    const indirectBox = document.getElementById("inode-indirect-blocks");
    const dentryBox = document.getElementById("dentry-list");
    const logBox = document.getElementById("inode-log");

    let fileSizeKB = 4; // 1 block = 4KB
    let linkCount = 1;
    let fileNames = ["report.pdf"];
    let directBlocks = [104];
    let indirectBlocks = [];

    function log(msg, color = "") {
        if (!logBox) return;
        const line = document.createElement("div");
        line.style.fontSize = "0.8rem";
        line.style.fontFamily = "monospace";
        if (color) line.style.color = color;
        line.innerText = `> ${msg}`;
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    }

    function render() {
        if (spanInodeNum) spanInodeNum.innerText = linkCount > 0 ? "Inode #48291" : "Free (Unallocated)";
        if (spanLinks) spanLinks.innerText = `${linkCount}`;
        if (spanFileSize) spanFileSize.innerText = linkCount > 0 ? `${fileSizeKB} KB` : "0 KB";
        if (spanBlocks) spanBlocks.innerText = linkCount > 0 ? `${directBlocks.length + indirectBlocks.length}` : "0";

        // Render Directory Entries (dentries)
        if (dentryBox) {
            dentryBox.innerHTML = "";
            if (fileNames.length === 0) {
                dentryBox.innerHTML = '<span class="placeholder-text" style="color: var(--text-muted); font-size: 0.8rem;">No directory entries pointing to this inode.</span>';
            } else {
                fileNames.forEach(fn => {
                    const tag = document.createElement("div");
                    tag.style.padding = "0.3rem 0.6rem";
                    tag.style.background = "rgba(59, 130, 246, 0.15)";
                    tag.style.border = "1px solid #3b82f6";
                    tag.style.borderRadius = "4px";
                    tag.style.fontSize = "0.8rem";
                    tag.style.fontFamily = "monospace";
                    tag.innerHTML = `📄 <strong>${fn}</strong> → Inode #48291`;
                    dentryBox.appendChild(tag);
                });
            }
        }

        // Render Direct Block Pointers (up to 4 in demo)
        if (directBlocksBox) {
            directBlocksBox.innerHTML = "";
            for (let i = 0; i < 4; i++) {
                const cell = document.createElement("div");
                cell.style.width = "48px";
                cell.style.height = "48px";
                cell.style.display = "flex";
                cell.style.alignItems = "center";
                cell.style.justifyContent = "center";
                cell.style.borderRadius = "4px";
                cell.style.fontSize = "0.75rem";
                cell.style.fontFamily = "monospace";
                cell.style.border = "1px solid var(--card-border)";

                if (i < directBlocks.length && linkCount > 0) {
                    cell.style.background = "#3b82f6";
                    cell.style.color = "white";
                    cell.innerText = `B#${directBlocks[i]}`;
                } else {
                    cell.style.background = "rgba(0,0,0,0.05)";
                    cell.style.color = "var(--text-muted)";
                    cell.innerText = "Empty";
                }
                directBlocksBox.appendChild(cell);
            }
        }

        // Render Indirect Block Pointers
        if (indirectBox) {
            indirectBox.innerHTML = "";
            if (indirectBlocks.length === 0 || linkCount === 0) {
                indirectBox.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem;">Single Indirect: NULL</span>';
            } else {
                const wrapper = document.createElement("div");
                wrapper.style.display = "flex";
                wrapper.style.gap = "0.4rem";
                indirectBlocks.forEach(blk => {
                    const cell = document.createElement("div");
                    cell.style.padding = "0.2rem 0.5rem";
                    cell.style.background = "#10b981";
                    cell.style.color = "white";
                    cell.style.borderRadius = "4px";
                    cell.style.fontSize = "0.75rem";
                    cell.style.fontFamily = "monospace";
                    cell.innerText = `B#${blk}`;
                    wrapper.appendChild(cell);
                });
                indirectBox.appendChild(wrapper);
            }
        }
    }

    if (btnCreate) btnCreate.onclick = () => {
        linkCount = 1;
        fileNames = ["report.pdf"];
        fileSizeKB = 4;
        directBlocks = [104];
        indirectBlocks = [];
        log("Created file 'report.pdf'. Allocated Inode #48291, direct block 104.", "#3b82f6");
        render();
    };

    if (btnAppend) btnAppend.onclick = () => {
        if (linkCount === 0) {
            log("Cannot append: File does not exist! Click 'Create File' first.", "#ef4444");
            return;
        }
        fileSizeKB += 4;
        const newBlockId = 104 + directBlocks.length + indirectBlocks.length;
        if (directBlocks.length < 4) {
            directBlocks.push(newBlockId);
            log(`Appended 4 KB to file. Allocated direct block #${newBlockId}.`, "#10b981");
        } else if (indirectBlocks.length < 3) {
            indirectBlocks.push(newBlockId);
            log(`Direct blocks full! Allocated through Single Indirect pointer block #${newBlockId}.`, "#f59e0b");
        } else {
            log("Demo storage capacity reached (28 KB).", "#ef4444");
        }
        render();
    };

    if (btnHardlink) btnHardlink.onclick = () => {
        if (linkCount === 0) {
            log("Cannot create hard link: Target inode is dead.", "#ef4444");
            return;
        }
        const linkName = `backup_link_${linkCount}.pdf`;
        linkCount++;
        fileNames.push(linkName);
        log(`Created Hard Link '${linkName}'. Inode reference count incremented to ${linkCount}.`, "#8b5cf6");
        render();
    };

    if (btnDelete) btnDelete.onclick = () => {
        if (linkCount === 0) return;
        const removed = fileNames.pop();
        linkCount--;
        log(`Unlinked (rm) '${removed}'. Remaining link count = ${linkCount}.`, "#f59e0b");
        if (linkCount === 0) {
            directBlocks = [];
            indirectBlocks = [];
            fileSizeKB = 0;
            log("Link count reached ZERO! Kernel deallocated Inode #48291 and freed all data blocks.", "#ef4444");
        }
        render();
    };

    if (btnReset) btnReset.onclick = () => {
        if (logBox) logBox.innerHTML = "";
        btnCreate.onclick();
    };

    render();
}
