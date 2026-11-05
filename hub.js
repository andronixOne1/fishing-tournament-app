// =========================================================================
// FIREBASE FIRESTORE CONFIGURATION
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAN16rU1v-7dOvgOAZuxbqHjbuwBeF7k6k",
    authDomain: "lureboard-hub.firebaseapp.com",
    projectId: "lureboard-hub",
    storageBucket: "lureboard-hub.firebasestorage.app",
    messagingSenderId: "565191004647",
    appId: "1:565191004647:web:74cb548055e0695053ad42"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
try {
    db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
} catch (e) {}

// Dedicated Hub collections so Hub NEVER mixes with regular Lureboard events
const EVENTS_COL = "hub_events";
const USERS_COL = "hub_users";

const FREE_ANGLER_CAP = 15;
let unsubscribeEventsListener = null;

let currentEvent = null;
let loggedInUser = "";     
let loggedInUserData = null; 
let loadedEvents = [];     
let allPublicEvents = [];  

let activeFishParticipantIndex = null;
let activePenaltyParticipantIndex = null;
let activeSpeciesIndex = null;
let selectedModalSpecies = "";
let pendingSmallFish = null;
let tempCatchPhotoBase64 = "";
let tempCatchExifTime = null;
let tempSponsorLogoBase64 = "";

let currentLang = "en";
let selectedYear = new Date().getFullYear().toString();

let confUnit = 'metric';
let confMeasure = 'size';
let confLimit = 'all';
let confEventType = 'standard';
let confScheduleMode = 'manual';
let activeHubTab = 'part';

let currentParticipationEventId = null;
let isLeaderboardExpanded = false;
let regRoleSelect = 'participant';
let tempProfileAvatarBase64 = "";
let initialDeepLinkHandled = false;
let initialEventsLoaded = false;

