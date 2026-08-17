function goToEventHub() {
    currentEvent.name = document.getElementById("eventNameInput").value.trim() || "Untitled Event";
    currentEvent.description = document.getElementById("eventDescInput").value.trim();
    currentEvent.isPublic = document.getElementById("isPublicToggle").checked;
    let wantsRanked = document.getElementById("isRankedToggle").checked;
    
    let thumbSrc = document.getElementById('thumbnailPreview').src;
    if(thumbSrc && thumbSrc.startsWith('data:')) currentEvent.thumbnail = thumbSrc;

    currentEvent.unit = confUnit;
    currentEvent.measureType = confMeasure;
    currentEvent.limitType = confLimit;
    
    if(!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();
    if(!currentEvent.status) currentEvent.status = "ongoing";

    if(wantsRanked) {
        let existingRankedCount = loadedEvents.filter(e => {
            let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
            let status = e.details.status || 'finished';
            return eYear === String(currentEvent.year) && e.details.isRanked !== false && status === 'finished' && e.id !== currentEvent.id;
        }).length;

        if(existingRankedCount >= 7) {
            alert(`Limit reached! You already have 7 ranked tournaments in ${currentEvent.year}. This event will be set as Unranked.`);
            wantsRanked = false;
            document.getElementById("isRankedToggle").checked = false;
        }
    }
    currentEvent.isRanked = wantsRanked;

    if (!currentEvent.isStarted) {
        let items = parseParticipants(document.getElementById("bulkParticipantsInput").value);
        let existingMap = {};
        currentEvent.participants.forEach(p => existingMap[p.name.toLowerCase()] = { catches: p.catches, id: p.id, penalties: p.penalties || [] });

        currentEvent.participants = items.map(name => {
            let lowerName = name.toLowerCase();
            return {
                id: existingMap[lowerName] ? existingMap[lowerName].id : 'p_' + Math.random().toString(36).substr(2, 9),
                name: name,
                catches: existingMap[lowerName] ? existingMap[lowerName].catches : [],
                penalties: existingMap[lowerName] ? existingMap[lowerName].penalties : []
            };
        });
        currentEvent.isStarted = true;
    }
    
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    
    history.pushState({view: 'hubSection'}, "");
    renderHubUI();
}

function backToSetup() {
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("setupSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    
    history.pushState({view: 'setupSection'}, "");
}

function promptFinishEvent() {
    if(currentEvent.status === 'finished') return;
    if (confirm(t('finish_warning'))) {
        currentEvent.status = "finished";
        saveCurrentEvent(true);
    }
}

function openAddParticipantModal() {
    if(currentEvent.status === 'finished') return;
    document.getElementById("modalParticipantName").value = "";
    document.getElementById("participantModal").classList.remove("hidden");
    setTimeout(() => document.getElementById("modalParticipantName").focus(), 100);
}

function closeAddParticipantModal() { document.getElementById("participantModal").classList.add("hidden"); }

function confirmAddParticipantModal() {
    let items = parseParticipants(document.getElementById("modalParticipantName").value);
    items.forEach(name => currentEvent.participants.push({ id: 'p_'+Math.random().toString(36).substr(2,9), name: name, catches: [], penalties: [] }));
    closeAddParticipantModal(); renderHubUI();
}

function editParticipantName(index) {
    if(currentEvent.status === 'finished') return;
    let p = currentEvent.participants[index];
    let newName = prompt(t('edit_name') + ":", p.name);
    if (newName && newName.trim() !== "" && newName.trim() !== p.name) {
        p.name = newName.trim();
        renderHubUI(); saveCurrentEvent(false);
    }
}

function selectModalSpecies(abbr, element) {
    selectedModalSpecies = abbr;
    document.querySelectorAll("#modalSpeciesTabs .species-tab").forEach(tab => tab.classList.remove("active"));
    if (element) element.classList.add("active");
}

function openFishModal(pIndexReal) {
    if(currentEvent.status === 'finished') return;
    activeFishParticipantIndex = pIndexReal;
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    document.getElementById("modalFishSizeLabel").innerText = `${t('size_cm')} (${unitText})`;

    document.getElementById("modalSpeciesTabs").innerHTML = currentEvent.species.map((s, idx) => `
        <div class="species-tab ${idx === 0 ? 'active' : ''}" onclick="selectModalSpecies('${s.abbr}', this)">${s.abbr}</div>
    `).join("");
    
    selectedModalSpecies = currentEvent.species.length > 0 ? currentEvent.species[0].abbr : "";
    document.getElementById("modalFishSize").value = "";
    document.getElementById("fishModal").classList.remove("hidden");
    renderModalCatches();
    setTimeout(() => document.getElementById("modalFishSize").focus(), 100);
}

function closeFishModal() { document.getElementById("fishModal").classList.add("hidden"); activeFishParticipantIndex = null; selectedModalSpecies = ""; }

function confirmAddFishModal() {
    if (activeFishParticipantIndex === null || !selectedModalSpecies) return;
    let size = parseFloat(document.getElementById("modalFishSize").value.replace(',', '.'));
    if (isNaN(size) || size <= 0) return;

    let sp = currentEvent.species.find(s => s.abbr === selectedModalSpecies);
    if (sp && sp.tiers && sp.tiers.length > 0) {
        let firstFrom = parseFloat(sp.tiers[0].from);
        if (!isNaN(firstFrom) && size < firstFrom) {
            pendingSmallFish = { abbr: selectedModalSpecies, size };
            document.getElementById("smallFishWarningModal").classList.remove("hidden");
            return;
        }
    }
    executeAddFish(selectedModalSpecies, size);
}

function executeAddFish(abbr, size) {
    currentEvent.participants[activeFishParticipantIndex].catches.unshift({ abbr, size }); 
    document.getElementById("modalFishSize").value = ""; 
    renderModalCatches(); renderHubUI(); document.getElementById("modalFishSize").focus();
}

function cancelSmallFish() { document.getElementById("smallFishWarningModal").classList.add("hidden"); document.getElementById("modalFishSize").value = ""; pendingSmallFish = null; document.getElementById("modalFishSize").focus(); }
function ignoreSmallFish() { document.getElementById("smallFishWarningModal").classList.add("hidden"); if (pendingSmallFish) { executeAddFish(pendingSmallFish.abbr, pendingSmallFish.size); pendingSmallFish = null; } }

function removeFish(pIndexReal, cIdx) {
    currentEvent.participants[pIndexReal].catches.splice(cIdx, 1);
    if(activeFishParticipantIndex !== null) renderModalCatches();
    renderHubUI();
}

function renderModalCatches() {
    let container = document.getElementById("modalCurrentCatches");
    if (activeFishParticipantIndex === null) return;
    let p = currentEvent.participants[activeFishParticipantIndex];
    if (p.catches.length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center;">${t('no_catches')}</p>`; return; }
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    container.innerHTML = `<label style="font-size:13px; color:var(--text-muted); margin-bottom:8px; display:block;">${t('current_catches')}:</label>` + 
        p.catches.map((c, cIdx) => `
        <div class="flex flex-between" style="padding:12px 0; border-bottom:1px solid var(--border);">
            <span><b>${c.size}</b>${unitText} <span class="badge" style="background:#f1f5f9; box-shadow:none;">${c.abbr.toUpperCase()}</span></span>
            <button class="danger icon-btn" style="padding:6px 10px; box-shadow:none;" onclick="removeFish(${activeFishParticipantIndex}, ${cIdx})">✕</button>
        </div>`).join('');
}

function openPenaltyModal(pIndexReal) {
    if(currentEvent.status === 'finished') return;
    activePenaltyParticipantIndex = pIndexReal;
    document.getElementById("modalPenaltyPoints").value = "";
    document.getElementById("modalPenaltyReason").value = "";
    document.getElementById("penaltyModal").classList.remove("hidden");
    renderModalPenalties();
}
function closePenaltyModal() { document.getElementById("penaltyModal").classList.add("hidden"); activePenaltyParticipantIndex = null; }

function confirmAddPenalty() {
    if(activePenaltyParticipantIndex === null) return;
    let pts = parseFloat(document.getElementById("modalPenaltyPoints").value);
    let reason = document.getElementById("modalPenaltyReason").value.trim();
    if(isNaN(pts) || pts <= 0 || !reason) { alert("Enter valid points and reason."); return; }
    
    let p = currentEvent.participants[activePenaltyParticipantIndex];
    if(!p.penalties) p.penalties = [];
    p.penalties.push({ points: pts, reason: reason });
    
    document.getElementById("modalPenaltyPoints").value = "";
    document.getElementById("modalPenaltyReason").value = "";
    renderModalPenalties(); renderHubUI();
}

function removePenalty(pIndexReal, penIdx) {
    currentEvent.participants[pIndexReal].penalties.splice(penIdx, 1);
    if(activePenaltyParticipantIndex !== null) renderModalPenalties();
    renderHubUI();
}

function renderModalPenalties() {
    let container = document.getElementById("modalCurrentPenalties");
    if (activePenaltyParticipantIndex === null) return;
    let p = currentEvent.participants[activePenaltyParticipantIndex];
    if (!p.penalties || p.penalties.length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center;">No penalties.</p>`; return; }
    
    container.innerHTML = `<label style="font-size:13px; color:var(--text-muted); margin-bottom:8px; display:block;">Active Penalties:</label>` + 
        p.penalties.map((pen, idx) => `
        <div class="flex flex-between" style="padding:12px 0; border-bottom:1px solid var(--border);">
            <div><b style="color:var(--danger);">-${pen.points} pts</b> <span style="font-size:13px; color:var(--text-muted); margin-left:6px;">${pen.reason}</span></div>
            <button class="danger icon-btn" style="padding:6px 10px; box-shadow:none; background:transparent; color:var(--text-muted);" onclick="removePenalty(${activePenaltyParticipantIndex}, ${idx})">✕</button>
        </div>`).join('');
}

function showPenaltyReason(pIdx) {
    let p = currentEvent.participants[pIdx];
    if(p.penalties && p.penalties.length > 0) {
        let reasons = p.penalties.map(pen => `-${pen.points}pts: ${pen.reason}`).join('\n');
        alert(`Penalties for ${p.name}:\n\n${reasons}`);
    }
}

function calculateFishPoints(abbr, size, speciesList, measureType) {
    if(measureType === 'weight') return size; 
    let sp = speciesList.find(s => s.abbr === abbr);
    if (!sp) return size;
    let matchingTier = sp.tiers.find(t => {
        let f = t.from === "" ? 0 : parseFloat(t.from);
        if (t.to === 'above') return size >= f;
        return size >= f && size <= (t.to === "" ? Infinity : parseFloat(t.to));
    });
    let m = (matchingTier && matchingTier.multiplier !== "") ? parseFloat(matchingTier.multiplier) : 1.0;
    return size * (isNaN(m) ? 1.0 : m);
}

function renderHubUI() {
    let isFinished = currentEvent.status === 'finished';
    
    document.getElementById("hubAddNewParticipantBtn").style.display = isFinished ? "none" : "block";

    let query = document.getElementById("searchParticipant").value.toLowerCase();
    let container = document.getElementById("participantsHubContainer");
    let addRemoveText = t("add_remove_fish");

    let countEl = document.getElementById("hubParticipantCount");
    if(countEl) countEl.innerText = currentEvent.participants.length;

    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let filteredHtml = "";
    currentEvent.participants.forEach((p, pIndexReal) => {
        if (!p.name.toLowerCase().includes(query)) return;

        let catchesText = p.catches.length > 0 
            ? p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') 
            : `<span style="color:var(--text-muted); opacity: 0.7; font-style:italic;">${t('no_catches')}</span>`;

        let penBadge = (p.penalties && p.penalties.length > 0) ? `<button onclick="showPenaltyReason(${pIndexReal})" class="danger icon-btn" style="padding:2px 6px; border-radius:50%; box-shadow:none; font-size:10px;" title="Has Penalties">❗</button>` : '';

        let actionButtons = isFinished ? `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Locked</span>` : `
            <button onclick="openPenaltyModal(${pIndexReal})" class="secondary icon-btn" style="padding:10px; box-shadow:none;" title="Add Penalty">⚖️</button>
            <button onclick="openFishModal(${pIndexReal})" class="icon-btn primary-dark" style="padding:10px 16px;">${addRemoveText}</button>
        `;

        let editBtn = isFinished ? '' : `<button onclick="editParticipantName(${pIndexReal})" class="icon-btn" style="padding:4px; background:transparent; color:var(--text-muted); box-shadow:none;">✏️</button>`;

        filteredHtml += `
        <div class="card" style="padding:16px; margin-bottom:16px;">
            <div class="flex flex-between" style="align-items:center;">
                <div class="flex" style="gap: 8px;">
                    <b style="font-size:16px;">${pIndexReal + 1}. ${p.name}</b> ${penBadge} ${editBtn}
                </div>
                <div class="flex">${actionButtons}</div>
            </div>
            <div style="margin-top:16px; font-size:14px; color:var(--text-muted); line-height: 1.5;">${catchesText}</div>
        </div>`;
    });

    container.innerHTML = filteredHtml || `<div style="text-align:center; padding:20px; color:var(--text-muted);">No matching participants found.</div>`;
    renderLeaderboard();
}

function renderLeaderboard(isPublicView = false, overrideEvent = null) {
    let ev = overrideEvent || currentEvent;
    if(!ev) return;

    let mode = isPublicView ? 'points' : document.getElementById("rankingMode").value;
    let container = document.getElementById(isPublicView ? "pubLeaderboard" : "leaderboardContainer");
    let topSummaryContainer = document.getElementById(isPublicView ? "pubTopSummary" : "leaderboardTopSummary"); 
    
    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');

    let processed = ev.participants.map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; let maxFishAbbr = "";
        let countedCatches = p.catches;
        
        if(ev.limitType === 'top5') {
            countedCatches = [...p.catches].sort((a,b) => b.size - a.size).slice(0,5);
        }

        countedCatches.forEach(c => {
            totalMeasure += c.size;
            if (c.size > maxFishMeasure) { maxFishMeasure = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species, ev.measureType);
        });
        
        let penPts = 0;
        if(p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;

        return { name: p.name, totalMeasure, totalPts, maxFishMeasure, maxFishAbbr, amountCatches: countedCatches.length, penPts, hasPenalty: penPts > 0 };
    });

    let sortedByMain = [...processed].sort((a, b) => mode === 'points' ? b.totalPts - a.totalPts : b.totalMeasure - a.totalMeasure);
    let sortedByBiggest = [...processed].sort((a, b) => b.maxFishMeasure - a.maxFishMeasure);

    if (!isPublicView && topSummaryContainer) {
        if (sortedByBiggest.length > 0 && sortedByBiggest[0].maxFishMeasure > 0) {
            topSummaryContainer.innerHTML = `
                <div class="flex flex-between">
                    <div>
                        <div style="font-size:12px; color:#b45309; font-weight:700; text-transform:uppercase;">🏆 ${t('biggest_fish')}</div>
                        <div style="font-weight:700; font-size:18px; color:var(--text); margin-top:4px;">${sortedByBiggest[0].name}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:20px; font-weight:800; color:var(--text);">${sortedByBiggest[0].maxFishMeasure}</span> ${unitText}
                        <div class="badge" style="background:#fef08a; color:#b45309; margin-left:4px; box-shadow:none;">${sortedByBiggest[0].maxFishAbbr}</div>
                    </div>
                </div>`;
            topSummaryContainer.classList.remove('hidden');
        } else { topSummaryContainer.classList.add('hidden'); }
    }

    let html = `<table><tr><th style="width:40px;">#</th><th>${t('name')}</th><th>${t('points')}</th><th>${t('total_cm').toUpperCase()}</th><th>Amt</th><th>Max</th></tr>`;
    sortedByMain.forEach((p, idx) => {
        let placeBadge = (idx === 0) ? "🥇" : (idx === 1) ? "🥈" : (idx === 2) ? "🥉" : `${idx + 1}`;
        let maxDisplay = p.maxFishMeasure > 0 ? `${p.maxFishMeasure}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${p.maxFishAbbr}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;" title="-${p.penPts} pts">❗</span>` : '';
        html += `<tr>
            <td style="font-weight:bold; text-align:center;">${placeBadge}</td>
            <td style="font-weight:600; white-space:nowrap;">${p.name}${penMarker}</td>
            <td style="color:var(--primary); font-weight:700;">${p.totalPts.toFixed(1)}</td>
            <td>${p.totalMeasure.toFixed(1)}</td>
            <td>${p.amountCatches}</td>
            <td>${maxDisplay}</td>
        </tr>`;
    });
    html += `</table>`;
    container.innerHTML = html;
}

function saveCurrentEvent(redirect = true) {
    if (!currentEvent.date) currentEvent.date = new Date().toLocaleDateString();
    if (!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();
    if (!currentEvent.status) currentEvent.status = "ongoing";

    const eventPayload = { username: loggedInUser, name: currentEvent.name, details: currentEvent, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    localStorage.setItem("lureboard_defaults_" + loggedInUser, JSON.stringify(currentEvent.species));

    db.collection("events").doc(currentEvent.id).set(eventPayload).then(() => { if(redirect) showDashboard(); })
    .catch(err => { console.error("Save error:", err); alert("Failed to save event to cloud."); });
}

function openPublicEvent(eventId) {
    let evData = allPublicEvents.find(e => e.id === eventId);
    if(!evData) return;
    let ev = evData.details;

    document.getElementById("pubTitle").innerText = evData.name;
    document.getElementById("pubHost").innerText = `Hosted by ${evData.username} | ${ev.date}`;
    
    if(ev.thumbnail) {
        document.getElementById("pubThumb").src = ev.thumbnail;
        document.getElementById("pubThumb").classList.remove("hidden");
    } else {
        document.getElementById("pubThumb").classList.add("hidden");
    }

    document.getElementById("pubDesc").innerText = ev.description || "No description provided.";
    
    let limitTxt = ev.limitType === 'top5' ? "Top 5 Counted" : "All Fish Counted";
    let measureTxt = ev.measureType === 'weight' ? "Weighted" : "Size/Points";
    let rulesHtml = `<div style="margin-bottom:12px;"><b>Format:</b> ${measureTxt} | ${limitTxt}</div>`;
    
    rulesHtml += ev.species.map(s => {
        let trs = s.tiers.map(t => `${t.from}-${t.to} (${parseFloat(t.multiplier||1).toFixed(1)}x)`).join(', ');
        return `<div><b>${s.name} (${s.abbr.toUpperCase()}):</b> ${trs}</div>`;
    }).join('');
    document.getElementById("pubRules").innerHTML = rulesHtml;

    renderLeaderboard(true, ev);

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');
    document.getElementById("pubParticipantsDetail").innerHTML = ev.participants.map((p, i) => {
        let catches = p.catches.length > 0 ? p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') : 'None';
        let pens = (p.penalties && p.penalties.length>0) ? `<br><span style="color:var(--danger);">Penalties: -${p.penalties.reduce((sum,pn)=>sum+parseFloat(pn.points),0)} pts</span>` : '';
        return `<div style="padding:8px 0; border-bottom:1px solid var(--border);"><b>${i+1}. ${p.name}</b><br><span style="color:var(--text-muted);">${catches}</span>${pens}</div>`;
    }).join('');

    document.getElementById("publicEventModal").classList.remove("hidden");
}

function closePublicEventModal() { document.getElementById("publicEventModal").classList.add("hidden"); }

function downloadChart(eventId = null) {
    let ev = currentEvent;
    if (eventId) { let found = loadedEvents.find(e => e.id === eventId); if (found) ev = found.details; }
    if (!ev || ev.participants.length === 0) { alert("No data to download."); return; }

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');

    let processed = ev.participants.map(p => {
        let totalM = 0, totalPts = 0, maxFishM = 0, maxFishAbbr = "";
        let countedCatches = ev.limitType === 'top5' ? [...p.catches].sort((a,b)=>b.size-a.size).slice(0,5) : p.catches;
        
        countedCatches.forEach(c => {
            totalM += c.size;
            if (c.size > maxFishM) { maxFishM = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species, ev.measureType);
        });
        
        let penPts = 0; let penStr = "";
        if(p.penalties && p.penalties.length > 0) {
            p.penalties.forEach(pn => penPts += parseFloat(pn.points));
            penStr = ` (Penalty: -${penPts})`;
        }
        totalPts -= penPts;

        let allCatchesStr = p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') || "-";
        return { name: p.name, totalM, totalPts, maxFishM, maxFishAbbr, amountCatches: countedCatches.length, allCatchesStr, penStr };
    });

    processed.sort((a, b) => {
        if(b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
        return b.maxFishM - a.maxFishM; 
    });

    let htmlContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; width: 1000px; margin: 0 auto; background: white;">
            <h2 style="margin-bottom: 8px; color: #4f46e5; font-size:28px;">${t('tournament_results')}: ${ev.name}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">${t('generated_on')}: ${new Date().toLocaleDateString()} | Format: ${ev.limitType==='top5'?'Top 5 Counted':'All Fish'}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <thead><tr style="background-color: #4f46e5; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('place')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('name')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('points')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Total ${unitText.toUpperCase()}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Amt</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('biggest_fish')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5; width: 35%;">${t('details')}</th>
                </tr></thead><tbody>
                    ${processed.map((p, i) => `
                        <tr style="${i % 2 === 0 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${i + 1}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${p.name}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; color: #4f46e5; font-weight: bold;">${p.totalPts.toFixed(1)}${p.penStr ? `<br><span style="color:#e11d48; font-size:11px;">${p.penStr}</span>` : ''}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.totalM.toFixed(1)}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.amountCatches}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.maxFishM > 0 ? `${p.maxFishM}${unitText} ${p.maxFishAbbr}` : '-'}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; color: #475569; font-size: 13px; line-height: 1.4;">${p.allCatchesStr}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    let opt = {
        margin: 0.3, filename: `${ev.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.pdf`,
        image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    let tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlContent;
    html2pdf().set(opt).from(tempDiv).save();
}

function downloadSeasonChart() {
    let dashMode = "standard"; 

    let rankedFinishedEvents = loadedEvents.filter(e => {
        let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
        let status = e.details.status || 'finished';
        let mode = e.details.mode || 'standard';
        return eYear === String(selectedYear) && e.details.isRanked !== false && status === 'finished' && mode === dashMode;
    });

    if (rankedFinishedEvents.length === 0) {
        alert("No finished ranked tournaments found for this season.");
        return;
    }

    let yearlyAgg = {};
    rankedFinishedEvents.forEach(ev => {
        let placements = getEventPlacements(ev.details);
        Object.keys(placements).forEach(normName => {
            if(!yearlyAgg[normName]) {
                let originalName = ev.details.participants.find(p => p.name.toLowerCase().trim() === normName)?.name || normName;
                yearlyAgg[normName] = { name: originalName, scores: [] };
            }
            yearlyAgg[normName].scores.push(placements[normName]);
        });
    });

    let aotyArray = Object.values(yearlyAgg).map(angler => {
        let sortedScores = [...angler.scores].sort((a, b) => a - b);
        let best5 = sortedScores.slice(0, 5); 
        let totalRankPts = best5.reduce((sum, val) => sum + val, 0);
        return {
            name: angler.name,
            validEventsCount: angler.scores.length,
            totalRankPts: totalRankPts,
            allScoresStr: sortedScores.join(', ')
        };
    }).filter(a => a.validEventsCount > 0);

    aotyArray.sort((a, b) => {
        let aEvents = Math.min(a.validEventsCount, 5);
        let bEvents = Math.min(b.validEventsCount, 5);
        if(aEvents !== bEvents) return bEvents - aEvents; 
        return a.totalRankPts - b.totalRankPts; 
    });

    let htmlContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; width: 800px; margin: 0 auto; background: white;">
            <h2 style="margin-bottom: 8px; color: #4f46e5; font-size:28px;">${t('season_results')} ${selectedYear}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">${t('generated_on')}: ${new Date().toLocaleDateString()}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <thead><tr style="background-color: #4f46e5; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('place')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('name')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('rank_pts_best5')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('tournaments_played')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('all_placements')}</th>
                </tr></thead>
                <tbody>${aotyArray.map((p, index) => `
                    <tr style="${index % 2 === 0 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${index + 1}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${p.name}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; color: #4f46e5; font-weight: bold;">${p.totalRankPts}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.validEventsCount}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; color: #475569; font-size: 13px;">${p.allScoresStr}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    let opt = { margin: 0.3, filename: `season_${selectedYear}_results.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    let tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlContent; html2pdf().set(opt).from(tempDiv).save();
}

// INITIALIZATION
changeLanguage(document.getElementById("langSelect").value);

// Default load to Public Hub
document.getElementById("loginSection").classList.add("hidden");
document.getElementById("dashboardSection").classList.remove("hidden");
document.getElementById("dashTabs").classList.add("hidden");
document.getElementById("myEventsView").classList.add("hidden");
document.getElementById("publicHubView").classList.remove("hidden");

history.replaceState({view: 'dashboardSection'}, "");
subscribeToEventsRealtime();