// Minimal SVGs
const svgTrophy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M4 9h3"/><path d="M17 9h3"/></svg>`;
const svgCircle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
const svgUsers = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgFish = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/></svg>`;
const svgCal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const svgDownload = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const svgEdit = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const svgWarning = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const svgCamera = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;

const translations = { en: {}, ka: { login_btn: "შესვლა" } };

// XSS Security Sanitizer
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

// Auto-Save UI Handler
function showSaveStatus(text, bg) {
    let el = document.getElementById("globalSaveBadge");
    if (!el) return;
    el.innerText = text;
    el.style.background = bg;
    el.style.display = "inline-block";
    if (bg === "#10b981" || bg === "#ef4444" || bg === "#f43f5e") {
        setTimeout(() => { el.style.display = "none"; }, 2200);
    }
}

// =========================================================================
// HEADER AVATAR DROPDOWN & AUTOMATIC CLOCK SCHEDULER
// =========================================================================
function toggleUserDropdown(e) {
    if (e) e.stopPropagation();
    let menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.toggle("hidden");
}

function closeUserDropdown() {
    let menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.add("hidden");
}

window.addEventListener("click", () => {
    closeUserDropdown();
});

function setScheduleMode(mode) {
    confScheduleMode = mode;
    document.getElementById("schedBtnManual").className = mode === 'manual' ? 'primary' : 'secondary';
    document.getElementById("schedBtnAuto").className = mode === 'auto' ? 'primary' : 'secondary';
    let details = document.getElementById("autoScheduleDetails");
    if (details) details.classList.toggle("hidden", mode !== 'auto');
}

function toggleSponsorPrizeSection(checked) {
    let wrap = document.getElementById("sponsorPrizeDetailsWrap");
    if (wrap) wrap.classList.toggle("hidden", !checked);
}

function autoBalancePayoutSplits(changedSlot) {
    let p1 = Math.max(0, Math.min(100, parseFloat(document.getElementById("payoutPct1").value) || 0));
    let p2 = Math.max(0, Math.min(100, parseFloat(document.getElementById("payoutPct2").value) || 0));
    let p3 = Math.max(0, Math.min(100, parseFloat(document.getElementById("payoutPct3").value) || 0));

    if (changedSlot === 1) {
        let rem = Math.max(0, 100 - p1);
        p2 = Math.round(rem * 0.6);
        p3 = rem - p2;
    } else if (changedSlot === 2) {
        if (p1 + p2 > 100) p2 = 100 - p1;
        p3 = Math.max(0, 100 - p1 - p2);
    } else if (changedSlot === 3) {
        if (p1 + p3 > 100) p3 = 100 - p1;
        p2 = Math.max(0, 100 - p1 - p3);
    }

    document.getElementById("payoutPct1").value = p1;
    document.getElementById("payoutPct2").value = p2;
    document.getElementById("payoutPct3").value = p3;
}

// Evaluates if an event with Automatic Schedule needs to transition状态
function checkEventScheduleTransition(dataObj) {
    let evDet = dataObj.details;
    if (!evDet || evDet.scheduleMode !== 'auto') return false;

    let now = Date.now();
    let startMs = evDet.autoStartTime ? new Date(evDet.autoStartTime).getTime() : null;
    let endMs = evDet.autoEndTime ? new Date(evDet.autoEndTime).getTime() : null;
    let oldStatus = evDet.status || 'announced';
    let newStatus = oldStatus;

    if (endMs && !isNaN(endMs) && now >= endMs) {
        newStatus = 'finished';
        if (!evDet.finishedAt) evDet.finishedAt = endMs;
    } else if (startMs && !isNaN(startMs) && now >= startMs) {
        if (oldStatus === 'announced') newStatus = 'ongoing';
    }

    if (newStatus !== oldStatus) {
        evDet.status = newStatus;
        if (loggedInUser && dataObj.username === loggedInUser) {
            db.collection(EVENTS_COL).doc(dataObj.id).set({ ...dataObj, details: evDet }).catch(e => console.warn(e));
        }
        return true;
    }
    return false;
}

// Background 15-second heartbeat for Automatic Schedule transitions
setInterval(() => {
    let changed = false;
    allPublicEvents.forEach(ev => {
        if (checkEventScheduleTransition(ev)) changed = true;
    });
    if (changed) {
        if (!document.getElementById("dashboardSection").classList.contains("hidden")) renderPublicHub();
        if (!document.getElementById("myEventsSection").classList.contains("hidden")) processDashboard();
        if (currentEvent && !document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
        if (currentParticipationEventId && !document.getElementById("publicEventSection").classList.contains("hidden")) openPublicEvent(currentParticipationEventId, false);
    }
}, 15000);

// =========================================================================
// FICTIONAL CREDITS, EVENT PASS & PRO SAAS ENGINE
// =========================================================================
function isUserPro() {
    return loggedInUserData && loggedInUserData.plan === 'pro';
}

function isEventUnlocked(evObj) {
    if (!evObj) return isUserPro();
    return isUserPro() || evObj.isUnlocked === true;
}

function openUpgradeModal(reasonText = "") {
    if (!loggedInUser) { openLogin(); return; }
    let reasonEl = document.getElementById("upgradeModalReason");
    if (reasonEl) {
        reasonEl.innerText = reasonText || "Unlock unlimited anglers, sponsor slots, and Pro Club tools.";
    }
    let balEl = document.getElementById("modalCreditsBalance");
    if (balEl) balEl.innerText = (loggedInUserData && loggedInUserData.credits !== undefined) ? loggedInUserData.credits : 0;

    let passBtn = document.getElementById("btnBuyEventPass");
    if (passBtn) {
        if (!currentEvent) {
            passBtn.disabled = true;
            passBtn.innerText = "Open an Event in Setup/Hub to Unlock Single Pass";
        } else if (isEventUnlocked(currentEvent)) {
            passBtn.disabled = true;
            passBtn.innerText = "✓ Current Event Already Unlocked";
        } else {
            passBtn.disabled = false;
            passBtn.innerText = `Unlock "${currentEvent.name}" (25 CR)`;
        }
    }

    let proBtn = document.getElementById("btnBuyProSaaS");
    if (proBtn) {
        if (isUserPro()) {
            proBtn.disabled = true;
            proBtn.innerText = "✓ PRO Club Plan Active";
        } else {
            proBtn.disabled = false;
            proBtn.innerText = "Upgrade Account to PRO (100 CR)";
        }
    }

    document.getElementById("upgradeModal").classList.remove("hidden");
}

function closeUpgradeModal() {
    document.getElementById("upgradeModal").classList.add("hidden");
}

async function simulateTopUpCredits(amount) {
    if (!loggedInUser || !loggedInUserData) return;
    let newCredits = (Number(loggedInUserData.credits) || 0) + amount;
    showSaveStatus("Topping Up...", "#f59e0b");
    try {
        await db.collection(USERS_COL).doc(loggedInUser).update({ credits: newCredits });
        loggedInUserData.credits = newCredits;
        localStorage.setItem("lureboard_hub_session_data", JSON.stringify(loggedInUserData));
        updateUIAfterAuth();
        openUpgradeModal();
        showSaveStatus(`+${amount} CR Added!`, "#10b981");
    } catch (e) {
        console.error(e);
        showSaveStatus("✕ Error", "#ef4444");
    }
}

async function purchaseSingleEventPass() {
    if (!loggedInUser || !loggedInUserData || !currentEvent) return;
    let bal = Number(loggedInUserData.credits) || 0;
    if (bal < 25) {
        alert("Not enough credits! Click '+100 Free CR' at the top of the store to top up your fictional wallet.");
        return;
    }
    let newCredits = bal - 25;
    showSaveStatus("Unlocking...", "#f59e0b");
    try {
        await db.collection(USERS_COL).doc(loggedInUser).update({ credits: newCredits });
        loggedInUserData.credits = newCredits;
        localStorage.setItem("lureboard_hub_session_data", JSON.stringify(loggedInUserData));
        currentEvent.isUnlocked = true;
        await saveCurrentEvent(false);
        updateUIAfterAuth();
        updateParticipantCountStatus();
        if (!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
        closeUpgradeModal();
        alert(`🎉 Event Pass Activated! "${currentEvent.name}" now supports unlimited anglers, sponsor banners, and prize pool payouts.`);
    } catch (e) {
        console.error(e);
    }
}

async function purchaseProSubscription() {
    if (!loggedInUser || !loggedInUserData) return;
    let bal = Number(loggedInUserData.credits) || 0;
    if (bal < 100) {
        alert("Not enough credits! Click '+100 Free CR' at the top of the store to top up your fictional wallet.");
        return;
    }
    let newCredits = bal - 100;
    showSaveStatus("Upgrading to PRO...", "#f59e0b");
    try {
        await db.collection(USERS_COL).doc(loggedInUser).update({ credits: newCredits, plan: 'pro' });
        loggedInUserData.credits = newCredits;
        loggedInUserData.plan = 'pro';
        localStorage.setItem("lureboard_hub_session_data", JSON.stringify(loggedInUserData));
        if (currentEvent) currentEvent.isUnlocked = true;
        updateUIAfterAuth();
        updateParticipantCountStatus();
        if (!document.getElementById("myEventsSection").classList.contains("hidden")) processDashboard();
        if (!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
        closeUpgradeModal();
        alert("🏆 Welcome to Lureboard PRO Club! All tournaments now have unlimited angler capacity, Season-Long AOTY Standings, Sponsor Slots, and Automated Payouts.");
    } catch (e) {
        console.error(e);
    }
}

// =========================================================================
// AUTOMATED PAYOUT CALCULATOR & SPONSOR BANNERS
// =========================================================================
function calculatePayoutBreakdown(ev) {
    if (!ev || ev.enableSponsorPrize === false) {
        return { hasPayouts: false, pCount: 0, totalPot: 0, clubKeep: 0, first: 0, second: 0, third: 0, bigFish: 0, pct1: 50, pct2: 30, pct3: 20 };
    }
    let pCount = (ev.participants || []).length;
    let entryFee = parseFloat(ev.entryFee) || 0;
    let clubCutPct = parseFloat(ev.clubCutPct) || 0;
    let bigFishFee = parseFloat(ev.bigFishFee) || 0;

    let pct1 = ev.payoutPct1 !== undefined ? parseFloat(ev.payoutPct1) : 50;
    let pct2 = ev.payoutPct2 !== undefined ? parseFloat(ev.payoutPct2) : 30;
    let pct3 = ev.payoutPct3 !== undefined ? parseFloat(ev.payoutPct3) : 20;

    let grossEntry = pCount * entryFee;
    let clubKeep = grossEntry * (clubCutPct / 100);
    let netTournamentPot = Math.max(0, grossEntry - clubKeep);
    let bigFishPot = pCount * bigFishFee;
    let totalPot = netTournamentPot + bigFishPot;

    return {
        hasPayouts: entryFee > 0 || bigFishFee > 0,
        pCount,
        totalPot,
        clubKeep,
        pct1, pct2, pct3,
        first: netTournamentPot * (pct1 / 100),
        second: netTournamentPot * (pct2 / 100),
        third: netTournamentPot * (pct3 / 100),
        bigFish: bigFishPot
    };
}

function renderPayoutWidget(ev, cardId, badgeId, gridId) {
    let card = document.getElementById(cardId);
    let badge = document.getElementById(badgeId);
    let grid = document.getElementById(gridId);
    if (!card || !badge || !grid || !ev) return;

    let pay = calculatePayoutBreakdown(ev);
    if (!pay.hasPayouts) {
        card.classList.add("hidden");
        return;
    }

    card.classList.remove("hidden");
    badge.innerText = `$${pay.totalPot.toFixed(0)} Total Pool (${pay.pCount} Anglers)`;
    grid.innerHTML = `
        <div class="payout-box"><div style="font-size:10px; color:var(--text-muted); font-weight:700;">1ST (${pay.pct1}%)</div><div style="font-size:15px; font-weight:800; color:var(--text-main);">$${pay.first.toFixed(0)}</div></div>
        <div class="payout-box"><div style="font-size:10px; color:var(--text-muted); font-weight:700;">2ND (${pay.pct2}%)</div><div style="font-size:15px; font-weight:800; color:var(--text-main);">$${pay.second.toFixed(0)}</div></div>
        <div class="payout-box"><div style="font-size:10px; color:var(--text-muted); font-weight:700;">3RD (${pay.pct3}%)</div><div style="font-size:15px; font-weight:800; color:var(--text-main);">$${pay.third.toFixed(0)}</div></div>
        <div class="payout-box"><div style="font-size:10px; color:#b45309; font-weight:700;">BIG FISH</div><div style="font-size:15px; font-weight:800; color:#b45309;">$${pay.bigFish.toFixed(0)}</div></div>
    `;
}

// Returns normalized array of { name, logo } sponsors for an event (supports multiple sponsors + legacy single sponsor)
function getEventSponsors(ev) {
    if (!ev || !ev.enableSponsorPrize) return [];
    if (Array.isArray(ev.sponsors) && ev.sponsors.length > 0) {
        return ev.sponsors.filter(s => s && (s.name || s.logo));
    }
    if (ev.sponsorName || ev.sponsorLogo) {
        return [{ name: ev.sponsorName || "", logo: ev.sponsorLogo || "" }];
    }
    return [];
}

// =========================================================================
// ZERO-FRICTION QR CODE & DEEP-LINK ONBOARDING
// =========================================================================
function getActiveEventShareUrl() {
    let evId = currentParticipationEventId || (currentEvent && currentEvent.id);
    let baseUrl = window.location.origin + window.location.pathname;
    return evId ? `${baseUrl}?event=${evId}` : baseUrl;
}

function openQrModal() {
    let ev = currentEvent || allPublicEvents.find(e => e.id === currentParticipationEventId)?.details;
    let url = getActiveEventShareUrl();
    document.getElementById("qrModalTitle").innerText = ev ? `Join: ${ev.name}` : "Scan to Join";
    let qrBox = document.getElementById("qrCodeContainer");
    qrBox.innerHTML = "";
    if (window.QRCode) {
        new QRCode(qrBox, { text: url, width: 200, height: 200 });
    } else {
        qrBox.innerText = url;
    }
    document.getElementById("qrModal").classList.remove("hidden");
}

function closeQrModal() {
    document.getElementById("qrModal").classList.add("hidden");
}

function copyEventInviteLink() {
    let url = getActiveEventShareUrl();
    navigator.clipboard.writeText(url).then(() => {
        showSaveStatus("✓ Link Copied!", "#10b981");
        closeQrModal();
    }).catch(() => {
        prompt("Copy this tournament link:", url);
    });
}

// =========================================================================
// BROADCAST TV MODE & 1-TAP SOCIAL MEDIA PODIUM GRAPHIC
// =========================================================================
function getActiveBroadcastEvent() {
    if (!document.getElementById("publicEventSection").classList.contains("hidden") && currentParticipationEventId) {
        return allPublicEvents.find(e => e.id === currentParticipationEventId)?.details;
    }
    return currentEvent;
}

function openTvBroadcastMode() {
    let ev = getActiveBroadcastEvent();
    if (!ev) return;
    document.getElementById("tvBroadcastModal").classList.remove("hidden");
    renderTvBroadcastView(ev);
}

function closeTvBroadcastMode() {
    document.getElementById("tvBroadcastModal").classList.add("hidden");
}

function renderTvBroadcastView(ev) {
    if (!ev || document.getElementById("tvBroadcastModal").classList.contains("hidden")) return;
    document.getElementById("tvEventTitle").innerText = ev.name || "Live Weigh-In";

    let codePill = document.getElementById("tvSecretCodePill");
    if (ev.eventType === 'cpr' && ev.status !== 'announced' && ev.secretCode) {
        codePill.innerText = `CPR CODE: ${ev.secretCode}`;
        codePill.classList.remove("hidden");
    } else {
        codePill.classList.add("hidden");
    }

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');
    let processed = (ev.participants || []).map(p => {
        let totalMeasure = 0, totalPts = 0, maxFishMeasure = 0, maxFishAbbr = "";
        let validCatches = (p.catches || []).filter(c => c.size > 0);
        let countedCatches = ev.limitType === 'top5' ? [...validCatches].sort((a,b) => b.size - a.size).slice(0,5) : validCatches;
        countedCatches.forEach(c => {
            totalMeasure += c.size;
            if (c.size > maxFishMeasure) { maxFishMeasure = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species, ev.measureType);
        });
        let penPts = 0;
        if (p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;
        return { name: p.name, totalMeasure, totalPts, maxFishMeasure, maxFishAbbr, amountCatches: countedCatches.length };
    });

    processed.sort((a, b) => b.totalPts - a.totalPts);
    let biggest = [...processed].sort((a, b) => b.maxFishMeasure - a.maxFishMeasure)[0];

    let tableHtml = `<thead><tr><th style="width:70px;">Rank</th><th>Angler</th><th>Points</th><th>Total ${unitText.toUpperCase()}</th><th>Fish</th><th>Biggest</th></tr></thead><tbody>`;
    processed.slice(0, 12).forEach((p, i) => {
        let medal = i === 0 ? "🥇 1st" : i === 1 ? "🥈 2nd" : i === 2 ? "🥉 3rd" : `#${i + 1}`;
        tableHtml += `<tr>
            <td>${medal}</td>
            <td>${escapeHTML(p.name)}</td>
            <td style="color:#38bdf8;">${p.totalPts.toFixed(1)}</td>
            <td>${p.totalMeasure.toFixed(1)}</td>
            <td>${p.amountCatches}</td>
            <td>${p.maxFishMeasure > 0 ? `${p.maxFishMeasure}${unitText} ${escapeHTML(p.maxFishAbbr)}` : '-'}</td>
        </tr>`;
    });
    tableHtml += `</tbody>`;
    document.getElementById("tvLeaderboardTable").innerHTML = tableHtml;

    let bigBox = document.getElementById("tvBigFishBox");
    if (biggest && biggest.maxFishMeasure > 0) {
        bigBox.innerHTML = `
            <div style="font-size:13px; color:#fbbf24; font-weight:800; text-transform:uppercase; letter-spacing:1px;">🏆 BIGGEST CATCH LEADER</div>
            <div style="font-size:28px; font-weight:900; margin-top:8px;">${escapeHTML(biggest.name)}</div>
            <div style="font-size:36px; font-weight:900; color:#fbbf24; margin-top:4px;">${biggest.maxFishMeasure} ${unitText} <span style="font-size:18px; color:#94a3b8;">(${escapeHTML(biggest.maxFishAbbr)})</span></div>
        `;
    } else {
        bigBox.innerHTML = `<div style="color:#64748b; font-weight:700;">Waiting for first official catch...</div>`;
    }

    let pay = calculatePayoutBreakdown(ev);
    let payBox = document.getElementById("tvPayoutBox");
    if (pay.hasPayouts) {
        payBox.classList.remove("hidden");
        payBox.innerHTML = `
            <div style="font-size:13px; color:#38bdf8; font-weight:800; text-transform:uppercase; letter-spacing:1px;">💰 LIVE PRIZE PURSE ($${pay.totalPot.toFixed(0)})</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; font-size:18px; font-weight:800;">
                <div>🥇 1st (${pay.pct1}%): $${pay.first.toFixed(0)}</div>
                <div>🥈 2nd (${pay.pct2}%): $${pay.second.toFixed(0)}</div>
                <div>🥉 3rd (${pay.pct3}%): $${pay.third.toFixed(0)}</div>
                <div style="color:#fbbf24;">🐟 Big: $${pay.bigFish.toFixed(0)}</div>
            </div>
        `;
    } else {
        payBox.classList.add("hidden");
    }

    let spBox = document.getElementById("tvSponsorBox");
    let tvSponsors = getEventSponsors(ev);
    if (tvSponsors.length > 0) {
        spBox.classList.remove("hidden");
        spBox.innerHTML = `
            <div style="font-size:11px; color:#94a3b8; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">${tvSponsors.length > 1 ? 'OFFICIAL TOURNAMENT SPONSORS' : 'OFFICIAL TOURNAMENT SPONSOR'}</div>
            <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center; align-items:center;">
                ${tvSponsors.map(sp => `
                    <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; align-items:center; min-width:140px; flex:1;">
                        ${sp.logo ? `<img src="${sp.logo}" style="max-height:64px; max-width:100%; object-fit:contain; margin-bottom:8px; background:#fff; padding:6px; border-radius:6px;">` : ''}
                        ${sp.name ? `<div style="font-size:17px; font-weight:800; color:#fff;">${escapeHTML(sp.name)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        spBox.classList.add("hidden");
    }
}

async function generateSocialCard() {
    let ev = getActiveBroadcastEvent();
    if (!ev || !ev.participants || ev.participants.length === 0) {
        alert("Add at least one participant to generate a Social Podium Card.");
        return;
    }

    showSaveStatus("Rendering Card...", "#f59e0b");
    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');

    let processed = (ev.participants || []).map(p => {
        let totalMeasure = 0, totalPts = 0, maxFishMeasure = 0, maxFishAbbr = "";
        let validCatches = (p.catches || []).filter(c => c.size > 0);
        let countedCatches = ev.limitType === 'top5' ? [...validCatches].sort((a,b) => b.size - a.size).slice(0,5) : validCatches;
        countedCatches.forEach(c => {
            totalMeasure += c.size;
            if (c.size > maxFishMeasure) { maxFishMeasure = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species, ev.measureType);
        });
        let penPts = 0;
        if (p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;
        return { name: p.name, totalMeasure, totalPts, maxFishMeasure, maxFishAbbr, amountCatches: countedCatches.length };
    });

    processed.sort((a, b) => b.totalPts - a.totalPts);
    let biggest = [...processed].sort((a, b) => b.maxFishMeasure - a.maxFishMeasure)[0];
    let top3 = processed.slice(0, 3);
    let cardSponsors = getEventSponsors(ev);
    let cardSponsorNames = cardSponsors.map(s => s.name).filter(Boolean);

    let cardWrap = document.createElement("div");
    cardWrap.style.cssText = "position:fixed; left:-9999px; top:0; width:600px; padding:44px; background:#090d16; color:#ffffff; font-family:'Inter',sans-serif; border-radius:24px;";
    cardWrap.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px;">
            <div style="font-weight:900; font-size:22px; letter-spacing:-0.5px; color:#38bdf8;">🎣 LUREBOARD OFFICIAL STANDINGS</div>
            <div style="font-size:13px; color:#94a3b8; font-weight:600;">${escapeHTML(ev.date || '')}</div>
        </div>
        <h1 style="font-size:36px; font-weight:900; margin:0 0 28px 0; line-height:1.15; color:#ffffff;">${escapeHTML(ev.name)}</h1>
        ${top3.map((p, i) => `
            <div style="background:${i === 0 ? '#1e293b' : '#111827'}; border:2px solid ${i === 0 ? '#fbbf24' : '#334155'}; padding:20px 24px; border-radius:18px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:13px; font-weight:800; color:${i === 0 ? '#fbbf24' : '#94a3b8'}; text-transform:uppercase;">${i === 0 ? '🥇 1ST PLACE CHAMPION' : i === 1 ? '🥈 2ND PLACE' : '🥉 3RD PLACE'}</div>
                    <div style="font-size:24px; font-weight:900; margin-top:4px; color:#ffffff;">${escapeHTML(p.name)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:26px; font-weight:900; color:#38bdf8;">${p.totalPts.toFixed(1)} <span style="font-size:14px;">PTS</span></div>
                    <div style="font-size:13px; color:#cbd5e1;">${p.amountCatches} Fish • ${p.totalMeasure.toFixed(1)}${unitText}</div>
                </div>
            </div>
        `).join('')}
        ${biggest && biggest.maxFishMeasure > 0 ? `
            <div style="background:#064e3b; border:2px solid #10b981; padding:18px 24px; border-radius:16px; margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:12px; font-weight:800; color:#6ee7b7; text-transform:uppercase;">🏆 BIGGEST CATCH OF THE TOURNAMENT</div>
                    <div style="font-size:20px; font-weight:800; margin-top:2px; color:#ffffff;">${escapeHTML(biggest.name)}</div>
                </div>
                <div style="font-size:26px; font-weight:900; color:#6ee7b7;">${biggest.maxFishMeasure}${unitText} ${escapeHTML(biggest.maxFishAbbr)}</div>
            </div>
        ` : ''}
        ${cardSponsorNames.length > 0 ? `<div style="margin-top:28px; text-align:center; padding-top:18px; border-top:1px solid #334155; font-size:13px; color:#94a3b8;">Sponsored by <b style="color:#fff;">${cardSponsorNames.map(n => escapeHTML(n)).join(' • ')}</b> • lureboard.com</div>` : `<div style="margin-top:28px; text-align:center; font-size:12px; color:#64748b; font-weight:700;">lureboard.com</div>`}
    `;
    document.body.appendChild(cardWrap);

    try {
        if (typeof html2canvas === "function") {
            let canvas = await html2canvas(cardWrap, { scale: 2, useCORS: true, backgroundColor: "#090d16" });
            let link = document.createElement("a");
            link.download = `${(ev.name || 'podium').replace(/[^a-z0-9]/gi, '_')}_social_card.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            showSaveStatus("✓ Card Downloaded!", "#10b981");
        } else {
            throw new Error("html2canvas script not loaded. Hard refresh (Ctrl+F5) your browser.");
        }
    } catch (e) {
        console.error("Social Card Error:", e);
        showSaveStatus("✕ Error", "#ef4444");
        alert("Could not render Social Card: " + e.message);
    } finally {
        if (cardWrap.parentNode) document.body.removeChild(cardWrap);
    }
}

function changeLanguage(lang) {
    currentLang = lang;
    let s1 = document.getElementById("langSelect");
    let s2 = document.getElementById("guestLangSelect");
    if (s1) s1.value = lang;
    if (s2) s2.value = lang;

    if(!document.getElementById("setupSection").classList.contains("hidden")) refreshSetupUI();
    if(!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
    if(!document.getElementById("rulesModal").classList.contains("hidden") && activeSpeciesIndex !== null) renderRules();
    if(!document.getElementById("fishModal").classList.contains("hidden") && activeFishParticipantIndex !== null) renderModalCatches();
    
    let myEventsView = document.getElementById("myEventsSection");
    if(myEventsView && !myEventsView.classList.contains("hidden")) processDashboard();
    
    let historyView = document.getElementById("historyView");
    if(historyView && !historyView.classList.contains("hidden")) renderHistoryTab();
    
    if(!document.getElementById("publicEventSection").classList.contains("hidden")) renderPublicLeaderboardList(allPublicEvents.find(e => e.id === currentParticipationEventId)?.details);
    if(!document.getElementById("dashboardSection").classList.contains("hidden")) renderPublicHub();
}

function getMyName() { return (loggedInUserData && loggedInUserData.fullName) ? loggedInUserData.fullName : loggedInUser; }

function handleOverlayClick(e, modalId) {
    if (e.target.id === modalId) {
        if (modalId === 'participantModal') closeAddParticipantModal();
        if (modalId === 'fishModal') closeFishModal();
        if (modalId === 'penaltyModal') closePenaltyModal();
        if (modalId === 'rulesModal') closeRulesModal();
        if (modalId === 'smallFishWarningModal') cancelSmallFish();
        if (modalId === 'photoPreviewModal') closePhotoPreview();
        if (modalId === 'upgradeModal') closeUpgradeModal();
        if (modalId === 'qrModal') closeQrModal();
    }
}

function parseParticipants(rawText) {
    if (!rawText.trim()) return [];
    let cleaned = rawText.replace(/\([\s\S]*?\)|\[[\s\S]*?\]|\{[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/[0-9!@#$%^&*_+=\-\[\]{};':"\\|.<>\/?~`“”„«»]/g, ' ');
    return cleaned.split(/[\n,]+/).map(n => n.replace(/\s+/g, ' ').trim()).filter(n => n.length > 0);
}

// SAFE ROUTING ENGINE
function hideAllSections() {
    ["loginSection", "registerSection", "dashboardSection", "profileSection", "myEventsSection", "participateSection", "setupSection", "hubSection", "publicEventSection"].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

window.addEventListener("popstate", (event) => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    let params = new URLSearchParams(window.location.search);
    let urlEventId = params.get("event");
    let view = (event.state && event.state.view) ? event.state.view : (urlEventId ? "publicEventSection" : "dashboardSection");
    let evId = (event.state && event.state.eventId) ? event.state.eventId : urlEventId;

    if (view === "publicEventSection" && evId && allPublicEvents.some(e => e.id === evId)) {
        openPublicEvent(evId, false);
        return;
    }

    hideAllSections();
    let target = document.getElementById(view);
    if (target) target.classList.remove("hidden");
    if (view === "dashboardSection") {
        currentParticipationEventId = null;
        try {
            sessionStorage.setItem("lureboard_hub_active_view", "dashboardSection");
            sessionStorage.removeItem("lureboard_hub_active_event");
        } catch (e) {}
        renderPublicHub();
    } else if (view === "myEventsSection") {
        try {
            sessionStorage.setItem("lureboard_hub_active_view", "myEventsSection");
            sessionStorage.removeItem("lureboard_hub_active_event");
        } catch (e) {}
        processDashboard();
    }
    window.scrollTo(0, 0);
});

function showPublicHub(pushHistory = true) {
    currentParticipationEventId = null;
    try {
        sessionStorage.setItem("lureboard_hub_active_view", "dashboardSection");
        sessionStorage.removeItem("lureboard_hub_active_event");
    } catch (e) {}
    hideAllSections();
    let dbSec = document.getElementById("dashboardSection");
    if(dbSec) dbSec.classList.remove("hidden");
    if (pushHistory) {
        history.pushState({view: 'dashboardSection'}, "", window.location.pathname);
    }
    renderPublicHub();
}

function showMyEvents() {
    currentParticipationEventId = null;
    try {
        sessionStorage.setItem("lureboard_hub_active_view", "myEventsSection");
        sessionStorage.removeItem("lureboard_hub_active_event");
    } catch (e) {}
    hideAllSections();
    let myEv = document.getElementById("myEventsSection");
    if(myEv) myEv.classList.remove("hidden");
    history.pushState({view: 'myEventsSection'}, "", window.location.pathname);
    processDashboard();
}

function showProfilePage() {
    if (!loggedInUser || !loggedInUserData) { openLogin(); return; }
    hideAllSections();
    let profSec = document.getElementById("profileSection");
    if(profSec) profSec.classList.remove("hidden");

    if (loggedInUserData && loggedInUserData.role === 'participant') {
        document.getElementById("tabHistory").classList.remove("hidden");
    } else {
        document.getElementById("tabHistory").classList.add("hidden");
    }

    document.getElementById("profUsername").value = loggedInUser;
    document.getElementById("profFullName").value = loggedInUserData.fullName || "";
    document.getElementById("profDob").value = loggedInUserData.dob || "";
    document.getElementById("profPassword").value = "";
    document.getElementById("profileAvatarPreview").src = loggedInUserData.avatar || "https://via.placeholder.com/100";
    tempProfileAvatarBase64 = "";

    switchProfileTab('profile');
    history.pushState({view: 'profileSection'}, "");
}

function switchProfileTab(tab) {
    document.getElementById("tabProfile").classList.remove("active");
    document.getElementById("tabHistory").classList.remove("active");
    document.getElementById("profileView").classList.add("hidden");
    document.getElementById("historyView").classList.add("hidden");

    if (tab === 'history') {
        document.getElementById("tabHistory").classList.add("active");
        document.getElementById("historyView").classList.remove("hidden");
        renderHistoryTab();
    } else {
        document.getElementById("tabProfile").classList.add("active");
        document.getElementById("profileView").classList.remove("hidden");
    }
}

// PROFILE AVATAR & SETTINGS LOGIC
function handleProfileAvatarUpload(e) {
    let file = e.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let maxW = 300; 
            let scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            tempProfileAvatarBase64 = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById('profileAvatarPreview').src = tempProfileAvatarBase64;
        }
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    if (!loggedInUser) return;
    let newName = document.getElementById("profFullName").value.trim();
    let newDob = document.getElementById("profDob").value;
    let newPass = document.getElementById("profPassword").value.trim();
    
    let updateData = { fullName: newName, dob: newDob };
    if (newPass) updateData.password = newPass;
    if (tempProfileAvatarBase64) updateData.avatar = tempProfileAvatarBase64;

    showSaveStatus("Saving...", "#f59e0b");
    try {
        await db.collection(USERS_COL).doc(loggedInUser).update(updateData);
        loggedInUserData = { ...loggedInUserData, ...updateData };
        localStorage.setItem("lureboard_hub_session_data", JSON.stringify(loggedInUserData));
        updateUIAfterAuth();
        document.getElementById("profPassword").value = "";
        showSaveStatus("✓ Saved", "#10b981");
        alert("Profile saved successfully!");
    } catch (err) {
        console.error("Error updating profile: ", err);
        showSaveStatus("✕ Error", "#ef4444");
        alert("Failed to save profile: " + err.message);
    }
}

// =========================================================================
// HUB USERNAME + PASSWORD + ROLE AUTHENTICATION
// =========================================================================
function toggleAuth(view) {
    hideAllSections();
    if(view === 'register') {
        document.getElementById("registerSection").classList.remove("hidden");
    } else {
        document.getElementById("loginSection").classList.remove("hidden");
    }
}

function setRegRole(role) {
    regRoleSelect = role;
    document.getElementById("tabRolePart").classList.remove("active");
    document.getElementById("tabRoleOrg").classList.remove("active");
    if(role === 'participant') document.getElementById("tabRolePart").classList.add("active");
    else document.getElementById("tabRoleOrg").classList.add("active");
}

function handleRegister() {
    let user = document.getElementById("regUsername").value.trim().toLowerCase();
    let pass = document.getElementById("regPassword").value.trim();
    let fName = document.getElementById("regFullName").value.trim();
    let dob = document.getElementById("regDob").value;

    if (!user || !pass || !fName || !dob) { alert("Please fill all fields."); return; }

    showSaveStatus("Registering...", "#f59e0b");
    const userRef = db.collection(USERS_COL).doc(user);
    userRef.get().then(doc => {
        if (doc.exists) {
            showSaveStatus("✕ Taken", "#ef4444");
            alert("Username already taken.");
        } else {
            let data = { 
                password: pass, 
                fullName: fName, 
                dob: dob, 
                role: regRoleSelect, 
                credits: 50,
                plan: 'free',
                createdAt: new Date() 
            };
            userRef.set(data).then(() => {
                showSaveStatus("✓ Welcome (+50 CR)", "#10b981");
                loginSuccess(user, data);
            });
        }
    }).catch(err => {
        console.error(err);
        showSaveStatus("✕ Error", "#ef4444");
        alert("Registration Error: " + err.message);
    });
}

function handleLogin() {
    let user = document.getElementById("loginUsername").value.trim().toLowerCase();
    let pass = document.getElementById("loginPassword").value.trim();
    if (!user || !pass) { alert("Please enter both username and password."); return; }

    showSaveStatus("Signing In...", "#f59e0b");
    const userRef = db.collection(USERS_COL).doc(user);
    userRef.get().then(doc => {
        if (doc.exists && doc.data().password === pass) {
            let uData = doc.data();
            if (uData.credits === undefined) uData.credits = 50;
            if (!uData.plan) uData.plan = 'free';
            showSaveStatus("✓ Signed In", "#10b981");
            loginSuccess(user, uData);
        } else {
            showSaveStatus("✕ Invalid", "#ef4444");
            alert("Incorrect username or password.");
        }
    }).catch(err => {
        console.error(err);
        showSaveStatus("✕ Error", "#ef4444");
        alert("Login Error: " + err.message);
    });
}

function loginSuccess(user, data) {
    loggedInUser = user;
    loggedInUserData = data;
    
    localStorage.setItem("lureboard_hub_session_user", user);
    localStorage.setItem("lureboard_hub_session_data", JSON.stringify(data));
    
    updateUIAfterAuth();
    showPublicHub();
    subscribeToEventsRealtime();
}

function handleLogout() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    loggedInUser = "";
    loggedInUserData = null;
    
    localStorage.removeItem("lureboard_hub_session_user");
    localStorage.removeItem("lureboard_hub_session_data");
    
    updateUIAfterAuth();
    showPublicHub();
    subscribeToEventsRealtime(); 
}

function openLogin() {
    hideAllSections();
    document.getElementById("loginSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'loginSection'}, "");
}

function updateUIAfterAuth() {
    let btnLogin = document.getElementById("headerLoginBtn");
    let guestLang = document.getElementById("guestLangSelect");
    let userWrap = document.getElementById("headerUserWrap");
    let avatarEl = document.getElementById("headerAvatar");

    let dropName = document.getElementById("dropdownUserName");
    let dropRole = document.getElementById("dropdownRoleBadge");
    let dropPlan = document.getElementById("dropdownPlanBadge");
    let dropMyEv = document.getElementById("dropdownMyEventsBtn");
    let dropWallet = document.getElementById("dropdownWalletBtn");
    let dropCredits = document.getElementById("dropdownCreditsAmount");

    if (loggedInUser && loggedInUserData) {
        if (btnLogin) btnLogin.classList.add("hidden");
        if (guestLang) guestLang.classList.add("hidden");
        if (userWrap) userWrap.classList.remove("hidden");
        if (avatarEl) {
            avatarEl.src = loggedInUserData.avatar || "https://via.placeholder.com/40";
        }
        if (dropName) dropName.innerText = loggedInUserData.fullName || loggedInUser;

        let isOrg = (loggedInUserData.role === 'organization' || !loggedInUserData.role);
        if (dropRole) {
            dropRole.innerText = isOrg ? "ORGANIZER" : "ANGLER";
            dropRole.className = isOrg ? "badge warning" : "badge success";
        }
        if (dropPlan) {
            dropPlan.classList.toggle("hidden", !isOrg);
            dropPlan.innerText = isUserPro() ? "PRO CLUB" : "FREE TIER";
            dropPlan.className = isUserPro() ? "badge pro" : "badge neutral";
        }
        if (dropMyEv) dropMyEv.classList.toggle("hidden", !isOrg);
        if (dropWallet) {
            dropWallet.classList.toggle("hidden", !isOrg);
            if (dropCredits) dropCredits.innerText = `${loggedInUserData.credits !== undefined ? loggedInUserData.credits : 50} CR`;
        }
    } else {
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (guestLang) guestLang.classList.remove("hidden");
        if (userWrap) userWrap.classList.add("hidden");
    }
}

// EVENTS SUBSCRIPTION, DEEP-LINKING & AUTOMATIC CLEANUP
function cachePublicEventsToSession(eventsArr) {
    try {
        sessionStorage.setItem("lureboard_hub_events_cache", JSON.stringify(eventsArr));
    } catch (e) {
        try {
            let light = eventsArr.map(ev => {
                let d = { ...(ev.details || {}) };
                if (d.participants) {
                    d.participants = d.participants.map(p => ({
                        ...p,
                        catches: (p.catches || []).map(c => {
                            let copy = { ...c };
                            delete copy.photo;
                            return copy;
                        })
                    }));
                }
                return { ...ev, details: d };
            });
            sessionStorage.setItem("lureboard_hub_events_cache", JSON.stringify(light));
        } catch (err) {}
    }
}

function handleEventsSnapshot(snapshot) {
    loadedEvents = [];
    allPublicEvents = [];
    
    snapshot.forEach(doc => { 
        let data = { id: doc.id, ...doc.data() };
        if (!data.details) data.details = {};
        data.details.id = doc.id; 
        
        // Check automatic clock transitions
        checkEventScheduleTransition(data);

        let isMyEvent = loggedInUser && data.username === loggedInUser;

        // AUTOMATIC 7-DAY PHOTO CLEANUP FOR FINISHED EVENTS
        let evDet = data.details;
        if (evDet.status === 'finished' && evDet.finishedAt) {
            let daysSince = (Date.now() - evDet.finishedAt) / (1000 * 3600 * 24);
            if (daysSince > 7) {
                let changed = false;
                (evDet.participants || []).forEach(p => {
                    (p.catches || []).forEach(c => {
                        if (c.photo) { delete c.photo; changed = true; }
                    });
                });
                if (changed && isMyEvent) {
                    db.collection(EVENTS_COL).doc(data.id).set({ ...data, details: evDet });
                }
            }
        }

        if (isMyEvent) {
            loadedEvents.push(data);
        }
        
        let isPub = data.details.isPublic;
        if (isPub === true || String(isPub) === "true" || isPub === undefined) {
            allPublicEvents.push(data);
        }
    });

    initialEventsLoaded = true;
    cachePublicEventsToSession(allPublicEvents);

    // Always keep Public Hub list rendered in the DOM so navigating Back is never empty
    renderPublicHub();

    // Handle QR / Direct URL Deep Link (?event=ev_12345) or restored session event on initial load
    if (!initialDeepLinkHandled && allPublicEvents.length > 0) {
        let params = new URLSearchParams(window.location.search);
        let savedView = "";
        let savedEv = "";
        try {
            savedView = sessionStorage.getItem("lureboard_hub_active_view") || "";
            savedEv = sessionStorage.getItem("lureboard_hub_active_event") || "";
        } catch (e) {}
        let targetEv = params.get("event") || (savedView === "publicEventSection" ? savedEv : "");
        initialDeepLinkHandled = true;
        if (targetEv && allPublicEvents.some(e => e.id === targetEv)) {
            openPublicEvent(targetEv, false);
        }
    }
    
    let myEvSec = document.getElementById("myEventsSection");
    if (loggedInUser && myEvSec && !myEvSec.classList.contains("hidden")) {
        processDashboard();
    }
    
    let histSec = document.getElementById("historyView");
    if (loggedInUser && histSec && !histSec.classList.contains("hidden")) {
        renderHistoryTab();
    }

    let hubSection = document.getElementById("hubSection");
    if (currentEvent && hubSection && !hubSection.classList.contains("hidden")) {
        let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id) || allPublicEvents.find(e => e.id === currentEvent.id);
        if (activeUpdated) {
            currentEvent = activeUpdated.details;
            currentEvent.id = activeUpdated.id; 
            renderHubUI();
        }
    }

    let setupSection = document.getElementById("setupSection");
    if (currentEvent && setupSection && !setupSection.classList.contains("hidden")) {
        let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id) || allPublicEvents.find(e => e.id === currentEvent.id);
        if (activeUpdated) {
            // Keep live self-registered participants synced in memory even while organizer is on Setup page
            currentEvent.participants = activeUpdated.details.participants || currentEvent.participants;
        }
    }

    let pubSection = document.getElementById("publicEventSection");
    if (currentParticipationEventId && pubSection && !pubSection.classList.contains("hidden")) {
        let activeUpdated = allPublicEvents.find(e => e.id === currentParticipationEventId);
        if (activeUpdated) {
            activeUpdated.details.id = activeUpdated.id;
            renderPublicLeaderboardList(activeUpdated.details);
            renderPayoutWidget(activeUpdated.details, "pubPayoutCard", "pubTotalPotBadge", "pubPayoutGrid");
            if (activeUpdated.details.eventType === 'cpr') renderPublicGallery(activeUpdated.details);
        }
    }

    // Live Auto-Refresh TV Broadcast Mode if open
    let tvEv = getActiveBroadcastEvent();
    if (tvEv && !document.getElementById("tvBroadcastModal").classList.contains("hidden")) {
        renderTvBroadcastView(tvEv);
    }
}

function subscribeToEventsRealtime() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();

    // Fast one-time fetch fallback for mobile browsers where WebChannel streaming may lag on refresh
    db.collection(EVENTS_COL).get().then(snapshot => {
        if (!initialEventsLoaded || allPublicEvents.length === 0) {
            handleEventsSnapshot(snapshot);
        }
    }).catch(err => console.warn("Initial fetch fallback warning:", err));
    
    unsubscribeEventsListener = db.collection(EVENTS_COL).onSnapshot(snapshot => {
        handleEventsSnapshot(snapshot);
    }, error => {
        console.error("Firebase Read Error: ", error);
        initialEventsLoaded = true;
        renderPublicHub();
    });
}

function getEvTime(ev) { return parseInt(ev.id.replace('ev_', '')) || 0; }

function sortEventsArray(eventsArr, sortMode) {
    return eventsArr.sort((a, b) => {
        if (sortMode === 'newest') return getEvTime(b) - getEvTime(a);
        if (sortMode === 'oldest') return getEvTime(a) - getEvTime(b);
        if (sortMode === 'az') return a.name.localeCompare(b.name);
    });
}

// ---------------------------------------------------------
// PUBLIC EVENT VIEWER LOGIC 
// ---------------------------------------------------------

function openPublicEvent(eventId, pushHistory = true) {
    let evData = allPublicEvents.find(e => e.id === eventId);
    if(!evData) return;
    let ev = evData.details;
    ev.id = evData.id; 
    currentParticipationEventId = eventId;
    try {
        sessionStorage.setItem("lureboard_hub_active_view", "publicEventSection");
        sessionStorage.setItem("lureboard_hub_active_event", eventId);
    } catch (e) {}

    document.getElementById("pubTitle").innerText = evData.name;
    document.getElementById("pubEvTypeBadge").innerText = ev.eventType === 'cpr' ? "CPR" : "STD";
    if (ev.eventType === 'cpr') document.getElementById("pubEvTypeBadge").className = "badge warning";
    else document.getElementById("pubEvTypeBadge").className = "badge neutral";

    // Sponsor Banner (Supports Single & Multiple Sponsors)
    let spBanner = document.getElementById("pubSponsorBanner");
    let pubSponsors = getEventSponsors(ev);
    if (pubSponsors.length > 0) {
        spBanner.classList.remove("hidden");
        let lbl = document.getElementById("pubSponsorHeaderLabel");
        if (lbl) lbl.innerText = pubSponsors.length > 1 ? "Official Event Sponsors" : "Official Event Sponsor";
        let listEl = document.getElementById("pubSponsorsList");
        if (listEl) {
            listEl.innerHTML = pubSponsors.map(sp => `
                <div class="sponsor-item-chip">
                    <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${escapeHTML(sp.name || "Official Partner")}</div>
                    ${sp.logo ? `<img src="${sp.logo}" alt="${escapeHTML(sp.name || 'Sponsor')}">` : ''}
                </div>
            `).join('');
        }
    } else {
        spBanner.classList.add("hidden");
    }

    // Payout Widget
    renderPayoutWidget(ev, "pubPayoutCard", "pubTotalPotBadge", "pubPayoutGrid");

    let st = ev.status || 'finished';
    let codeBanner = document.getElementById("pubSecretCodeBanner");
    if (ev.eventType === 'cpr' && st !== 'announced' && ev.secretCode) {
        document.getElementById("pubSecretCodeDisplay").innerText = ev.secretCode;
        codeBanner.classList.remove("hidden");
    } else {
        codeBanner.classList.add("hidden");
    }

    let schedInfo = ev.date || '';
    if (ev.scheduleMode === 'auto' && ev.autoStartTime) {
        let sStr = ev.autoStartTime.replace('T', ' ');
        let eStr = ev.autoEndTime ? ev.autoEndTime.replace('T', ' ') : '';
        schedInfo = `⏰ ${sStr}${eStr ? ' ➔ ' + eStr : ''}`;
    }
    document.getElementById("pubHost").innerText = schedInfo;
    document.getElementById("pubHostName").innerText = ev.hostFullName || evData.username;
    document.getElementById("pubHostAvatar").src = ev.hostAvatar || "https://via.placeholder.com/40";
    
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
    
    rulesHtml += (ev.species||[]).map(s => {
        let trs = s.tiers.map(t => `${t.from}-${t.to} (${parseFloat(t.multiplier||1).toFixed(1)}x)`).join(', ');
        return `<div><b style="color:var(--text-main);">${escapeHTML(s.name)} (${escapeHTML(s.abbr.toUpperCase())}):</b> ${trs}</div>`;
    }).join('');
    document.getElementById("pubRules").innerHTML = rulesHtml;

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');
    document.getElementById("pubParticipantsDetail").innerHTML = (ev.participants||[]).map((p, i) => {
        let catches = (p.catches||[]).length > 0 ? p.catches.map((c, cIdx) => {
            let isPending = !c.size || c.size <= 0;
            let sizeDisp = !isPending ? c.size + unitText : '⏳ Pending';
            let badgeClass = isPending ? 'warning' : 'neutral';
            if (c.photo) {
                return `<span class="badge ${badgeClass}" style="font-weight:700; display:inline-flex; align-items:center; gap:6px; padding:4px 10px 4px 5px; margin:2px 4px 2px 0; cursor:pointer; border:1px solid var(--border);" onclick="openPhotoPreviewByUrl('${c.photo}')" title="View Catch Photo"><img src="${c.photo}" style="width:22px; height:22px; border-radius:4px; object-fit:cover; border:1px solid rgba(0,0,0,0.15);"> ${sizeDisp} ${escapeHTML(c.abbr.toUpperCase())} <span style="font-size:12px;">📷</span></span>`;
            }
            return `<span class="badge ${badgeClass}" style="font-weight:600; display:inline-flex; align-items:center; margin:2px 4px 2px 0;">${sizeDisp} ${escapeHTML(c.abbr.toUpperCase())}</span>`;
        }).join(' ') : 'None';
        let pens = (p.penalties && p.penalties.length>0) ? `<br><span style="color:var(--danger); font-size:12px; font-weight:600;">Penalties: -${p.penalties.reduce((sum,pn)=>sum+parseFloat(pn.points),0)} pts</span>` : '';
        return `<div style="padding:12px 0; border-bottom:1px solid var(--border);"><b>${i+1}. ${escapeHTML(p.name)}</b><div style="margin-top:6px; color:var(--text-muted); display:flex; flex-wrap:wrap; align-items:center;">${catches}</div>${pens}</div>`;
    }).join('');

    isLeaderboardExpanded = false;
    
    let partBtn = document.getElementById("pubParticipateBtn");
    let uploadBtn = document.getElementById("pubUploadCatchBtn");
    let actionBar = document.getElementById("pubActionBar");
    let myName = getMyName();
    let isAlreadyJoined = loggedInUser && myName && (ev.participants||[]).some(p => p.name.toLowerCase() === myName.toLowerCase());

    let showActionbar = false;

    if (st === 'announced') {
        document.getElementById("pubRulesCard").classList.remove("hidden");
        document.getElementById("pubPartCard").classList.remove("hidden");
        
        if (loggedInUserData && loggedInUserData.role === 'participant') {
            partBtn.classList.remove("hidden");
            showActionbar = true;
            if (isAlreadyJoined) { partBtn.innerHTML = `Leave Event`; partBtn.className = "danger"; } 
            else { partBtn.innerHTML = `Join Event`; partBtn.className = "success"; }
        } else { partBtn.classList.add("hidden"); }
        uploadBtn.classList.add("hidden");
    } else if (st === 'ongoing') {
        partBtn.classList.add("hidden");
        if (isAlreadyJoined && loggedInUserData && loggedInUserData.role === 'participant') {
            uploadBtn.classList.remove("hidden");
            showActionbar = true;
        } else { uploadBtn.classList.add("hidden"); }
        renderPublicLeaderboardList(ev);
    } else { 
        partBtn.classList.add("hidden");
        uploadBtn.classList.add("hidden");
        renderPublicLeaderboardList(ev);
    }

    if (showActionbar) {
        actionBar.classList.remove("hidden");
    } else {
        actionBar.classList.add("hidden");
    }

    if (ev.eventType === 'cpr') { document.getElementById("tabPubGallery").classList.remove("hidden"); renderPublicGallery(ev); } 
    else { document.getElementById("tabPubGallery").classList.add("hidden"); }

    switchPubTab('lb');
    
    hideAllSections();
    document.getElementById("publicEventSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    let targetUrl = "?event=" + encodeURIComponent(eventId);
    if (pushHistory) {
        history.pushState({view: 'publicEventSection', eventId: eventId}, "", targetUrl);
    } else {
        history.replaceState({view: 'publicEventSection', eventId: eventId}, "", targetUrl);
    }
}

function switchPubTab(tab) {
    document.getElementById("tabPubLb").classList.remove("active");
    document.getElementById("tabPubRules").classList.remove("active");
    document.getElementById("tabPubGallery").classList.remove("active");
    
    document.getElementById("pubLeaderboardWrapSection").classList.add("hidden");
    document.getElementById("pubRulesWrapSection").classList.add("hidden");
    document.getElementById("pubGalleryWrapSection").classList.add("hidden");

    if (tab === 'rules') {
        document.getElementById("tabPubRules").classList.add("active");
        document.getElementById("pubRulesWrapSection").classList.remove("hidden");
    } else if (tab === 'gallery') {
        document.getElementById("tabPubGallery").classList.add("active");
        document.getElementById("pubGalleryWrapSection").classList.remove("hidden");
    } else {
        document.getElementById("tabPubLb").classList.add("active");
        document.getElementById("pubLeaderboardWrapSection").classList.remove("hidden");
        let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
        if(evData) renderPublicLeaderboardList(evData.details);
    }
}

function renderPublicGallery(ev) {
    let container = document.getElementById("pubGalleryContainer");
    let html = "";
    (ev.participants||[]).forEach(p => {
        (p.catches||[]).forEach(c => {
            if(c.photo) {
                html += `<div class="gallery-item">
                    <img src="${c.photo}" style="cursor:pointer;" onclick="openPhotoPreviewByUrl('${c.photo}')">
                    <div class="gallery-meta">${escapeHTML(p.name)}<br><span style="color:var(--text-muted); font-size:11px;">${c.size > 0 ? c.size : 'Pending'} ${escapeHTML(c.abbr.toUpperCase())}</span></div>
                </div>`;
            }
        });
    });
    if(!html) html = `<div style="grid-column: span 2; text-align:center; padding:20px; color:var(--text-muted);">No photos uploaded yet.</div>`;
    container.innerHTML = html;
}

function closePublicEventModal() { 
    document.getElementById("publicEventSection").classList.add("hidden"); 
    currentParticipationEventId = null;
}

function toggleFullLeaderboard() {
    isLeaderboardExpanded = !isLeaderboardExpanded;
    document.getElementById("btnToggleLeaderboard").innerText = isLeaderboardExpanded ? "Hide Full Leaderboard" : "Show Full Leaderboard";
    let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
    if(evData) renderPublicLeaderboardList(evData.details);
}

function renderPublicLeaderboardList(ev) {
    if(!ev) return;
    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');

    let processed = (ev.participants||[]).map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; let maxFishAbbr = "";
        let validCatches = (p.catches||[]).filter(c => c.size > 0);
        let countedCatches = ev.limitType === 'top5' ? [...validCatches].sort((a,b) => b.size - a.size).slice(0,5) : validCatches;

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

    processed.sort((a, b) => b.totalPts - a.totalPts); 

    let toShow = isLeaderboardExpanded ? processed : processed.slice(0, 3);

    let html = `<table><tr><th style="width:40px;">#</th><th>Name</th><th>Pts</th><th>Max</th></tr>`;
    toShow.forEach((p, idx) => {
        let placeBadge = (idx === 0) ? "1st" : (idx === 1) ? "2nd" : (idx === 2) ? "3rd" : `${idx + 1}`;
        let maxDisplay = p.maxFishMeasure > 0 ? `${p.maxFishMeasure}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${escapeHTML(p.maxFishAbbr)}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;" title="-${p.penPts} pts">${svgWarning}</span>` : '';
        html += `<tr>
            <td style="font-weight:bold; text-align:center;">${placeBadge}</td>
            <td style="font-weight:600; white-space:nowrap;">${escapeHTML(p.name)}${penMarker}</td>
            <td style="color:var(--primary); font-weight:700;">${p.totalPts.toFixed(1)}</td>
            <td>${maxDisplay}</td>
        </tr>`;
    });
    html += `</table>`;
    
    document.getElementById("pubLeaderboard").innerHTML = html;
    let toggleBtn = document.getElementById("btnToggleLeaderboard");
    if(toggleBtn) toggleBtn.style.display = processed.length > 3 ? "inline-block" : "none";
}

async function joinEventDirectly() {
    let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
    let ev = evData.details;
    if(!ev.participants) ev.participants = [];
    
    let myName = getMyName();
    let isAlreadyJoined = ev.participants.some(p => p.name.toLowerCase() === myName.toLowerCase());
    
    if (isAlreadyJoined) {
        if(confirm("Are you sure you want to leave this event?")) {
            ev.participants = ev.participants.filter(p => p.name.toLowerCase() !== myName.toLowerCase());
            
            let safeDetails;
            try { safeDetails = JSON.parse(JSON.stringify(ev)); } catch(e) { return; }
            showSaveStatus("Updating...", "#f59e0b");
            try {
                await db.collection(EVENTS_COL).doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
                showSaveStatus("✓ Saved", "#10b981");
                alert("You have left the event.");
                openPublicEvent(currentParticipationEventId, false);
            } catch(e) {
                showSaveStatus("✕ Error", "#ef4444");
            }
        }
    } else {
        if (!ev.isUnlocked && ev.participants.length >= FREE_ANGLER_CAP) {
            alert(`This tournament has reached the 15-Angler Free Tier limit. Please ask the tournament organizer to unlock the Event Pass (25 CR) or Pro Plan.`);
            return;
        }
        let feeMsg = (ev.enableSponsorPrize && parseFloat(ev.entryFee) > 0) ? `Join this tournament? (Entry Fee: $${ev.entryFee})` : "Join this tournament?";
        if (!confirm(feeMsg)) return;

        ev.participants.push({
            id: 'p_' + Math.random().toString(36).substr(2, 9),
            name: myName, catches: [], penalties: [], registeredBy: loggedInUser, selfRegistered: true
        });
        let safeDetails;
        try { safeDetails = JSON.parse(JSON.stringify(ev)); } catch(e) { return; }
        showSaveStatus("Updating...", "#f59e0b");
        try {
            await db.collection(EVENTS_COL).doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
            showSaveStatus("✓ Saved", "#10b981");
            alert("Successfully joined the event!");
            openPublicEvent(currentParticipationEventId, false);
        } catch(e) {
            showSaveStatus("✕ Error", "#ef4444");
        }
    }
}

// Public Hub with Thumbnail Corner Badges
function renderPublicHub() {
    let container = document.getElementById("publicEventsList");
    if (!container) return;
    
    if (allPublicEvents.length === 0) {
        if (!initialEventsLoaded) {
            container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">Loading tournaments...</div>`;
        } else {
            container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No public tournaments right now.</div>`;
        }
        return;
    }

    allPublicEvents.sort((a, b) => b.id.localeCompare(a.id));
    let html = "";
    
    let myName = getMyName() ? getMyName().toLowerCase() : "";

    allPublicEvents.forEach(ev => {
        let pList = ev.details.participants || [];
        let pCount = pList.length;
        let cCount = pList.reduce((sum, p) => sum + (p.catches || []).length, 0);
        
        let status = ev.details.status || 'finished';
        let stBadge = status === 'finished' ? 'neutral' : (status === 'ongoing' ? 'success' : 'warning');

        let hostName = ev.details.hostFullName || ev.username;
        let hostAvatar = ev.details.hostAvatar || "https://via.placeholder.com/40";
        let evTypeBadge = ev.details.eventType === 'cpr' ? `<span class="badge warning">CPR</span>` : `<span class="badge neutral">STD</span>`;

        let isParticipating = loggedInUser && myName && pList.some(p => p.name.toLowerCase() === myName);
        let registeredBadge = isParticipating ? `<span class="badge success">Registered</span>` : '';
        let evSponsors = getEventSponsors(ev.details);
        let sponsorBadge = evSponsors.length > 0
            ? evSponsors.map(sp => `<span class="badge pro">💎 ${escapeHTML(sp.name || 'Sponsor')}</span>`).join('')
            : '';

        let thumbSrc = ev.details.thumbnail || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=60";

        html += `
        <div class="card" style="padding:16px; cursor:pointer; transition: transform 0.2s;" onclick="openPublicEvent('${ev.id}')">
            <div class="thumb-wrap">
                <img src="${thumbSrc}">
                <div class="thumb-corner-tl">
                    ${evTypeBadge}
                    ${registeredBadge}
                </div>
                <div class="thumb-corner-tr">
                    <span class="badge ${stBadge}">${status}</span>
                </div>
                ${sponsorBadge ? `<div class="thumb-corner-br">${sponsorBadge}</div>` : ''}
            </div>
            <div class="flex flex-between" style="align-items:flex-start;">
                <div>
                    <h3 style="margin-bottom:6px; font-size:18px;">${escapeHTML(ev.name)}</h3>
                    <div class="flex" style="font-size:13px; color:var(--text-muted);">
                        <img src="${hostAvatar}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">
                        <b style="font-weight:600;">${escapeHTML(hostName)}</b>
                    </div>
                </div>
            </div>
            <div style="margin-top:14px; font-size:13px; color:var(--text-muted); display:flex; gap:16px;">
                <span class="flex">${svgUsers} ${pCount} Participants</span>
                <span class="flex">${svgFish} ${cCount} Catches</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// Photo Preview Modal & 2.5x Interactive Bump-Board Loupe Zoom
function openPhotoPreview(pIdx, cIdx) {
    let p = currentEvent.participants[pIdx];
    if (!p || !p.catches[cIdx] || !p.catches[cIdx].photo) return;
    openPhotoPreviewByUrl(p.catches[cIdx].photo);
}

function openPhotoPreviewByUrl(url) {
    if (!url) return;
    let wrap = document.getElementById("fullPhotoPreviewWrap");
    if (wrap) wrap.classList.remove("zoomed");
    document.getElementById("fullPhotoPreview").src = url;
    document.getElementById("photoPreviewModal").classList.remove("hidden");
}

function togglePreviewModalZoom() {
    let wrap = document.getElementById("fullPhotoPreviewWrap");
    if (wrap) wrap.classList.toggle("zoomed");
}

function toggleJudgeCardZoom(wrapId) {
    let wrap = document.getElementById(wrapId);
    if (wrap) wrap.classList.toggle("zoomed");
}

function panZoomImage(e, container) {
    if (!container.classList.contains("zoomed")) return;
    let img = container.querySelector("img");
    let rect = container.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
}

function panZoomImageTouch(e, container) {
    if (!container.classList.contains("zoomed") || !e.touches[0]) return;
    let img = container.querySelector("img");
    let rect = container.getBoundingClientRect();
    let x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    let y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
}

function closePhotoPreview() {
    document.getElementById("photoPreviewModal").classList.add("hidden");
    document.getElementById("fullPhotoPreview").src = "";
}

// History Tab for Participants
function renderHistoryTab() {
    let container = document.getElementById("historyListContainer");
    if (!container) return;

    let myName = getMyName().toLowerCase();
    
    let historyEvents = allPublicEvents.filter(e => {
        return (e.details.participants || []).some(p => p.name.toLowerCase() === myName);
    });

    let years = [...new Set(historyEvents.map(e => String(e.details.year || new Date().getFullYear().toString())))];
    years.sort((a,b) => b - a);
    
    let yearSelect = document.getElementById("historyYearSelect");
    if (yearSelect && years.length > 0) {
        if (!yearSelect.value || !years.includes(yearSelect.value)) yearSelect.value = years[0];
        yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    } else {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No participation history found.</div>`;
        return;
    }

    let selectedHYear = yearSelect.value;
    let filteredHistory = historyEvents.filter(e => String(e.details.year || new Date().getFullYear().toString()) === selectedHYear);

    if (filteredHistory.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No participation history in ${selectedHYear}.</div>`;
        return;
    }

    let html = "";
    filteredHistory.forEach(ev => {
        let pData = ev.details.participants.find(p => p.name.toLowerCase() === myName);
        let cCount = pData ? (pData.catches || []).length : 0;
        let status = ev.details.status || 'finished';
        let stBadge = status === 'finished' ? 'neutral' : (status === 'ongoing' ? 'success' : 'primary-light');

        html += `
        <div class="card flex flex-between" style="padding: 16px; cursor: pointer;" onclick="openPublicEvent('${ev.id}')">
            <div>
                <div class="flex" style="margin-bottom:6px;"><b style="font-size:15px;">${escapeHTML(ev.name)}</b> <span class="badge ${stBadge}" style="font-size:10px; padding: 2px 6px;">${status}</span></div>
                <div class="flex" style="font-size:13px; color:var(--text-muted);">
                    <span class="flex">${svgFish} ${cCount} catches logged</span>
                </div>
            </div>
            <button class="secondary icon-btn" style="box-shadow:none;">View</button>
        </div>`;
    });
    container.innerHTML = html;
}

// AOTY Logic
function getEventPlacements(evDetails) {
    let processed = (evDetails.participants || []).map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; 
        let validCatches = (p.catches||[]).filter(c => c.size > 0);
        let countedCatches = evDetails.limitType === 'top5' ? [...validCatches].sort((a,b)=>b.size-a.size).slice(0,5) : validCatches;
        let amountCatches = countedCatches.length;
        
        countedCatches.forEach(c => {
            totalMeasure += c.size;
            if (c.size > maxFishMeasure) maxFishMeasure = c.size;
            totalPts += calculateFishPoints(c.abbr, c.size, evDetails.species || [], evDetails.measureType);
        });
        
        let penPts = 0;
        if(p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;

        return { name: p.name, normName: (p.name || "unknown").toLowerCase().trim(), totalPts, totalMeasure, maxFishMeasure, amountCatches };
    });

    let caught = processed.filter(p => p.amountCatches > 0 && p.totalPts > 0);
    let zero = processed.filter(p => p.amountCatches === 0 || p.totalPts <= 0);

    caught.sort((a, b) => {
        if(b.totalPts !== a.totalPts) return b.totalPts - a.totalPts; 
        if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
        return b.maxFishMeasure - a.maxFishMeasure; 
    });

    let placements = {};
    caught.forEach((p, idx) => { placements[p.normName] = idx + 1; });

    if (zero.length > 0) {
        let M = caught.length;
        let T = processed.length;
        let zeroRank = Math.floor(((M + 1) + T) / 2);
        zero.forEach(p => { placements[p.normName] = zeroRank; });
    }
    return placements;
}

function processDashboard() {
    let years = [...new Set(loadedEvents.map(e => {
        return String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
    }))].filter(y => y && y.length === 4);

    if(years.length === 0) years = [new Date().getFullYear().toString()];
    years.sort((a,b) => b - a);
    if(!years.includes(String(selectedYear))) selectedYear = years[0];

    let yearSelect = document.getElementById("yearSelect");
    if(yearSelect) {
        yearSelect.innerHTML = years.map(y => `<option value="${y}" ${String(y) === String(selectedYear) ? 'selected' : ''}>${y}</option>`).join('');
        document.getElementById("yearFilterContainer").style.display = loadedEvents.length > 0 ? "block" : "none";
    }

    let rankedFinishedEvents = loadedEvents.filter(e => {
        let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
        let status = e.details.status || 'finished'; 
        return eYear === String(selectedYear) && e.details.isRanked !== false && status === 'finished';
    }); 

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
        return { name: angler.name, validEventsCount: angler.scores.length, totalRankPts: totalRankPts };
    }).filter(a => a.validEventsCount > 0);

    aotyArray.sort((a, b) => {
        let aEvents = Math.min(a.validEventsCount, 5);
        let bEvents = Math.min(b.validEventsCount, 5);
        if(aEvents !== bEvents) return bEvents - aEvents; 
        return a.totalRankPts - b.totalRankPts; 
    });

    let aotyContainer = document.getElementById("aotyContainer");
    if(aotyArray.length > 0) {
        if (!isUserPro()) {
            aotyContainer.innerHTML = `
            <div class="aoty-showcase-card">
                <div class="flex flex-between" style="flex-wrap: wrap; gap: 14px;">
                    <div style="flex: 1; min-width: 220px;">
                        <div class="flex" style="gap: 8px; margin-bottom: 8px;">
                            <span class="aoty-medal-pill gold">🏆 SEASON STANDINGS</span>
                            <span class="badge pro" style="font-size: 10px;">PRO CLUB SAAS</span>
                        </div>
                        <h3 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.4px;">Angler of the Year (${selectedYear})</h3>
                        <p style="font-size: 13px; color: #cbd5e1; margin: 6px 0 0 0;">Unlock automated multi-tournament circuit standings, podium tracking & Season PDF exports.</p>
                    </div>
                    <button class="pro-btn icon-btn" onclick="openUpgradeModal('Upgrade to Pro Club SaaS to unlock Season-Long Angler of the Year (AOTY) standings.')" style="white-space: nowrap; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">Unlock AOTY (100 CR)</button>
                </div>
            </div>`;
            aotyContainer.classList.remove("hidden");
        } else {
            let medalConfigs = [
                { label: "🥇 1st", pillClass: "gold", rowClass: "rank-1", scoreColor: "#fbbf24" },
                { label: "🥈 2nd", pillClass: "silver", rowClass: "rank-2", scoreColor: "#e2e8f0" },
                { label: "🥉 3rd", pillClass: "bronze", rowClass: "rank-3", scoreColor: "#fdba74" }
            ];
            let evCountText = `${rankedFinishedEvents.length} Ranked Event${rankedFinishedEvents.length === 1 ? '' : 's'} • Best 5 Finishes Count`;
            let aotyHtml = `<div class="aoty-showcase-card">
                <div class="flex flex-between" style="margin-bottom: 18px; align-items: flex-start;">
                    <div>
                        <div class="flex" style="gap: 8px; margin-bottom: 6px;">
                            <span class="aoty-medal-pill gold">🏆 SEASON CHAMPIONSHIP</span>
                        </div>
                        <h3 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">Angler of the Year (${selectedYear})</h3>
                        <div style="font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 2px;">${evCountText}</div>
                    </div>
                    <button class="secondary icon-btn" onclick="downloadSeasonChart()" title="Download Full Season Standings PDF" style="padding: 8px 12px; width: auto; border: 1px solid rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.14); color: #fde68a; font-size: 12px; font-weight: 700;">
                        ${svgDownload} <span>Season PDF</span>
                    </button>
                </div>`;
            
            aotyArray.slice(0, 3).forEach((angler, idx) => {
                let cfg = medalConfigs[idx] || medalConfigs[2];
                let playedNum = Math.min(angler.validEventsCount, 5);
                aotyHtml += `
                <div class="aoty-row ${cfg.rowClass}">
                    <div class="flex" style="gap: 12px; align-items: center;">
                        <span class="aoty-medal-pill ${cfg.pillClass}">${cfg.label}</span>
                        <div>
                            <div style="font-size: 16px; font-weight: 800; color: #ffffff; line-height: 1.2;">${escapeHTML(angler.name)}</div>
                            <div style="font-size: 11px; color: #cbd5e1; font-weight: 600; margin-top: 2px;">${playedNum} Tournament${playedNum === 1 ? '' : 's'} Counted</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: 900; color: ${cfg.scoreColor}; line-height: 1.1;">${angler.totalRankPts} <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; opacity: 0.85;">pts</span></div>
                        <div style="font-size: 10px; color: #94a3b8; font-weight: 600;">Low Score Wins</div>
                    </div>
                </div>`;
            });
            aotyHtml += `</div>`;
            aotyContainer.innerHTML = aotyHtml;
            aotyContainer.classList.remove("hidden");
        }
    } else {
        aotyContainer.innerHTML = "";
        aotyContainer.classList.add("hidden");
    }

    let filteredEvents = loadedEvents.filter(e => {
        let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
        return eYear === String(selectedYear);
    });
    
    let sortMode = document.getElementById("myEventsSort") ? document.getElementById("myEventsSort").value : "newest";
    let sortedEvents = sortEventsArray([...filteredEvents], sortMode);
    
    renderEventsList(sortedEvents);
}

function changeYear(y) { selectedYear = y; processDashboard(); }

function renderEventsList(filteredEvents) {
    let container = document.getElementById("eventsList");
    if (filteredEvents.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No events found in ${selectedYear}.</div>`;
        return;
    }
    let html = "";
    filteredEvents.forEach(ev => {
        let publishDate = ev.details.date || "Unknown Date";
        let rankIcon = ev.details.isRanked !== false ? svgTrophy : svgCircle;
        let rankBadge = ev.details.isRanked === false ? `<span class="badge danger" style="padding:2px 6px; font-size:10px; margin-left:6px;">Unranked</span>` : '';
        let typeBadge = ev.details.eventType === 'cpr' ? `<span class="badge warning" style="padding:2px 6px; font-size:10px; margin-left:6px;">CPR</span>` : '';
        let passBadge = isEventUnlocked(ev.details) ? `<span class="badge pro" style="padding:2px 6px; font-size:10px; margin-left:6px;">UNLIMITED</span>` : '';
        
        let status = ev.details.status || 'finished';
        let stBadge = status === 'finished' ? 'neutral' : (status === 'ongoing' ? 'success' : 'primary-light');

        html += `<div class="card flex flex-between" style="padding: 16px;">
            <div style="flex:1;">
                <div class="flex flex-wrap" style="font-weight:700; margin-bottom:6px; font-size:15px; color:var(--text-main);">
                    <span style="color:var(--primary);">${rankIcon}</span> 
                    <span>${escapeHTML(ev.name)}</span>
                    <div class="flex" style="gap:4px;">
                        <span class="badge ${stBadge}" style="padding:2px 6px; font-size:10px;">${status}</span>
                        ${rankBadge} ${typeBadge} ${passBadge}
                    </div>
                </div>
                <div class="flex" style="font-size:12px; color:var(--text-muted); font-weight:500;">
                    ${svgCal} ${publishDate} • ${svgUsers} ${(ev.details.participants||[]).length}
                </div>
            </div>
            <div class="flex" style="gap:8px; align-items:center;">
                ${ev.details.eventType === 'cpr' ? `<button onclick="downloadPhotosZip('${ev.id}')" class="secondary icon-btn" title="Download ZIP" style="padding:8px;">${svgCamera}</button>` : ''}
                <button onclick="downloadChart('${ev.id}')" class="secondary icon-btn" style="padding:8px;">${svgDownload}</button>
                <button onclick="editEvent('${ev.id}')" class="primary icon-btn" style="padding:8px;">${svgEdit}</button>
                <button onclick="deleteEvent('${ev.id}')" class="danger icon-btn" style="padding:8px;">${svgTrash}</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// SETUP PHASE & CPR CODE GENERATOR
function editEvent(id) {
    let found = loadedEvents.find(e => e.id === id);
    if (found) {
        found.details.id = found.id;
        openEventEditor(found.details);
    }
}

function deleteEvent(id) {
    if (confirm("Are you sure you want to permanently delete this event?")) {
        db.collection(EVENTS_COL).doc(id).delete().catch(err => alert("Failed to delete: " + err.message));
    }
}

function setEventType(t) {
    confEventType = t;
    document.getElementById('typeBtnStd').className = t === 'standard' ? 'primary' : 'secondary';
    document.getElementById('typeBtnCpr').className = t === 'cpr' ? 'primary' : 'secondary';
    
    let codeGroup = document.getElementById('cprCodeSetupGroup');
    if (t === 'cpr') {
        codeGroup.classList.remove('hidden');
        let codeInput = document.getElementById('eventSecretCodeInput');
        if (!codeInput.value) generateRandomCprCode();
    } else {
        codeGroup.classList.add('hidden');
    }
}

function generateRandomCprCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "LB-";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('eventSecretCodeInput').value = code;
}

function setUnit(u) {
    confUnit = u;
    document.getElementById('unitBtnMetric').className = u === 'metric' ? 'primary' : 'secondary';
    document.getElementById('unitBtnImperial').className = u === 'imperial' ? 'primary' : 'secondary';
}
function setMeasure(m) {
    confMeasure = m;
    document.getElementById('measureBtnSize').className = m === 'size' ? 'primary' : 'secondary';
    document.getElementById('measureBtnWeight').className = m === 'weight' ? 'primary' : 'secondary';
}
function setLimit(l) {
    confLimit = l;
    document.getElementById('limitBtnAll').className = l === 'all' ? 'primary' : 'secondary';
    document.getElementById('limitBtnTop5').className = l === 'top5' ? 'primary' : 'secondary';
}

function handleThumbnailUpload(e) {
    let file = e.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let maxW = 800;
            let scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            document.getElementById('thumbnailPreview').src = compressedDataUrl;
            document.getElementById('thumbnailPreview').style.display = 'block';
        }
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleSponsorLogoUpload(e) {
    let file = e.target.files[0];
    if(!file) return;
    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let maxW = 400;
            let scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            tempSponsorLogoBase64 = canvas.toDataURL('image/png', 0.8);
            
            document.getElementById('sponsorLogoPreview').src = tempSponsorLogoBase64;
            document.getElementById('sponsorLogoPreview').style.display = 'block';
        }
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// EXIF Photo Verification & Optimized Compression
function handleCatchPhotoUpload(e) {
    let file = e.target.files[0];
    if(!file) return;

    tempCatchExifTime = null;
    let exifStatusEl = document.getElementById("exifStatusPreview");
    if (exifStatusEl) exifStatusEl.innerHTML = `<span style="color:var(--text-muted);">Scanning photo metadata...</span>`;

    if (window.EXIF) {
        EXIF.getData(file, function() {
            let dateTaken = EXIF.getTag(this, "DateTimeOriginal") || EXIF.getTag(this, "DateTime");
            if (dateTaken) {
                let parts = dateTaken.split(" ");
                let dPart = parts[0].replace(/:/g, "-");
                let tPart = parts[1] ? parts[1].substring(0, 5) : "";
                tempCatchExifTime = `${dPart} ${tPart}`;
                if (exifStatusEl) exifStatusEl.innerHTML = `<span style="color:var(--success);">✓ EXIF Verified: Taken ${tempCatchExifTime}</span>`;
            } else {
                tempCatchExifTime = "No EXIF Date";
                if (exifStatusEl) exifStatusEl.innerHTML = `<span style="color:var(--warning);">⚠️ No camera timestamp found (Screenshot/Edited?)</span>`;
            }
        });
    }

    let reader = new FileReader();
    reader.onload = function(event) {
        let img = new Image();
        img.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let maxW = 650;
            let scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            tempCatchPhotoBase64 = canvas.toDataURL('image/jpeg', 0.6);
            
            document.getElementById('modalFishPhotoPreview').src = tempCatchPhotoBase64;
            document.getElementById('modalFishPhotoPreview').style.display = 'block';
        }
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function openEventEditor(eventObj = null) {
    hideAllSections();
    document.getElementById("setupSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'setupSection'}, "");

    tempSponsorLogoBase64 = "";

    let thumbPrev = document.getElementById('thumbnailPreview');
    let spPrev = document.getElementById('sponsorLogoPreview');

    if (eventObj) {
        currentEvent = JSON.parse(JSON.stringify(eventObj));
        
        document.getElementById("eventNameInput").value = currentEvent.name || "";
        document.getElementById("eventDescInput").value = currentEvent.description || "";
        document.getElementById("isPublicToggle").checked = currentEvent.isPublic !== false && currentEvent.isPublic !== "false";
        document.getElementById("isRankedToggle").checked = currentEvent.isRanked !== false;
        document.getElementById("eventSecretCodeInput").value = currentEvent.secretCode || "";

        // Schedule Mode
        setScheduleMode(currentEvent.scheduleMode || 'manual');
        document.getElementById("eventAutoStartInput").value = currentEvent.autoStartTime || "";
        document.getElementById("eventAutoEndInput").value = currentEvent.autoEndTime || "";

        // Sponsor & Prize Toggle
        if (!Array.isArray(currentEvent.sponsors)) {
            currentEvent.sponsors = [];
            if (currentEvent.sponsorName || currentEvent.sponsorLogo) {
                currentEvent.sponsors.push({
                    name: currentEvent.sponsorName || "",
                    logo: currentEvent.sponsorLogo || ""
                });
            }
        }
        let hasSponsorPrize = Boolean(currentEvent.enableSponsorPrize || currentEvent.sponsors.length > 0 || currentEvent.sponsorName || currentEvent.sponsorLogo || parseFloat(currentEvent.entryFee) > 0 || parseFloat(currentEvent.bigFishFee) > 0);
        document.getElementById("enableSponsorPrizeToggle").checked = hasSponsorPrize;
        toggleSponsorPrizeSection(hasSponsorPrize);

        document.getElementById("eventEntryFeeInput").value = currentEvent.entryFee || 0;
        document.getElementById("eventClubCutInput").value = currentEvent.clubCutPct !== undefined ? currentEvent.clubCutPct : 10;
        document.getElementById("eventBigFishFeeInput").value = currentEvent.bigFishFee || 0;
        document.getElementById("payoutPct1").value = currentEvent.payoutPct1 !== undefined ? currentEvent.payoutPct1 : 50;
        document.getElementById("payoutPct2").value = currentEvent.payoutPct2 !== undefined ? currentEvent.payoutPct2 : 30;
        document.getElementById("payoutPct3").value = currentEvent.payoutPct3 !== undefined ? currentEvent.payoutPct3 : 20;
        document.getElementById("eventSponsorNameInput").value = "";
        document.getElementById("eventSponsorLogoInput").value = "";
        spPrev.removeAttribute('src');
        spPrev.style.display = 'none';
        
        if(currentEvent.thumbnail) {
            thumbPrev.src = currentEvent.thumbnail;
            thumbPrev.style.display = 'block';
        } else {
            thumbPrev.removeAttribute('src');
            thumbPrev.style.display = 'none';
        }

        setEventType(currentEvent.eventType || 'standard');
        setUnit(currentEvent.unit || 'metric');
        setMeasure(currentEvent.measureType || 'size');
        setLimit(currentEvent.limitType || 'all');
        document.getElementById("bulkParticipantsInput").value = (currentEvent.participants||[]).map(p => p.name).join("\n");
    } else {
        let defaultSpecies = [{ name: "Perch", abbr: "pr", tiers: [{ from: 0, to: "above", multiplier: 1.0 }] }];
        let savedDefaults = localStorage.getItem("lureboard_hub_defaults_" + loggedInUser);
        if (savedDefaults) { try { defaultSpecies = JSON.parse(savedDefaults); } catch(e) {} }
        
        currentEvent = {
            id: "ev_" + Date.now(),
            name: "New Fishing Trip",
            date: new Date().toLocaleDateString(),
            year: new Date().getFullYear().toString(),
            status: "announced",
            scheduleMode: "manual",
            autoStartTime: "",
            autoEndTime: "",
            isRanked: true,
            isPublic: true,
            isStarted: false,
            isUnlocked: isUserPro(),
            eventType: 'standard',
            secretCode: "",
            enableSponsorPrize: false,
            entryFee: 0,
            clubCutPct: 10,
            bigFishFee: 0,
            payoutPct1: 50,
            payoutPct2: 30,
            payoutPct3: 20,
            sponsors: [],
            sponsorName: "",
            sponsorLogo: "",
            unit: 'metric',
            measureType: 'size',
            limitType: 'all',
            description: "",
            thumbnail: "",
            species: defaultSpecies,
            participants: []
        };
        
        document.getElementById("eventNameInput").value = "";
        document.getElementById("eventDescInput").value = "";
        document.getElementById("isPublicToggle").checked = true;
        document.getElementById("isRankedToggle").checked = true;
        document.getElementById("eventThumbnailInput").value = "";
        thumbPrev.removeAttribute('src');
        thumbPrev.style.display = 'none';
        
        document.getElementById("enableSponsorPrizeToggle").checked = false;
        toggleSponsorPrizeSection(false);
        document.getElementById("eventSponsorLogoInput").value = "";
        spPrev.removeAttribute('src');
        spPrev.style.display = 'none';
        document.getElementById("bulkParticipantsInput").value = "";
        document.getElementById("eventSecretCodeInput").value = "";
        document.getElementById("eventEntryFeeInput").value = "0";
        document.getElementById("eventClubCutInput").value = "10";
        document.getElementById("eventBigFishFeeInput").value = "0";
        document.getElementById("payoutPct1").value = "50";
        document.getElementById("payoutPct2").value = "30";
        document.getElementById("payoutPct3").value = "20";
        document.getElementById("eventSponsorNameInput").value = "";

        setScheduleMode('manual');
        document.getElementById("eventAutoStartInput").value = "";
        document.getElementById("eventAutoEndInput").value = "";
        
        setEventType('standard');
        setUnit('metric');
        setMeasure('size');
        setLimit('all');
    }
    updateParticipantCountStatus();
    refreshSetupUI();
}

function updateParticipantCountStatus() {
    let rawText = document.getElementById("bulkParticipantsInput").value;
    let count = parseParticipants(rawText).length;
    let statusBadge = document.getElementById("participantCountStatus");
    let capLabel = document.getElementById("participantCapLabel");
    if (statusBadge) statusBadge.innerText = count;
    if (capLabel) {
        if (isEventUnlocked(currentEvent)) {
            capLabel.innerText = "UNLIMITED PASS ACTIVE";
            capLabel.style.color = "var(--pro-accent)";
        } else {
            capLabel.innerText = `Free Cap: ${count}/${FREE_ANGLER_CAP}`;
            capLabel.style.color = count > FREE_ANGLER_CAP ? "var(--danger)" : "var(--text-muted)";
        }
    }
}

function addSpecies() {
    let name = document.getElementById("speciesName").value.trim();
    let abbr = document.getElementById("speciesAbbr").value.trim().toLowerCase();
    if (!name || !abbr) return;
    currentEvent.species.push({ name, abbr, tiers: [{ from: 0, to: "above", multiplier: 1.0 }] });
    document.getElementById("speciesName").value = "";
    document.getElementById("speciesAbbr").value = "";
    refreshSetupUI();
}

function removeSpecies(sIdx) { currentEvent.species.splice(sIdx, 1); refreshSetupUI(); }

function addSponsorToEvent() {
    if (!currentEvent) return;
    if (!Array.isArray(currentEvent.sponsors)) currentEvent.sponsors = [];

    let nameInput = document.getElementById("eventSponsorNameInput");
    let logoInput = document.getElementById("eventSponsorLogoInput");
    let spPrev = document.getElementById("sponsorLogoPreview");

    let name = nameInput ? nameInput.value.trim() : "";
    let logo = tempSponsorLogoBase64 || (spPrev && spPrev.getAttribute('src') && spPrev.getAttribute('src').startsWith('data:') ? spPrev.getAttribute('src') : "");

    if (!name && !logo) {
        alert("Please enter a sponsor name or upload a sponsor logo.");
        return;
    }

    currentEvent.sponsors.push({ name, logo });
    if (nameInput) nameInput.value = "";
    if (logoInput) logoInput.value = "";
    if (spPrev) {
        spPrev.removeAttribute('src');
        spPrev.style.display = 'none';
    }
    tempSponsorLogoBase64 = "";
    renderSponsorsConfigUI();
}

function removeSponsorFromEvent(spIdx) {
    if (!currentEvent || !Array.isArray(currentEvent.sponsors)) return;
    currentEvent.sponsors.splice(spIdx, 1);
    renderSponsorsConfigUI();
}

function renderSponsorsConfigUI() {
    let container = document.getElementById("sponsorsConfigContainer");
    if (!container || !currentEvent) return;
    let list = Array.isArray(currentEvent.sponsors) ? currentEvent.sponsors : [];
    if (list.length === 0) {
        container.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:8px;">No sponsors added yet. Enter a sponsor above and click "Add Sponsor".</div>`;
        return;
    }
    container.innerHTML = list.map((sp, idx) => `
        <div class="card flex flex-between" style="padding: 12px 16px; margin-bottom: 8px; background: var(--bg);">
            <div class="flex" style="gap: 12px; align-items: center;">
                ${sp.logo ? `<img src="${sp.logo}" style="height: 36px; max-width: 90px; object-fit: contain; background: #fff; padding: 3px; border-radius: 6px; border: 1px solid var(--border);">` : `<span class="badge pro" style="font-size:10px;">💎</span>`}
                <b style="font-size: 14px;">${escapeHTML(sp.name || "Logo Sponsor")}</b>
            </div>
            <button type="button" class="danger icon-btn" style="padding: 6px 10px;" onclick="removeSponsorFromEvent(${idx})">${svgTrash}</button>
        </div>
    `).join('');
}

function refreshSetupUI() {
    try {
        renderSponsorsConfigUI();
        let container = document.getElementById("speciesConfigContainer");
        container.innerHTML = currentEvent.species.map((s, sIdx) => {
            let rulesSummary = s.tiers.map(t => {
                let fromVal = t.from === "" ? 0 : t.from;
                let toVal = t.to === 'above' ? '∞' : (t.to === "" ? 0 : t.to);
                let mult = t.multiplier === "" ? "1.0" : parseFloat(t.multiplier).toFixed(1);
                return `${fromVal}-${toVal} ${mult}x`;
            }).join(' | ');

            return `
            <div class="card" style="padding:16px; margin-bottom:12px;">
                <div class="flex flex-between">
                    <div>
                        <div class="flex">
                            <b style="font-size:15px;">${escapeHTML(s.name)}</b>
                            <span class="badge neutral" style="font-size:10px;">${escapeHTML(s.abbr.toUpperCase())}</span>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${rulesSummary}</div>
                    </div>
                    <div class="flex">
                        <button class="secondary icon-btn" onclick="openRulesModal(${sIdx})">Rules</button>
                        <button class="danger icon-btn" style="padding:6px 10px;" onclick="removeSpecies(${sIdx})">${svgTrash}</button>
                    </div>
                </div>
            </div>`;
        }).join("");

        let isStarted = ['ongoing', 'finished'].includes(currentEvent.status);
        if (isStarted) {
            document.getElementById("bulkParticipantsInput").disabled = true;
            document.getElementById("bulkParticipantsOverlay").classList.remove("hidden");
            document.getElementById("bulkParticipantsOverlay").style.display = "flex";
        } else {
            document.getElementById("bulkParticipantsInput").disabled = false;
            document.getElementById("bulkParticipantsOverlay").classList.add("hidden");
            document.getElementById("bulkParticipantsOverlay").style.display = "none";
        }
    } catch(e) {
        console.error(e);
    }
}

function openRulesModal(sIdx) { activeSpeciesIndex = sIdx; document.getElementById("rulesModal").classList.remove("hidden"); renderRules(); }
function closeRulesModal() { document.getElementById("rulesModal").classList.add("hidden"); activeSpeciesIndex = null; refreshSetupUI(); }

function addNewRule() {
    let s = currentEvent.species[activeSpeciesIndex];
    let lastTier = s.tiers[s.tiers.length - 1];
    if (lastTier && lastTier.to === 'above') { alert("Cannot add a rule after an 'Above' limit."); return; }
    s.tiers.push({ from: lastTier ? (parseFloat(lastTier.to) + 1 || 0) : 0, to: 'above', multiplier: 1.0 });
    renderRules();
}

function removeRule(tIdx) {
    let s = currentEvent.species[activeSpeciesIndex];
    s.tiers.splice(tIdx, 1);
    if(s.tiers.length === 0) s.tiers.push({ from: 0, to: 'above', multiplier: 1.0 });
    recalcRulesCascading(); renderRules();
}

function updateRuleField(tIdx, field, val) {
    let s = currentEvent.species[activeSpeciesIndex];
    if (field === 'toType') {
        if (val === 'above') { s.tiers[tIdx].to = 'above'; s.tiers.splice(tIdx + 1); } 
        else { s.tiers[tIdx].to = (parseFloat(s.tiers[tIdx].from) || 0) + 10; }
    } 
    else if (field === 'to') { s.tiers[tIdx].to = parseFloat(val) || 0; } 
    else if (field === 'from') {
        let v = parseFloat(val) || 0;
        let minFrom = (tIdx > 0 && s.tiers[tIdx-1].to !== 'above') ? parseFloat(s.tiers[tIdx-1].to) + 1 : 0;
        s.tiers[tIdx].from = Math.max(v, minFrom);
    } 
    else if (field === 'multiplier') { s.tiers[tIdx].multiplier = parseFloat(val); }
    recalcRulesCascading(); renderRules();
}

function recalcRulesCascading() {
    let s = currentEvent.species[activeSpeciesIndex];
    for (let i = 1; i < s.tiers.length; i++) {
        if (s.tiers[i-1].to !== 'above') {
            s.tiers[i].from = Math.max(parseFloat(s.tiers[i].from), parseFloat(s.tiers[i-1].to) + 1);
        }
    }
}

function renderRules() {
    let s = currentEvent.species[activeSpeciesIndex];
    document.getElementById('rulesModalTitle').innerText = 'Edit Rules: ' + s.name;
    
    let html = s.tiers.map((tData, tIdx) => {
        let prevTo = (tIdx > 0 && s.tiers[tIdx-1].to !== 'above') ? parseFloat(s.tiers[tIdx-1].to) : -1;
        let minFrom = tIdx > 0 ? prevTo + 1 : 0;
        let multOptions = '';
        for(let i = 10; i <= 30; i += 1) { 
            let v = (i/10).toFixed(1);
            multOptions += `<option value="${v}" ${parseFloat(tData.multiplier) === parseFloat(v) ? 'selected' : ''}>${v}x</option>`;
        }
        return `
        <div class="tier-grid" style="position:relative;">
            <button class="danger icon-btn" style="position:absolute; top:-8px; right:-8px; padding:6px; border-radius:50%; box-shadow:none;" onclick="removeRule(${tIdx})">${svgTrash}</button>
            <div><label>From</label><input type="number" step="any" value="${tData.from}" min="${minFrom}" onchange="updateRuleField(${tIdx}, 'from', this.value)"></div>
            <div><label>To</label>
                <div style="display:flex; gap:4px;">
                    <select onchange="updateRuleField(${tIdx}, 'toType', this.value)" style="flex:1;">
                        <option value="number" ${tData.to !== 'above' ? 'selected' : ''}>Number</option>
                        <option value="above" ${tData.to === 'above' ? 'selected' : ''}>Above</option>
                    </select>
                    ${tData.to !== 'above' ? `<input type="number" step="any" value="${tData.to}" onchange="updateRuleField(${tIdx}, 'to', this.value)" style="flex:1;">` : ''}
                </div>
            </div>
            <div class="full-width"><label>Multiplier</label><select onchange="updateRuleField(${tIdx}, 'multiplier', this.value)">${multOptions}</select></div>
        </div>`;
    }).join('');

    document.getElementById('rulesContainer').innerHTML = html;
}

// SECURE AUTO-SAVE TO DEDICATED HUB_EVENTS COLLECTION
async function saveCurrentEvent(redirect = true) {
    if (!currentEvent) return;
    if (!currentEvent.date) currentEvent.date = new Date().toLocaleDateString();
    if (!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();
    if (!currentEvent.status) currentEvent.status = "announced";

    showSaveStatus("Saving...", "#f59e0b");

    let safeDetails;
    try {
        safeDetails = JSON.parse(JSON.stringify(currentEvent));
    } catch (e) {
        console.error("JSON Stringify Error:", e);
        showSaveStatus("✕ Error", "#f43f5e");
        alert("Failed to serialize event. Check for invalid data.");
        return;
    }

    const eventPayload = { 
        username: loggedInUser, 
        name: safeDetails.name || "Untitled Event", 
        details: safeDetails, 
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
    };

    try {
        localStorage.setItem("lureboard_hub_defaults_" + loggedInUser, JSON.stringify(safeDetails.species));
        
        if (!currentEvent.id) {
            currentEvent.id = "ev_" + Date.now();
            safeDetails.id = currentEvent.id;
        }

        await db.collection(EVENTS_COL).doc(currentEvent.id).set(eventPayload);
        showSaveStatus("✓ Saved", "#10b981");
        if (redirect) showMyEvents(); 
    } catch (err) {
        showSaveStatus("✕ Error", "#f43f5e");
        console.error("Save error:", err); 
        alert("Firebase write rejected: " + err.message); 
    }
}

async function goToEventHub() {
    try {
        // Mandatory Event Image Check
        let thumbPreview = document.getElementById('thumbnailPreview');
        let hasThumb = (thumbPreview && thumbPreview.getAttribute('src') && thumbPreview.getAttribute('src').startsWith('data:')) || Boolean(currentEvent.thumbnail);
        if (!hasThumb) {
            alert("Please upload a Mandatory Header Image for your tournament before continuing.");
            return;
        }
        if (thumbPreview && thumbPreview.getAttribute('src') && thumbPreview.getAttribute('src').startsWith('data:')) {
            currentEvent.thumbnail = thumbPreview.getAttribute('src');
        }

        // Schedule Check
        currentEvent.scheduleMode = confScheduleMode;
        if (confScheduleMode === 'auto') {
            let sVal = document.getElementById("eventAutoStartInput").value;
            let eVal = document.getElementById("eventAutoEndInput").value;
            if (!sVal || !eVal) {
                alert("Please select both Auto-Start and Auto-Finish dates/times, or switch to Manual schedule mode.");
                return;
            }
            if (new Date(eVal).getTime() <= new Date(sVal).getTime()) {
                alert("Auto-Finish time must be after Auto-Start time.");
                return;
            }
            currentEvent.autoStartTime = sVal;
            currentEvent.autoEndTime = eVal;
            // Immediately compute current status from local time
            let now = Date.now();
            if (now >= new Date(eVal).getTime()) currentEvent.status = 'finished';
            else if (now >= new Date(sVal).getTime()) currentEvent.status = 'ongoing';
            else currentEvent.status = 'announced';
        } else {
            currentEvent.autoStartTime = "";
            currentEvent.autoEndTime = "";
        }

        // Pull latest live participants from cloud cache so self-registered users are never overwritten
        let latestCloudEv = allPublicEvents.find(e => e.id === currentEvent.id) || loadedEvents.find(e => e.id === currentEvent.id);
        let liveParticipants = (latestCloudEv && latestCloudEv.details && latestCloudEv.details.participants) 
            ? latestCloudEv.details.participants 
            : (currentEvent.participants || []);

        let isStarted = ['ongoing', 'finished'].includes(currentEvent.status);
        let bulkEl = document.getElementById("bulkParticipantsInput");
        let pastedNames = parseParticipants(bulkEl ? bulkEl.value : "");

        // Merge pasted names with any self-registered participants so nobody gets wiped out
        let existingMap = {};
        liveParticipants.forEach(p => {
            existingMap[p.name.toLowerCase()] = p;
        });

        let finalParticipantNames = [...pastedNames];
        liveParticipants.forEach(p => {
            if ((p.selfRegistered || p.registeredBy !== loggedInUser) && !finalParticipantNames.some(n => n.toLowerCase() === p.name.toLowerCase())) {
                finalParticipantNames.push(p.name);
            }
        });

        if (isStarted) {
            finalParticipantNames = liveParticipants.map(p => p.name);
        }

        // Enforce 15-Angler Trojan Horse Free Tier Cap
        if (!isEventUnlocked(currentEvent) && finalParticipantNames.length > FREE_ANGLER_CAP) {
            openUpgradeModal(`Your tournament has ${finalParticipantNames.length} participants. The Free Tier supports up to ${FREE_ANGLER_CAP} anglers. Unlock this tournament with a 25 CR Event Pass or upgrade to PRO Club!`);
            return;
        }

        // Sponsor & Prize Pool Checkbox Handling (Supports Multiple Sponsors & Prevents Sponsor Bleed)
        let enableSponsorPrize = document.getElementById("enableSponsorPrizeToggle").checked;
        if (enableSponsorPrize) {
            if (!isEventUnlocked(currentEvent)) {
                openUpgradeModal("Sponsor Banner Integration and Automated Payout Calculators require a Single Event Pass (25 CR) or Pro Club Plan (100 CR).");
                return;
            }
            currentEvent.enableSponsorPrize = true;
            currentEvent.entryFee = parseFloat(document.getElementById("eventEntryFeeInput").value) || 0;
            currentEvent.clubCutPct = parseFloat(document.getElementById("eventClubCutInput").value) || 0;
            currentEvent.bigFishFee = parseFloat(document.getElementById("eventBigFishFeeInput").value) || 0;
            currentEvent.payoutPct1 = parseFloat(document.getElementById("payoutPct1").value) || 50;
            currentEvent.payoutPct2 = parseFloat(document.getElementById("payoutPct2").value) || 30;
            currentEvent.payoutPct3 = parseFloat(document.getElementById("payoutPct3").value) || 20;

            if (!Array.isArray(currentEvent.sponsors)) currentEvent.sponsors = [];

            // Auto-capture any pending sponsor input that the user typed/selected without clicking "+ Add Sponsor"
            let pendingName = document.getElementById("eventSponsorNameInput").value.trim();
            let spPreview = document.getElementById('sponsorLogoPreview');
            let pendingLogo = tempSponsorLogoBase64 || (spPreview && spPreview.getAttribute('src') && spPreview.getAttribute('src').startsWith('data:') ? spPreview.getAttribute('src') : "");
            if (pendingName || pendingLogo) {
                currentEvent.sponsors.push({ name: pendingName, logo: pendingLogo });
                document.getElementById("eventSponsorNameInput").value = "";
                document.getElementById("eventSponsorLogoInput").value = "";
                if (spPreview) {
                    spPreview.removeAttribute('src');
                    spPreview.style.display = 'none';
                }
                tempSponsorLogoBase64 = "";
            }

            // Keep legacy single-sponsor fields synced with the first sponsor
            currentEvent.sponsorName = (currentEvent.sponsors[0] && currentEvent.sponsors[0].name) || "";
            currentEvent.sponsorLogo = (currentEvent.sponsors[0] && currentEvent.sponsors[0].logo) || "";
        } else {
            currentEvent.enableSponsorPrize = false;
            currentEvent.entryFee = 0;
            currentEvent.clubCutPct = 10;
            currentEvent.bigFishFee = 0;
            currentEvent.sponsors = [];
            currentEvent.sponsorName = "";
            currentEvent.sponsorLogo = "";
        }

        currentEvent.name = document.getElementById("eventNameInput").value.trim() || "Untitled Event";
        currentEvent.description = document.getElementById("eventDescInput").value.trim();
        currentEvent.isPublic = document.getElementById("isPublicToggle").checked;
        let wantsRanked = document.getElementById("isRankedToggle").checked;

        currentEvent.eventType = confEventType;
        currentEvent.secretCode = document.getElementById("eventSecretCodeInput").value.trim() || "LB-2026";
        currentEvent.unit = confUnit;
        currentEvent.measureType = confMeasure;
        currentEvent.limitType = confLimit;
        if (isUserPro()) currentEvent.isUnlocked = true;
        
        currentEvent.hostFullName = loggedInUserData ? loggedInUserData.fullName || loggedInUser : loggedInUser;
        currentEvent.hostAvatar = loggedInUserData ? loggedInUserData.avatar || "https://via.placeholder.com/40" : "https://via.placeholder.com/40";

        if(!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();
        if(!currentEvent.status) currentEvent.status = "announced";

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

        if (!isStarted) {
            currentEvent.participants = finalParticipantNames.map(name => {
                let lowerName = name.toLowerCase();
                let prev = existingMap[lowerName];
                return {
                    id: prev ? prev.id : 'p_' + Math.random().toString(36).substr(2, 9),
                    name: prev ? prev.name : name,
                    catches: prev ? (prev.catches || []) : [],
                    penalties: prev ? (prev.penalties || []) : [],
                    registeredBy: prev ? prev.registeredBy : loggedInUser,
                    selfRegistered: prev ? Boolean(prev.selfRegistered) : false
                };
            });
        } else {
            currentEvent.participants = liveParticipants;
        }
        
        await saveCurrentEvent(false); 
        
        activeHubTab = 'part';
        hideAllSections();
        document.getElementById("hubSection").classList.remove("hidden");
        window.scrollTo(0, 0);
        
        history.pushState({view: 'hubSection'}, "");
        renderHubUI();
    } catch(e) {
        console.error("Navigation error:", e);
        alert("Error parsing event configuration: " + e.message);
    }
}

// Syncs live participants into the Setup textarea before showing Setup so nobody gets lost!
function backToSetup() {
    if (currentEvent) {
        let latestCloudEv = allPublicEvents.find(e => e.id === currentEvent.id) || loadedEvents.find(e => e.id === currentEvent.id);
        if (latestCloudEv && latestCloudEv.details && latestCloudEv.details.participants) {
            currentEvent.participants = latestCloudEv.details.participants;
        }
        let bulkEl = document.getElementById("bulkParticipantsInput");
        if (bulkEl) {
            bulkEl.value = (currentEvent.participants || []).map(p => p.name).join("\n");
            updateParticipantCountStatus();
        }
    }
    hideAllSections();
    document.getElementById("setupSection").classList.remove("hidden");
    refreshSetupUI();
    window.scrollTo(0, 0);
    history.pushState({view: 'setupSection'}, "");
}

async function startEventNow() {
    let msg = currentEvent.eventType === 'cpr' 
        ? `Start the CPR event? This will lock the initial roster and publicly reveal Secret Code [${currentEvent.secretCode}] to all anglers.`
        : "Start the event? This will lock the participant list and allow scoring.";
    if (confirm(msg)) {
        currentEvent.status = 'ongoing';
        await saveCurrentEvent(false);
        renderHubUI();
    }
}

async function promptFinishEvent() {
    if(currentEvent.status === 'finished') return;
    if (confirm("Finish event? This will permanently lock scoring and trigger the 7-day photo cleanup countdown.")) {
        currentEvent.status = "finished";
        currentEvent.finishedAt = Date.now();
        await saveCurrentEvent(true);
    }
}

function openAddParticipantModal() {
    if(currentEvent.status === 'finished') return;
    if (!isEventUnlocked(currentEvent) && (currentEvent.participants || []).length >= FREE_ANGLER_CAP) {
        openUpgradeModal(`This event has reached the ${FREE_ANGLER_CAP}-angler Free Tier limit. Unlock this event (25 CR) or upgrade to PRO Club to add more participants!`);
        return;
    }
    document.getElementById("modalParticipantName").value = "";
    document.getElementById("participantModal").classList.remove("hidden");
    setTimeout(() => document.getElementById("modalParticipantName").focus(), 100);
}
function closeAddParticipantModal() { document.getElementById("participantModal").classList.add("hidden"); }

async function confirmAddParticipantModal() {
    let items = parseParticipants(document.getElementById("modalParticipantName").value);
    if (!isEventUnlocked(currentEvent) && ((currentEvent.participants || []).length + items.length) > FREE_ANGLER_CAP) {
        closeAddParticipantModal();
        openUpgradeModal(`Adding ${items.length} angler(s) exceeds the ${FREE_ANGLER_CAP}-angler Free Tier cap. Unlock this event with a 25 CR Event Pass!`);
        return;
    }
    items.forEach(name => currentEvent.participants.push({ id: 'p_'+Math.random().toString(36).substr(2,9), name: name, catches: [], penalties: [], registeredBy: loggedInUser }));
    closeAddParticipantModal(); 
    renderHubUI();
    await saveCurrentEvent(false);
}

async function editParticipantName(index) {
    if(currentEvent.status === 'finished') return;
    let p = currentEvent.participants[index];
    let newName = prompt("Edit Name:", p.name);
    if (newName && newName.trim() !== "" && newName.trim() !== p.name) {
        p.name = newName.trim();
        renderHubUI(); 
        await saveCurrentEvent(false);
    }
}

function selectModalSpecies(abbr, element) {
    selectedModalSpecies = abbr;
    document.querySelectorAll("#modalSpeciesTabs .species-tab").forEach(tab => tab.classList.remove("active"));
    if (element) element.classList.add("active");
}

function openFishModal(pIndexReal) {
    let isUserUpload = (currentParticipationEventId !== null && !document.getElementById("publicEventSection").classList.contains("hidden"));
    
    if (isUserUpload && currentEvent.status !== 'ongoing') {
        alert("You can only log catches while the event is ongoing.");
        return;
    }
    
    if (!isUserUpload && currentEvent.status === 'announced') return;

    activeFishParticipantIndex = pIndexReal;
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    document.getElementById("modalFishSizeLabel").innerText = `2. Enter Measurement (${unitText})`;

    document.getElementById("modalSpeciesTabs").innerHTML = currentEvent.species.map((s, idx) => `
        <div class="species-tab ${idx === 0 ? 'active' : ''}" onclick="selectModalSpecies('${s.abbr}', this)">${escapeHTML(s.abbr)}</div>
    `).join("");
    
    selectedModalSpecies = currentEvent.species.length > 0 ? currentEvent.species[0].abbr : "";
    document.getElementById("modalFishSize").value = "";
    document.getElementById("modalFishPhoto").value = "";
    
    let photoGroup = document.getElementById("cprPhotoGroup");
    let sizeGroup = document.getElementById("modalFishSizeGroup");
    let exifStatusEl = document.getElementById("exifStatusPreview");
    if (exifStatusEl) exifStatusEl.innerHTML = "";
    
    document.getElementById('modalFishPhotoPreview').style.display = 'none';
    document.getElementById('modalFishPhotoPreview').src = '';
    tempCatchPhotoBase64 = "";
    tempCatchExifTime = null;

    if (isUserUpload) {
        sizeGroup.classList.add("hidden");
        photoGroup.classList.remove("hidden");
    } else {
        sizeGroup.classList.remove("hidden");
        if(currentEvent.eventType === 'cpr') {
            photoGroup.classList.remove("hidden");
        } else {
            photoGroup.classList.add("hidden");
        }
    }

    document.getElementById("fishModal").classList.remove("hidden");
    renderModalCatches();
    if(!isUserUpload) setTimeout(() => document.getElementById("modalFishSize").focus(), 100);
}

function closeFishModal() { document.getElementById("fishModal").classList.add("hidden"); activeFishParticipantIndex = null; selectedModalSpecies = ""; }

function openUserUploadModal() {
    if (!loggedInUser || !currentParticipationEventId) return;
    let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
    if(!evData) return;
    
    currentEvent = evData.details;
    let myName = getMyName();
    let pIdx = currentEvent.participants.findIndex(p => p.name.toLowerCase() === myName.toLowerCase());
    
    if(pIdx === -1) { alert("You are not participating in this event."); return; }
    
    openFishModal(pIdx);
}

async function confirmAddFishModal() {
    if (activeFishParticipantIndex === null || !selectedModalSpecies) return;
    
    let isUserUpload = (currentParticipationEventId !== null && !document.getElementById("publicEventSection").classList.contains("hidden"));
    let size = 0;

    if (!isUserUpload) {
        size = parseFloat(document.getElementById("modalFishSize").value.replace(',', '.'));
        if (isNaN(size) || size <= 0) {
            alert("Please enter a valid measurement.");
            return;
        }
    }

    if (isUserUpload && !tempCatchPhotoBase64) {
        alert("A photo of the catch is required.");
        return;
    }

    if (!isUserUpload) {
        let sp = currentEvent.species.find(s => s.abbr === selectedModalSpecies);
        if (sp && sp.tiers && sp.tiers.length > 0) {
            let firstFrom = parseFloat(sp.tiers[0].from);
            if (!isNaN(firstFrom) && size < firstFrom) {
                pendingSmallFish = { abbr: selectedModalSpecies, size };
                document.getElementById("smallFishWarningModal").classList.remove("hidden");
                return;
            }
        }
    }
    
    await executeAddFish(selectedModalSpecies, size);
}

async function executeAddFish(abbr, size) {
    let isUserUpload = (currentParticipationEventId !== null && !document.getElementById("publicEventSection").classList.contains("hidden"));
    
    let catchObj = { 
        abbr, 
        size,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (tempCatchPhotoBase64) {
        catchObj.photo = tempCatchPhotoBase64;
        catchObj.exifTime = tempCatchExifTime || "No EXIF Date";
    }

    currentEvent.participants[activeFishParticipantIndex].catches.unshift(catchObj); 
    
    document.getElementById("modalFishSize").value = ""; 
    document.getElementById("modalFishPhoto").value = "";
    document.getElementById('modalFishPhotoPreview').style.display = 'none';
    document.getElementById('modalFishPhotoPreview').src = '';
    let exifStatusEl = document.getElementById("exifStatusPreview");
    if (exifStatusEl) exifStatusEl.innerHTML = "";
    tempCatchPhotoBase64 = "";
    tempCatchExifTime = null;

    if (isUserUpload) {
        let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
        let safeDetails = JSON.parse(JSON.stringify(currentEvent));
        
        showSaveStatus("Saving...", "#f59e0b");
        try {
            await db.collection(EVENTS_COL).doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
            showSaveStatus("✓ Saved", "#10b981");
            alert("Catch logged! Sent to Judge's Queue for verification.");
            closeFishModal();
            openPublicEvent(currentParticipationEventId, false); 
        } catch (err) {
            console.error("Save error:", err);
            showSaveStatus("✕ Error", "#ef4444");
            alert("Failed to save catch.");
        }
    } else {
        await saveCurrentEvent(false); 
        renderModalCatches(); 
        renderHubUI(); 
        document.getElementById("modalFishSize").focus();
    }
}

function cancelSmallFish() { document.getElementById("smallFishWarningModal").classList.add("hidden"); document.getElementById("modalFishSize").value = ""; pendingSmallFish = null; document.getElementById("modalFishSize").focus(); }
async function ignoreSmallFish() { document.getElementById("smallFishWarningModal").classList.add("hidden"); if (pendingSmallFish) { await executeAddFish(pendingSmallFish.abbr, pendingSmallFish.size); pendingSmallFish = null; } }

async function updateCatchSize(pIdx, cIdx, val, btnElement) {
    let size = parseFloat(String(val).replace(',', '.'));
    if (isNaN(size) || size < 0) size = 0;
    currentEvent.participants[pIdx].catches[cIdx].size = size;
    
    if (btnElement) {
        let oldText = btnElement.innerHTML;
        btnElement.innerHTML = "Saved!";
        btnElement.classList.replace("primary", "success");
        setTimeout(() => {
            if (btnElement) {
                btnElement.innerHTML = oldText;
                btnElement.classList.replace("success", "primary");
            }
        }, 1500);
    }
    
    await saveCurrentEvent(false);
    renderHubUI();
}

async function removeFish(pIndexReal, cIdx) {
    let isUserUpload = (currentParticipationEventId !== null && !document.getElementById("publicEventSection").classList.contains("hidden"));
    currentEvent.participants[pIndexReal].catches.splice(cIdx, 1);
    
    if (isUserUpload) {
        let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
        let safeDetails = JSON.parse(JSON.stringify(currentEvent));
        
        showSaveStatus("Saving...", "#f59e0b");
        try {
            await db.collection(EVENTS_COL).doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
            showSaveStatus("✓ Saved", "#10b981");
            if(activeFishParticipantIndex !== null) renderModalCatches();
            renderPublicLeaderboardList(safeDetails);
            renderPublicGallery(safeDetails);
        } catch (err) {
            console.error("Save error:", err);
            showSaveStatus("✕ Error", "#ef4444");
        }
    } else {
        await saveCurrentEvent(false);
        if(activeFishParticipantIndex !== null) renderModalCatches();
        renderHubUI();
    }
}

function renderModalCatches() {
    let container = document.getElementById("modalCurrentCatches");
    if (activeFishParticipantIndex === null) return;
    let p = currentEvent.participants[activeFishParticipantIndex];
    if ((p.catches||[]).length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center;">No catches logged.</p>`; return; }
    
    let isUserUpload = (currentParticipationEventId !== null && !document.getElementById("publicEventSection").classList.contains("hidden"));
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    
    container.innerHTML = `<label style="font-size:13px; color:var(--text-muted); margin-bottom:8px; display:block;">Current Catches:</label>` + 
        p.catches.map((c, cIdx) => {
            let sizeDisplay = isUserUpload ? 
                `<b>${c.size > 0 ? c.size + unitText : 'Pending'}</b>` :
                `<div class="flex" style="margin-right:8px;"><input type="number" step="any" id="editCatchSize_${cIdx}" value="${c.size}" style="width:70px; padding:4px 8px; font-size:14px; border:1px solid var(--border); border-radius:4px;"><button class="primary icon-btn" style="padding:4px 8px; box-shadow:none;" onclick="updateCatchSize(${activeFishParticipantIndex}, ${cIdx}, document.getElementById('editCatchSize_${cIdx}').value, this)">Save</button></div>`;

            let photoBtn = c.photo ? `<button class="secondary icon-btn" style="padding:4px 8px; margin-left:4px; box-shadow:none; font-size:12px; gap:6px;" onclick="openPhotoPreviewByUrl('${c.photo}')"><img src="${c.photo}" style="width:20px; height:20px; border-radius:4px; object-fit:cover;"> 📷 Photo</button>` : '';
            let exifTag = c.exifTime ? `<div style="font-size:11px; color:${c.exifTime === 'No EXIF Date' ? 'var(--warning)' : 'var(--text-muted)'}; width:100%; margin-top:2px;">📷 ${escapeHTML(c.exifTime)}</div>` : '';
            
            let canDelete = (!isUserUpload) || (isUserUpload && currentEvent.status === 'ongoing');
            let deleteBtn = canDelete ? `<button class="danger icon-btn" style="padding:6px; box-shadow:none;" onclick="removeFish(${activeFishParticipantIndex}, ${cIdx})">${svgTrash}</button>` : '';

            return `
        <div style="padding:12px 0; border-bottom:1px solid var(--border);">
            <div class="flex flex-between" style="align-items: center;">
                <span class="flex" style="align-items: center;">
                    ${sizeDisplay} 
                    <span class="badge neutral">${escapeHTML(c.abbr.toUpperCase())}</span> 
                    ${photoBtn}
                </span>
                ${deleteBtn}
            </div>
            ${exifTag}
        </div>`;
        }).join('');
}

// ---------------------------------------------------------
// RAPID JUDGE'S QUEUE (2.5x Loupe Zoom + Keyboard Workflow)
// ---------------------------------------------------------
function switchHubTab(tab) {
    activeHubTab = tab;
    document.getElementById("tabHubPart").classList.toggle("active", tab === 'part');
    document.getElementById("tabHubJudge").classList.toggle("active", tab === 'judge');
    document.getElementById("hubParticipantsWrap").classList.toggle("hidden", tab !== 'part');
    document.getElementById("hubJudgeQueueWrap").classList.toggle("hidden", tab !== 'judge');
    if (tab === 'judge') renderJudgeQueue();
}

function renderJudgeQueue() {
    let container = document.getElementById("judgeQueueContainer");
    let badge = document.getElementById("judgeQueueBadge");
    if (!container || !currentEvent) return;

    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    let pendingList = [];

    (currentEvent.participants || []).forEach((p, pIdx) => {
        (p.catches || []).forEach((c, cIdx) => {
            if (!c.size || c.size <= 0) {
                pendingList.push({ pIdx, cIdx, pName: p.name, catchObj: c });
            }
        });
    });

    if (badge) {
        badge.innerText = pendingList.length;
        badge.classList.toggle("hidden", pendingList.length === 0);
    }

    if (pendingList.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:32px 16px; color:var(--text-muted);">🎉 All catch photos have been graded!</div>`;
        return;
    }

    container.innerHTML = pendingList.map(item => {
        let c = item.catchObj;
        let wrapId = `judgeWrap_${item.pIdx}_${item.cIdx}`;
        let exifBadge = c.exifTime === "No EXIF Date" 
            ? `<span class="badge warning" style="font-size:10px;">⚠️ No EXIF Timestamp</span>`
            : `<span class="badge success" style="font-size:10px;">📷 Taken: ${escapeHTML(c.exifTime || 'Unknown')}</span>`;

        return `
        <div class="judge-card">
            <div class="flex flex-between">
                <div>
                    <b style="font-size:16px;">${escapeHTML(item.pName)}</b>
                    <span class="badge neutral" style="margin-left:6px;">${escapeHTML(c.abbr.toUpperCase())}</span>
                </div>
                <div class="flex" style="gap:6px;">
                    ${exifBadge}
                    ${c.photo ? `<button class="secondary icon-btn" style="padding:4px 8px; font-size:11px;" onclick="toggleJudgeCardZoom('${wrapId}')">🔍 2.5x Loupe</button>` : ''}
                </div>
            </div>
            ${c.photo ? `
                <div id="${wrapId}" class="judge-img-wrap" onmousemove="panZoomImage(event, this)" ontouchmove="panZoomImageTouch(event, this)" onclick="toggleJudgeCardZoom('${wrapId}')">
                    <img src="${c.photo}" title="Click to toggle 2.5x bump-board zoom, move mouse to inspect">
                </div>` : `<div style="padding:20px; text-align:center; color:var(--text-muted);">No Photo Attached</div>`}
            <div class="flex" style="margin-top:4px;">
                <input type="number" step="any" class="judge-size-input" id="judgeInput_${item.pIdx}_${item.cIdx}" placeholder="Size (${unitText}) • Press Enter to Approve" style="flex:1; background:var(--surface);" onkeydown="handleJudgeKeydown(event, ${item.pIdx}, ${item.cIdx})">
                <button class="success icon-btn" style="padding:14px 20px;" onclick="approveJudgeCatch(${item.pIdx}, ${item.cIdx})">Approve</button>
                <button class="danger icon-btn" style="padding:14px;" title="Reject & Delete (Shift+Del)" onclick="removeFish(${item.pIdx}, ${item.cIdx})">${svgTrash}</button>
            </div>
        </div>`;
    }).join('');
}

async function handleJudgeKeydown(e, pIdx, cIdx) {
    if (e.key === 'Enter') {
        e.preventDefault();
        await approveJudgeCatch(pIdx, cIdx, true);
    } else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        await removeFish(pIdx, cIdx);
        setTimeout(() => {
            let nextInput = document.querySelector(".judge-size-input");
            if (nextInput) nextInput.focus();
        }, 80);
    }
}

async function approveJudgeCatch(pIdx, cIdx, autoFocusNext = false) {
    let inputEl = document.getElementById(`judgeInput_${pIdx}_${cIdx}`);
    if (!inputEl) return;
    let val = parseFloat(String(inputEl.value).replace(',', '.'));
    if (isNaN(val) || val <= 0) {
        alert("Please enter a valid measurement greater than 0 to approve.");
        return;
    }
    currentEvent.participants[pIdx].catches[cIdx].size = val;
    await saveCurrentEvent(false);
    renderHubUI();
    if (autoFocusNext) {
        setTimeout(() => {
            let nextInput = document.querySelector(".judge-size-input");
            if (nextInput) nextInput.focus();
        }, 80);
    }
}

function openPenaltyModal(pIndexReal) {
    activePenaltyParticipantIndex = pIndexReal;
    document.getElementById("modalPenaltyPoints").value = "";
    document.getElementById("modalPenaltyReason").value = "";
    document.getElementById("penaltyModal").classList.remove("hidden");
    renderModalPenalties();
}
function closePenaltyModal() { document.getElementById("penaltyModal").classList.add("hidden"); activePenaltyParticipantIndex = null; }

async function confirmAddPenalty() {
    if(activePenaltyParticipantIndex === null) return;
    let pts = parseFloat(document.getElementById("modalPenaltyPoints").value);
    let reason = document.getElementById("modalPenaltyReason").value.trim();
    if(isNaN(pts) || pts <= 0 || !reason) { alert("Enter valid points and reason."); return; }
    
    let p = currentEvent.participants[activePenaltyParticipantIndex];
    if(!p.penalties) p.penalties = [];
    p.penalties.push({ points: pts, reason: reason });
    await saveCurrentEvent(false);
    renderModalPenalties(); renderHubUI();
}

async function removePenalty(pIndexReal, penIdx) {
    currentEvent.participants[pIndexReal].penalties.splice(penIdx, 1);
    await saveCurrentEvent(false);
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
            <div><b style="color:var(--danger);">-${pen.points} pts</b> <span style="font-size:13px; color:var(--text-muted); margin-left:6px;">${escapeHTML(pen.reason)}</span></div>
            <button class="danger icon-btn" style="padding:6px; box-shadow:none; background:transparent; color:var(--text-muted);" onclick="removePenalty(${activePenaltyParticipantIndex}, ${idx})">${svgTrash}</button>
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
    if (!size || size <= 0) return 0;
    if(measureType === 'weight') return size; 
    let sp = speciesList.find(s => s.abbr === abbr);
    if (!sp || !sp.tiers || sp.tiers.length === 0) return 0;
    
    let matchingTier = sp.tiers.find(t => {
        let f = t.from === "" ? 0 : parseFloat(t.from);
        if (t.to === 'above') return size >= f;
        return size >= f && size <= (t.to === "" ? Infinity : parseFloat(t.to));
    });
    
    if (!matchingTier) return 0; 
    
    let m = (matchingTier.multiplier !== "") ? parseFloat(matchingTier.multiplier) : 1.0;
    return size * (isNaN(m) ? 1.0 : m);
}

function renderHubUI() {
    let isFinished = currentEvent.status === 'finished';
    let isAnnounced = currentEvent.status === 'announced';
    
    document.getElementById("hubTitle").innerText = currentEvent.name || "Hub";
    let passBadge = document.getElementById("hubPassBadge");
    if (passBadge) {
        if (isEventUnlocked(currentEvent)) {
            passBadge.innerText = "UNLIMITED PASS";
            passBadge.className = "badge pro";
            passBadge.onclick = null;
        } else {
            passBadge.innerText = `FREE CAP (${(currentEvent.participants||[]).length}/${FREE_ANGLER_CAP}) • UPGRADE`;
            passBadge.className = "badge warning";
            passBadge.style.cursor = "pointer";
            passBadge.onclick = () => openUpgradeModal();
        }
    }

    renderPayoutWidget(currentEvent, "hubPayoutCard", "hubTotalPotBadge", "hubPayoutGrid");

    document.getElementById("hubAddNewParticipantBtn").style.display = (isFinished) ? "none" : "block";

    let hubTabs = document.getElementById("hubModeTabs");
    if (currentEvent.eventType === 'cpr' && !isAnnounced) {
        hubTabs.classList.remove("hidden");
        renderJudgeQueue();
    } else {
        hubTabs.classList.add("hidden");
        switchHubTab('part');
    }

    let query = document.getElementById("searchParticipant").value.toLowerCase();
    let container = document.getElementById("participantsHubContainer");

    let countEl = document.getElementById("hubParticipantCount");
    if(countEl) countEl.innerText = (currentEvent.participants||[]).length;

    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let filteredHtml = "";
    (currentEvent.participants||[]).forEach((p, pIndexReal) => {
        if (!p.name.toLowerCase().includes(query)) return;

        let catchesText = (p.catches||[]).length > 0 
            ? p.catches.map(c => {
                let isPending = !c.size || c.size <= 0;
                let sizeDisp = !isPending ? c.size + unitText : '⏳ Pending';
                let badgeClass = isPending ? 'warning' : 'neutral';
                if (c.photo) {
                    return `<span class="badge ${badgeClass}" style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px 4px 5px; margin:2px 4px 2px 0; cursor:pointer; border:1px solid var(--border);" onclick="openPhotoPreviewByUrl('${c.photo}')" title="View Catch Photo"><img src="${c.photo}" style="width:22px; height:22px; border-radius:4px; object-fit:cover; border:1px solid rgba(0,0,0,0.15);"> ${sizeDisp} ${escapeHTML(c.abbr.toUpperCase())} <span style="font-size:12px;">📷</span></span>`;
                }
                return `<span class="badge ${badgeClass}" style="margin:2px 4px 2px 0;">${sizeDisp} ${escapeHTML(c.abbr.toUpperCase())}</span>`;
            }).join(' ') 
            : `<span style="color:var(--text-muted); opacity: 0.7; font-style:italic;">No catches</span>`;

        let penBadge = (p.penalties && p.penalties.length > 0) ? `<button onclick="showPenaltyReason(${pIndexReal})" class="danger icon-btn" style="padding:4px; border-radius:50%; box-shadow:none; font-size:12px;">${svgWarning}</button>` : '';

        let actionButtons = '';
        if (isAnnounced) {
            actionButtons = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Announced</span>`;
        } else {
            actionButtons = `
                <button onclick="openPenaltyModal(${pIndexReal})" class="secondary icon-btn" title="Penalties" style="padding:10px;">${svgWarning}</button>
                <button onclick="openFishModal(${pIndexReal})" class="icon-btn primary" title="Log or Edit Catches" style="padding:10px 14px;">${svgFish}</button>
            `;
        }

        let editBtn = isFinished ? '' : `<button onclick="editParticipantName(${pIndexReal})" class="icon-btn" style="padding:4px; background:transparent; color:var(--text-muted); box-shadow:none;">${svgEdit}</button>`;

        filteredHtml += `
        <div class="card" style="padding:16px; margin-bottom:16px;">
            <div class="flex flex-between" style="align-items:center;">
                <div class="flex" style="gap: 8px;">
                    <b style="font-size:15px;">${pIndexReal + 1}. ${escapeHTML(p.name)}</b> ${penBadge} ${editBtn}
                </div>
                <div class="flex">${actionButtons}</div>
            </div>
            ${!isAnnounced ? `<div style="margin-top:16px; font-size:14px; color:var(--text-muted); line-height: 1.5;">${catchesText}</div>` : ''}
        </div>`;
    });

    container.innerHTML = filteredHtml || `<div style="text-align:center; padding:20px; color:var(--text-muted);">No matching participants found.</div>`;

    let actionBtnHtml = '';
    if (isAnnounced) {
        actionBtnHtml = `<button onclick="startEventNow()" class="success" style="flex: 1;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Event</button>`;
    } else if (!isFinished) {
        actionBtnHtml = `<button id="btnFinishEvent" onclick="promptFinishEvent()" class="danger" style="flex: 1;">Finish Event</button>`;
    } else {
        actionBtnHtml = `<button disabled class="danger" style="flex: 1;">Event Finished</button>`;
    }

    document.getElementById("bottomActionBarButtons").innerHTML = `
        <button onclick="downloadChart()" class="secondary icon-btn" style="padding: 14px; margin-right: 8px;">${svgDownload}</button>
        ${actionBtnHtml}
        <button onclick="saveCurrentEvent(true)" class="primary" style="flex: 1; margin-left: 8px;">Done / Exit</button>
    `;

    renderLeaderboard();
}

function renderLeaderboard() {
    let mode = document.getElementById("rankingMode").value;
    let topSummaryContainer = document.getElementById("leaderboardTopSummary"); 
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let processed = (currentEvent.participants||[]).map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; let maxFishAbbr = "";
        let validCatches = (p.catches||[]).filter(c => c.size > 0);
        let countedCatches = currentEvent.limitType === 'top5' ? [...validCatches].sort((a,b) => b.size - a.size).slice(0,5) : validCatches;

        countedCatches.forEach(c => {
            totalMeasure += c.size;
            if (c.size > maxFishMeasure) { maxFishMeasure = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, currentEvent.species, currentEvent.measureType);
        });
        
        let penPts = 0;
        if(p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;

        return { name: p.name, totalMeasure, totalPts, maxFishMeasure, maxFishAbbr, amountCatches: countedCatches.length, penPts, hasPenalty: penPts > 0 };
    });

    let sortedByMain = [...processed].sort((a, b) => mode === 'points' ? b.totalPts - a.totalPts : b.totalMeasure - a.totalMeasure);
    let sortedByBiggest = [...processed].sort((a, b) => b.maxFishMeasure - a.maxFishMeasure);

    if (sortedByBiggest.length > 0 && sortedByBiggest[0].maxFishMeasure > 0) {
        topSummaryContainer.innerHTML = `
            <div class="flex flex-between">
                <div>
                    <div style="font-size:12px; color:#b45309; font-weight:700; text-transform:uppercase;">${svgTrophy} Biggest Catch</div>
                    <div style="font-weight:700; font-size:16px; color:var(--text-main); margin-top:4px;">${escapeHTML(sortedByBiggest[0].name)}</div>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:18px; font-weight:800; color:var(--text-main);">${sortedByBiggest[0].maxFishMeasure}</span> ${unitText}
                    <div class="badge" style="background:#fef08a; color:#b45309; margin-left:4px;">${escapeHTML(sortedByBiggest[0].maxFishAbbr)}</div>
                </div>
            </div>`;
        topSummaryContainer.classList.remove('hidden');
    } else { topSummaryContainer.classList.add('hidden'); }

    let html = `<table><tr><th style="width:40px;">#</th><th>Name</th><th>Pts</th><th>Total</th><th>Amt</th><th>Max</th></tr>`;
    sortedByMain.forEach((p, idx) => {
        let placeBadge = (idx === 0) ? "1st" : (idx === 1) ? "2nd" : (idx === 2) ? "3rd" : `${idx + 1}`;
        let maxDisplay = p.maxFishMeasure > 0 ? `${p.maxFishMeasure}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${escapeHTML(p.maxFishAbbr)}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;" title="-${p.penPts} pts">${svgWarning}</span>` : '';
        html += `<tr>
            <td style="font-weight:bold; text-align:center;">${placeBadge}</td>
            <td style="font-weight:600; white-space:nowrap;">${escapeHTML(p.name)}${penMarker}</td>
            <td style="color:var(--primary); font-weight:700;">${p.totalPts.toFixed(1)}</td>
            <td>${p.totalMeasure.toFixed(1)}</td>
            <td>${p.amountCatches}</td>
            <td>${maxDisplay}</td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById("leaderboardContainer").innerHTML = html;
}

// Native HTML2PDF Engine (Includes Sponsor Banner & Custom Payouts)
async function downloadChart(eventId = null) {
    let ev = currentEvent;
    if (eventId) { 
        let found = loadedEvents.find(e => e.id === eventId); 
        if (found) ev = found.details; 
    }
    if (!ev || !ev.participants || ev.participants.length === 0) { 
        alert("No data to download."); 
        return; 
    }

    showSaveStatus("Generating PDF...", "#f59e0b");

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');

    let processed = ev.participants.map(p => {
        let totalCm = 0, totalPts = 0, maxFishCm = 0, maxFishAbbr = "";
        let validCatches = (p.catches||[]).filter(c => c.size > 0);
        let countedCatches = ev.limitType === 'top5' ? [...validCatches].sort((a,b)=>b.size-a.size).slice(0,5) : validCatches;
        
        countedCatches.forEach(c => {
            totalCm += c.size;
            if (c.size > maxFishCm) { 
                maxFishCm = c.size; 
                maxFishAbbr = c.abbr ? c.abbr.toUpperCase() : ""; 
            }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species, ev.measureType);
        });
        
        let penPts = 0; 
        let penStr = "";
        if (p.penalties && p.penalties.length > 0) {
            p.penalties.forEach(pn => penPts += parseFloat(pn.points));
            penStr = ` (-${penPts} pts)`;
        }
        totalPts -= penPts;

        let allCatchesStr = validCatches.map(c => `${c.size}${unitText} ${(c.abbr || '').toUpperCase()}`).join(', ') || "-";
        return { 
            name: p.name, 
            totalCm, 
            totalPts, 
            maxFishCm, 
            maxFishAbbr, 
            amountCatches: countedCatches.length, 
            allCatchesStr, 
            penStr 
        };
    });

    processed.sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
        return b.maxFishCm - a.maxFishCm; 
    });

    let pay = calculatePayoutBreakdown(ev);
    let pdfSponsors = getEventSponsors(ev);
    let sponsorHeader = pdfSponsors.length > 0 ? `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:12px 16px; border-radius:10px; margin-bottom:16px;">
            <div style="font-size:10px; color:#64748b; text-transform:uppercase; font-weight:700; margin-bottom:8px;">${pdfSponsors.length > 1 ? 'Official Event Sponsors' : 'Official Event Sponsor'}</div>
            <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center;">
                ${pdfSponsors.map(sp => `
                    <div style="display:flex; align-items:center; gap:10px; background:#ffffff; border:1px solid #e2e8f0; padding:6px 12px; border-radius:8px;">
                        ${sp.logo ? `<img src="${sp.logo}" style="max-height:38px; max-width:110px; object-fit:contain;">` : ''}
                        ${sp.name ? `<span style="font-size:15px; font-weight:800; color:#0f172a;">${escapeHTML(sp.name)}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>` : '';

    let payoutSub = pay.hasPayouts ? ` | Prize Pool: $${pay.totalPot.toFixed(0)} (1st: $${pay.first.toFixed(0)}, 2nd: $${pay.second.toFixed(0)}, 3rd: $${pay.third.toFixed(0)}, Big Fish: $${pay.bigFish.toFixed(0)})` : '';

    let container = document.createElement('div');
    container.style.width = '1000px';
    container.style.padding = '30px';
    container.style.background = '#ffffff';
    container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
    container.style.color = '#0f172a';

    container.innerHTML = `
        ${sponsorHeader}
        <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; color: #000000; font-size: 24px; font-weight: 700;">Tournament Results: ${escapeHTML(ev.name)}</h2>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Generated on: ${new Date().toLocaleDateString()}${payoutSub}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
                <tr style="background: #000000; color: #ffffff;">
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 45px; text-align: center;">Place</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 180px;">Name</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 85px;">Points</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 80px;">Total ${unitText.toUpperCase()}</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 50px; text-align: center;">Amt</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 100px;">Biggest Fish</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff;">Details</th>
                </tr>
            </thead>
            <tbody>
                ${processed.map((p, i) => `
                    <tr style="${i % 2 === 0 ? 'background: #f8fafc;' : 'background: #ffffff;'} page-break-inside: avoid; break-inside: avoid;">
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 700; text-align: center;">${i + 1}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">${escapeHTML(p.name)}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; color: #000000; font-weight: 700;">${p.totalPts.toFixed(1)}${p.penStr ? `<br><span style="color:#e11d48; font-size:11px;">${p.penStr}</span>` : ''}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.totalCm.toFixed(1)}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${p.amountCatches}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.maxFishCm > 0 ? `${p.maxFishCm}${unitText} ${escapeHTML(p.maxFishAbbr)}` : '-'}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 12px; line-height: 1.4;">${escapeHTML(p.allCatchesStr)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const opt = {
        margin: [25, 20, 25, 20],
        filename: `${(ev.name || 'tournament').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt', format: 'letter', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(container).save();
        showSaveStatus("✓ PDF Ready", "#10b981");
    } catch(err) {
        console.error("PDF Export error:", err);
        showSaveStatus("✕ Error", "#ef4444");
    }
}

async function downloadPhotosZip(eventId) {
    let evData = loadedEvents.find(e => e.id === eventId);
    if (!evData || evData.details.eventType !== 'cpr') return;
    let ev = evData.details;

    let zip = new JSZip();
    let hasPhotos = false;
    
    ev.participants.forEach(p => {
        (p.catches || []).forEach((c, idx) => {
            if (c.photo) {
                hasPhotos = true;
                let base64Data = c.photo.split(',')[1];
                let fileName = `${p.name.replace(/[^a-z0-9]/gi, '_')}_${c.abbr}_${c.size}_catch${idx+1}.jpg`;
                zip.file(fileName, base64Data, {base64: true});
            }
        });
    });
    
    if (!hasPhotos) {
        alert("No photos found in this event.");
        return;
    }
    
    let content = await zip.generateAsync({type:"blob"});
    let link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${ev.name.replace(/[^a-z0-9]/gi, '_')}_Photos.zip`;
    link.click();
}

async function downloadSeasonChart() {
    if (!isUserPro()) {
        openUpgradeModal("Season-Long Angler of the Year (AOTY) PDF exports require the PRO Club SaaS Plan.");
        return;
    }
    let rankedFinishedEvents = loadedEvents.filter(e => {
        let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
        let status = e.details.status || 'finished';
        return eYear === String(selectedYear) && e.details.isRanked !== false && status === 'finished';
    });

    if (rankedFinishedEvents.length === 0) {
        alert("No finished ranked tournaments found for this season.");
        return;
    }

    showSaveStatus("Generating PDF...", "#f59e0b");

    let yearlyAgg = {};
    rankedFinishedEvents.forEach(ev => {
        let placements = getEventPlacements(ev.details);
        Object.keys(placements).forEach(normName => {
            if (!yearlyAgg[normName]) {
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
        if (aEvents !== bEvents) return bEvents - aEvents; 
        return a.totalRankPts - b.totalRankPts; 
    });

    let container = document.createElement('div');
    container.style.width = '750px';
    container.style.padding = '30px';
    container.style.background = '#ffffff';
    container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
    container.style.color = '#0f172a';

    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; color: #000000; font-size: 24px; font-weight: 700;">Season Results ${selectedYear}</h2>
            <p style="margin: 0; font-size: 13px; color: #64748b;">Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
                <tr style="background: #000000; color: #ffffff;">
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 45px; text-align: center;">Place</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 200px;">Name</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 110px; text-align: center;">Rank Pts (Best 5)</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff; width: 90px; text-align: center;">Tournaments Played</th>
                    <th style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #ffffff;">All Placements</th>
                </tr>
            </thead>
            <tbody>
                ${aotyArray.map((p, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #f8fafc;' : 'background: #ffffff;'} page-break-inside: avoid; break-inside: avoid;">
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 700; text-align: center;">${index + 1}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">${escapeHTML(p.name)}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; color: #000000; font-weight: 700; text-align: center;">${p.totalRankPts}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${p.validEventsCount}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${escapeHTML(p.allScoresStr)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const opt = {
        margin: [25, 20, 25, 20],
        filename: `season_${selectedYear}_results.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(container).save();
        showSaveStatus("✓ PDF Ready", "#10b981");
    } catch(err) {
        console.error("PDF Export error:", err);
        showSaveStatus("✕ Error", "#ef4444");
    }
}

// RESTORE HUB SESSION & INITIALIZATION
let savedUser = localStorage.getItem("lureboard_hub_session_user");
let savedData = localStorage.getItem("lureboard_hub_session_data");

if (savedUser && savedData) {
    try {
        loggedInUser = savedUser;
        loggedInUserData = JSON.parse(savedData);
        if (loggedInUserData.credits === undefined) loggedInUserData.credits = 50;
        if (!loggedInUserData.plan) loggedInUserData.plan = 'free';
    } catch(e) {
        loggedInUser = "";
        loggedInUserData = null;
    }
}

updateUIAfterAuth();

// Hydrate cached public events from sessionStorage for instant mobile refresh rendering
try {
    let cachedEventsJson = sessionStorage.getItem("lureboard_hub_events_cache");
    if (cachedEventsJson) {
        let parsedCache = JSON.parse(cachedEventsJson);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
            allPublicEvents = parsedCache;
            if (loggedInUser) {
                loadedEvents = parsedCache.filter(d => d.username === loggedInUser);
            }
        }
    }
} catch (e) {}

hideAllSections();
renderPublicHub();

let initParams = new URLSearchParams(window.location.search);
let initSavedView = "";
let initSavedEvent = "";
try {
    initSavedView = sessionStorage.getItem("lureboard_hub_active_view") || "";
    initSavedEvent = sessionStorage.getItem("lureboard_hub_active_event") || "";
} catch (e) {}

let initTargetEventId = initParams.get("event") || (initSavedView === "publicEventSection" ? initSavedEvent : "");

if (initTargetEventId && allPublicEvents.some(e => e.id === initTargetEventId)) {
    initialDeepLinkHandled = true;
    openPublicEvent(initTargetEventId, false);
} else if (initSavedView === "myEventsSection" && loggedInUser) {
    document.getElementById("myEventsSection").classList.remove("hidden");
    history.replaceState({view: 'myEventsSection'}, "", window.location.pathname);
    processDashboard();
} else {
    document.getElementById("dashboardSection").classList.remove("hidden");
    if (!initTargetEventId) {
        history.replaceState({view: 'dashboardSection'}, "", window.location.pathname);
    }
}

subscribeToEventsRealtime();
