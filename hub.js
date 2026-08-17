// =========================================================================
// FIREBASE REALTIME CLOUD DATABASE CONFIGURATION
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyD0uXVP6iALWh2ADcn3jjb6zMBCAzOAUtk",
    authDomain: "lureboard-13c15.firebaseapp.com",
    databaseURL: "https://lureboard-13c15-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lureboard-13c15",
    storageBucket: "lureboard-13c15.firebasestorage.app",
    messagingSenderId: "807956356939",
    appId: "1:807956356939:web:af22328840dc388eb312ce"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let unsubscribeEventsListener = null;

let currentEvent = null;
let loggedInUser = "";
let loggedInUserData = null; // Stores full user object (role, name, etc.)
let loadedEvents = [];     
let allPublicEvents = [];  

let activeFishParticipantIndex = null;
let activePenaltyParticipantIndex = null;
let activeSpeciesIndex = null;
let selectedModalSpecies = "";
let pendingSmallFish = null;

let currentLang = "en";
let selectedYear = new Date().getFullYear().toString();

let confUnit = 'metric';
let confMeasure = 'size';
let confLimit = 'all';

let currentParticipationEventId = null;
let isForMe = true;
let isLeaderboardExpanded = false;
let regRoleSelect = 'participant';

const translations = {
    en: {
        login_title: "Login", login_desc: "Enter your credentials.", username: "Username", password: "Password", login_btn: "Login",
        register_title: "Register", full_name: "Full Name (Name & Surname)", dob: "Date of Birth", role_part: "Participant", role_org: "Organization",
        register_btn: "Create Account", go_register: "Don't have an account? Register", go_login: "Already have an account? Login",
        your_events: "Your Events", logout: "Logout", create_event: "+ Create New Event", step1_title: "Step 1: Setup", back: "← Back", client_area: "Client Area", public_hub: "Public Hub", my_events: "My Events",
        tourn_name: "Tournament Name", ranked_tourn: "Ranked Tournament", ranked_desc: "Include in Yearly Leaderboard (Max 7/year)", bulk_part: "Participants List",
        bulk_desc: "Paste names. Symbols/brackets are auto-removed.", fish_species_title: "Species & Multipliers", add_species: "+ Add Species", next_btn: "Next",
        hub_title: "Tournament Hub", edit_setup: "← Setup", manage_part: "Participants", add_new: "+ Add", leaderboard: "Leaderboard", mode_pts: "Rank by Points",
        mode_cm: "Rank by Size/Weight", save_event: "Save Event", finish_event: "Finish Event", modal_add_title: "Add New Participant", close: "Cancel", add: "Add",
        add_remove_fish: "Add / Remove Catch", species_sel: "Species", size_cm: "Measurement", save: "Save", add_fish_btn: "+ Add Catch", edit_rules: "Edit Rules",
        add_rule: "+ Add New Rule", done: "Done", rule_from: "From", rule_to: "To", rule_mult: "Multiplier", download_chart: "PDF", download_season_pdf: "Season PDF",
        season_results: "Season Results", current_catches: "Current Catches", no_catches: "No catches logged.", too_small_title: "Fish Too Small", 
        too_small_desc: "The fish is too small based on the rules.", ok: "OK", ignore: "Ignore", angler_of_year: "Angler of the Year", edit_name: "Edit Name", 
        unranked_badge: "UNRANKED", rank_pts: "Rank Pts", tournaments: "tournaments", editing_disabled: "Editing this is disabled, please edit participant list on the next page",
        finish_warning: "If you finish the event now you will not be able to change anything anymore and the event will be officially finished.",
        status_announced: "Announced", status_finished: "Finished", status_ongoing: "Ongoing", event_status: "Event Status",
        place: "Place", name: "Name", points: "Points", total_cm: "Total", biggest_fish: "Biggest", details: "Details", generated_on: "Generated on", 
        tournament_results: "Tournament Results", rank_pts_best5: "Rank Pts (Best 5)", tournaments_played: "Tournaments Played", all_placements: "All Placements", sort_newest: "Newest First", sort_oldest: "Oldest First", sort_az: "Name A-Z",
        thumbnail_img: "Thumbnail / Header Image", desc_rules: "Description & Rules", public_desc: "Make visible to everyone", tourn_format: "Tournament Format",
        meas_unit: "Measurement Unit", score_meth: "Scoring Method", catch_lim: "Catch Limits", lim_all: "All Fish", lim_top5: "Top 5 Counted",
        penalties: "Penalties", pts_deduct: "Points to Deduct", reason_desc: "Reason / Description", add_penalty: "+ Add Penalty", part_detailed: "Participants",
        participate_btn: "Participate", join_event: "Join Event", leave_event: "Leave Event", pay_fee: "Pay Participation Fee (50 🪙)", fee_paid: "Fee Paid ✔️",
        for_me: "For Me", for_friend: "For a Friend", friend_name: "Friend's Full Name", friend_dob: "Friend's DOB", show_all: "Show Full Leaderboard", hide_all: "Hide Full Leaderboard"
    },
    // Skipping full translations block to fit within context, you can easily replicate keys for KA, UK, RU, etc. using your previous block format
    // Just ensure the exact keys above exist in all languages. I'll provide a few essential fallbacks.
    ka: { login_title: "შესვლა", go_register: "რეგისტრაცია", public_hub: "საჯარო ჰაბი", client_area: "კლიენტის სივრცე" }
};

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        let key = el.getAttribute("data-i18n");
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        } else if (translations['en'][key]) {
            el.innerText = translations['en'][key];
        }
    });
    if(!document.getElementById("setupSection").classList.contains("hidden")) refreshSetupUI();
    if(!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
    if(!document.getElementById("rulesModal").classList.contains("hidden") && activeSpeciesIndex !== null) renderRules();
    if(!document.getElementById("fishModal").classList.contains("hidden") && activeFishParticipantIndex !== null) renderModalCatches();
    if(!document.getElementById("dashboardSection").classList.contains("hidden") && loadedEvents.length > 0) processDashboard();
    if(!document.getElementById("publicEventModal").classList.contains("hidden")) renderPublicLeaderboardList(allPublicEvents.find(e => e.id === currentParticipationEventId)?.details);
}

function t(key) { return translations[currentLang] ? (translations[currentLang][key] || translations['en'][key] || key) : key; }

function handleOverlayClick(e, modalId) {
    if (e.target.id === modalId) {
        if (modalId === 'participantModal') closeAddParticipantModal();
        if (modalId === 'fishModal') closeFishModal();
        if (modalId === 'penaltyModal') closePenaltyModal();
        if (modalId === 'rulesModal') closeRulesModal();
        if (modalId === 'smallFishWarningModal') cancelSmallFish();
        if (modalId === 'publicEventModal') closePublicEventModal();
    }
}

function parseParticipants(rawText) {
    if (!rawText.trim()) return [];
    let cleaned = rawText.replace(/\([\s\S]*?\)|\[[\s\S]*?\]|\{[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/[0-9!@#$%^&*_+=\-\[\]{};':"\\|.<>\/?~`“”„«»]/g, ' ');
    return cleaned.split(/[\n,]+/).map(n => n.replace(/\s+/g, ' ').trim()).filter(n => n.length > 0);
}

window.addEventListener("popstate", (event) => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    let view = (event.state && event.state.view) ? event.state.view : "dashboardSection";
    
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    
    let target = document.getElementById(view);
    if(target) target.classList.remove("hidden");
    window.scrollTo(0, 0);
});

// AUTHENTICATION
function toggleAuth(view) {
    if(view === 'register') {
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("registerSection").classList.remove("hidden");
    } else {
        document.getElementById("registerSection").classList.add("hidden");
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

    const userRef = db.collection("users").doc(user);
    userRef.get().then(doc => {
        if (doc.exists) {
            alert("Username already taken.");
        } else {
            let data = { password: pass, fullName: fName, dob: dob, role: regRoleSelect, createdAt: new Date() };
            userRef.set(data).then(() => loginSuccess(user, data));
        }
    }).catch(err => {
        console.error(err);
        alert("Database connection error.");
    });
}

function handleLogin() {
    let user = document.getElementById("loginUsername").value.trim().toLowerCase();
    let pass = document.getElementById("loginPassword").value.trim();
    if (!user || !pass) { alert("Please enter both username and password."); return; }

    const userRef = db.collection("users").doc(user);
    userRef.get().then(doc => {
        if (doc.exists && doc.data().password === pass) {
            loginSuccess(user, doc.data());
        } else {
            alert("Incorrect username or password.");
        }
    }).catch(err => {
        console.error(err);
        alert("Database connection error.");
    });
}

function loginSuccess(user, data) {
    loggedInUser = user;
    loggedInUserData = data;
    
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    
    document.getElementById("headerClientAreaBtn").classList.add("hidden");
    document.getElementById("headerLogoutBtn").classList.remove("hidden");
    
    // Role Restrictions
    if (data.role !== 'organization') {
        document.getElementById("btnCreateEvent").style.display = "none";
    } else {
        document.getElementById("btnCreateEvent").style.display = "flex";
    }

    document.getElementById("dashTabs").classList.remove("hidden");
    switchDashboardTab('my');
    
    history.replaceState({view: 'dashboardSection'}, ""); 
    subscribeToEventsRealtime();
}

function handleLogout() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    loggedInUser = "";
    loggedInUserData = null;
    
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("headerClientAreaBtn").classList.remove("hidden");
    document.getElementById("headerLogoutBtn").classList.add("hidden");
    
    document.getElementById("dashTabs").classList.add("hidden");
    switchDashboardTab('public');
    
    history.replaceState({view: 'dashboardSection'}, "");
    subscribeToEventsRealtime(); 
}

function openLogin() {
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'loginSection'}, "");
}

// EVENTS SUBSCRIPTION & DASHBOARD
function subscribeToEventsRealtime() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    
    unsubscribeEventsListener = db.collection("events").onSnapshot(snapshot => {
        loadedEvents = [];
        allPublicEvents = [];
        
        snapshot.forEach(doc => { 
            let data = { id: doc.id, ...doc.data() };
            if (loggedInUser && data.username === loggedInUser) loadedEvents.push(data);
            if (data.details && data.details.isPublic) allPublicEvents.push(data);
        });
        
        if (loggedInUser) processDashboard();
        renderPublicHub();

        if (currentEvent && !document.getElementById("hubSection").classList.contains("hidden")) {
            let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id);
            if (activeUpdated) {
                currentEvent = activeUpdated.details;
                renderHubUI();
            }
        }
    });
}

function switchDashboardTab(tab) {
    document.getElementById("tabBtnPublic").classList.remove("active");
    document.getElementById("tabBtnMy").classList.remove("active");
    document.getElementById("publicHubView").classList.add("hidden");
    document.getElementById("myEventsView").classList.add("hidden");

    if(tab === 'public') {
        document.getElementById("tabBtnPublic").classList.add("active");
        document.getElementById("publicHubView").classList.remove("hidden");
    } else {
        document.getElementById("tabBtnMy").classList.add("active");
        document.getElementById("myEventsView").classList.remove("hidden");
        processDashboard();
    }
}

function getEvTime(ev) { return parseInt(ev.id.replace('ev_', '')) || 0; }

function sortEventsArray(eventsArr, sortMode) {
    return eventsArr.sort((a, b) => {
        if (sortMode === 'newest') return getEvTime(b) - getEvTime(a);
        if (sortMode === 'oldest') return getEvTime(a) - getEvTime(b);
        if (sortMode === 'az') return a.name.localeCompare(b.name);
    });
}

function renderPublicHub() {
    let container = document.getElementById("publicEventsList");
    if (allPublicEvents.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No public tournaments right now.</div>`;
        return;
    }

    allPublicEvents.sort((a, b) => b.id.localeCompare(a.id));
    let html = "";
    allPublicEvents.forEach(ev => {
        let pCount = ev.details.participants.length;
        let cCount = ev.details.participants.reduce((sum, p) => sum + p.catches.length, 0);
        let thumb = ev.details.thumbnail ? `<img src="${ev.details.thumbnail}" class="event-hub-thumb">` : '';
        
        let status = ev.details.status || 'finished';
        let statusColor = status === 'finished' ? 'background:#e2e8f0; color:#475569;' : (status === 'ongoing' ? 'background:#d1fae5; color:#059669;' : 'background:#e0e7ff; color:#3730a3;');
        let statusText = status === 'finished' ? t('status_finished') : (status === 'ongoing' ? t('status_ongoing') : t('status_announced'));

        html += `
        <div class="card" style="padding:16px; cursor:pointer; transition: transform 0.2s;" onclick="openPublicEvent('${ev.id}')">
            ${thumb}
            <div class="flex flex-between" style="align-items:flex-start;">
                <div>
                    <h3 style="margin-bottom:4px;">${ev.name}</h3>
                    <div style="font-size:12px; color:var(--text-muted);">Host: <b>${ev.username}</b></div>
                </div>
                <span class="badge" style="${statusColor} box-shadow:none;">${statusText}</span>
            </div>
            <div style="margin-top:12px; font-size:13px; color:var(--text-muted); display:flex; gap:16px;">
                <span>👥 ${pCount} Participants</span>
                <span>🎣 ${cCount} Catches</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// AOTY Logic
function getEventPlacements(evDetails) {
    let processed = evDetails.participants.map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; 
        let countedCatches = evDetails.limitType === 'top5' ? [...p.catches].sort((a,b)=>b.size-a.size).slice(0,5) : p.catches;
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
        let medals = ["🥇", "🥈", "🥉"];
        let aotyHtml = `<div class="card" style="background: var(--primary-gradient); color: white; border:none; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);">
            <div class="flex flex-between" style="margin-bottom: 16px;">
                <h3 style="color:white; margin:0; font-size:18px;">🏆 ${t('angler_of_year')} (${selectedYear})</h3>
                <a href="javascript:void(0)" onclick="downloadSeasonChart()" style="color: white; font-size: 14px; font-weight: 600; text-decoration: underline; background: transparent; border: none; padding: 4px;">⬇ ${t('download_season_pdf')}</a>
            </div>`;
        
        aotyArray.slice(0, 3).forEach((angler, idx) => {
            aotyHtml += `
            <div class="flex flex-between" style="background: rgba(255,255,255,0.15); padding: 12px 16px; border-radius: 16px; margin-bottom: 8px; backdrop-filter: blur(8px);">
                <div class="flex" style="gap: 12px;">
                    <span style="font-size: 20px; font-weight: bold;">${medals[idx]}</span>
                    <b style="font-size: 16px;">${angler.name}</b>
                </div>
                <div style="text-align:right;">
                    <b style="font-size: 16px;">${angler.totalRankPts} <span style="font-size:12px; font-weight:normal;">${t('rank_pts')}</span></b><br>
                    <span style="font-size:12px; opacity:0.8;">${angler.validEventsCount} ${t('tournaments')}</span>
                </div>
            </div>`;
        });
        aotyHtml += `</div>`;
        aotyContainer.innerHTML = aotyHtml;
        aotyContainer.classList.remove("hidden");
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
        let rankIcon = ev.details.isRanked !== false ? '🏆' : '⚪';
        let rankBadge = ev.details.isRanked === false ? `<span class="badge" style="background:#ffe4e6; color:#be123c; padding:2px 6px; font-size:10px; margin-left:6px; box-shadow:none;">${t('unranked_badge')}</span>` : '';
        
        let status = ev.details.status || 'finished';
        let statusColor = status === 'finished' ? 'background:#e2e8f0; color:#475569;' : (status === 'ongoing' ? 'background:#d1fae5; color:#059669;' : 'background:#e0e7ff; color:#3730a3;');
        let statusText = status === 'finished' ? t('status_finished') : (status === 'ongoing' ? t('status_ongoing') : t('status_announced'));
        let statusBadge = `<span class="badge" style="${statusColor} padding:2px 6px; font-size:10px; margin-left:6px; box-shadow:none;">${statusText}</span>`;

        html += `<div class="card flex flex-between" style="padding: 16px;">
            <div style="flex:1;">
                <div class="flex flex-wrap" style="font-weight:700; margin-bottom:6px; font-size:16px;">
                    <span style="font-size:18px;">${rankIcon}</span> 
                    <span>${ev.name}</span>
                    <div class="flex" style="gap:4px;">
                        ${statusBadge}
                        ${rankBadge}
                    </div>
                </div>
                <div style="font-size:13px; color:var(--text-muted); font-weight:500;">📅 ${publishDate} • ${ev.details.participants.length} Participants</div>
            </div>
            <div class="flex" style="gap:8px; align-items:center;">
                <a href="javascript:void(0)" onclick="downloadChart('${ev.id}')" style="color: var(--text-muted); font-size: 13px; font-weight: 600; text-decoration: underline; margin-right: 4px;">PDF</a>
                <button onclick="editEvent('${ev.id}')" class="icon-btn primary-dark" style="padding:10px 14px; box-shadow:none;">Open</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// SETUP PHASE
function setUnit(u) {
    confUnit = u;
    document.getElementById('unitBtnMetric').className = u === 'metric' ? 'primary-dark' : 'secondary';
    document.getElementById('unitBtnImperial').className = u === 'imperial' ? 'primary-dark' : 'secondary';
}
function setMeasure(m) {
    confMeasure = m;
    document.getElementById('measureBtnSize').className = m === 'size' ? 'primary-dark' : 'secondary';
    document.getElementById('measureBtnWeight').className = m === 'weight' ? 'primary-dark' : 'secondary';
}
function setLimit(l) {
    confLimit = l;
    document.getElementById('limitBtnAll').className = l === 'all' ? 'primary-dark' : 'secondary';
    document.getElementById('limitBtnTop5').className = l === 'top5' ? 'primary-dark' : 'secondary';
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

function showDashboard() {
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'dashboardSection'}, "");
}

function openEventEditor(eventObj = null) {
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("setupSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'setupSection'}, "");

    if (eventObj) {
        currentEvent = JSON.parse(JSON.stringify(eventObj));
        
        document.getElementById("eventNameInput").value = currentEvent.name || "";
        document.getElementById("eventDescInput").value = currentEvent.description || "";
        document.getElementById("isPublicToggle").checked = currentEvent.isPublic === true;
        document.getElementById("isRankedToggle").checked = currentEvent.isRanked !== false;
        document.getElementById("eventStatusSelect").value = currentEvent.status || "ongoing";
        
        if(currentEvent.thumbnail) {
            document.getElementById('thumbnailPreview').src = currentEvent.thumbnail;
            document.getElementById('thumbnailPreview').style.display = 'block';
        } else {
            document.getElementById('thumbnailPreview').style.display = 'none';
            document.getElementById('thumbnailPreview').src = '';
        }

        setUnit(currentEvent.unit || 'metric');
        setMeasure(currentEvent.measureType || 'size');
        setLimit(currentEvent.limitType || 'all');
        document.getElementById("bulkParticipantsInput").value = currentEvent.participants.map(p => p.name).join("\n");
    } else {
        let defaultSpecies = [{ name: "Perch", abbr: "pr", tiers: [{ from: 0, to: "above", multiplier: 1.0 }] }];
        let savedDefaults = localStorage.getItem("lureboard_defaults_" + loggedInUser);
        if (savedDefaults) { try { defaultSpecies = JSON.parse(savedDefaults); } catch(e) {} }
        
        currentEvent = {
            id: "ev_" + Date.now(),
            name: "New Fishing Trip",
            date: new Date().toLocaleDateString(),
            year: new Date().getFullYear().toString(),
            status: "announced",
            isRanked: true,
            isPublic: false,
            isStarted: false,
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
        document.getElementById("isPublicToggle").checked = false;
        document.getElementById("isRankedToggle").checked = true;
        document.getElementById("eventStatusSelect").value = "announced";
        document.getElementById("eventThumbnailInput").value = "";
        document.getElementById('thumbnailPreview').style.display = 'none';
        document.getElementById("bulkParticipantsInput").value = "";
        
        setUnit('metric');
        setMeasure('size');
        setLimit('all');
    }
    updateParticipantCountStatus();
    refreshSetupUI();
}

function updateParticipantCountStatus() {
    let rawText = document.getElementById("bulkParticipantsInput").value;
    document.getElementById("participantCountStatus").innerText = parseParticipants(rawText).length;
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

function refreshSetupUI() {
    let container = document.getElementById("speciesConfigContainer");
    container.innerHTML = currentEvent.species.map((s, sIdx) => {
        let rulesSummary = s.tiers.map(t => {
            let fromVal = t.from === "" ? 0 : t.from;
            let toVal = t.to === 'above' ? '∞' : (t.to === "" ? 0 : t.to);
            let mult = t.multiplier === "" ? "1.0" : parseFloat(t.multiplier).toFixed(1);
            return `${fromVal}-${toVal} ${mult}x`;
        }).join(' | ');

        return `
        <div class="card" style="padding:16px; border:1px solid var(--border); margin-bottom:12px; background:var(--card-bg);">
            <div class="flex flex-between">
                <div>
                    <div class="flex">
                        <b style="font-size:16px; color:var(--text);">${s.name}</b>
                        <span class="badge" style="background:#f1f5f9; color:#0284c7; box-shadow:none;">${s.abbr.toUpperCase()}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:6px; font-weight:600;">${rulesSummary}</div>
                </div>
                <div class="flex">
                    <button class="secondary icon-btn" onclick="openRulesModal(${sIdx})" style="box-shadow:none;">Rules</button>
                    <button class="danger icon-btn" style="padding:6px 10px; box-shadow:none;" onclick="removeSpecies(${sIdx})">✕</button>
                </div>
            </div>
        </div>`;
    }).join("");

    if (currentEvent.isStarted) {
        document.getElementById("bulkParticipantsInput").disabled = true;
        document.getElementById("bulkParticipantsOverlay").classList.remove("hidden");
        document.getElementById("bulkParticipantsOverlay").style.display = "flex";
    } else {
        document.getElementById("bulkParticipantsInput").disabled = false;
        document.getElementById("bulkParticipantsOverlay").classList.add("hidden");
        document.getElementById("bulkParticipantsOverlay").style.display = "none";
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
    document.getElementById('rulesModalTitle').innerText = t('edit_rules') + ': ' + s.name;
    
    let html = '';
    s.tiers.forEach((tData, tIdx) => {
        let prevTo = (tIdx > 0 && s.tiers[tIdx-1].to !== 'above') ? parseFloat(s.tiers[tIdx-1].to) : -1;
        let minFrom = tIdx > 0 ? prevTo + 1 : 0;
        let multOptions = '';
        for(let i = 10; i <= 30; i += 1) { 
            let v = (i/10).toFixed(1);
            multOptions += `<option value="${v}" ${parseFloat(tData.multiplier) === parseFloat(v) ? 'selected' : ''}>${v}x</option>`;
        }
        return `
        <div class="tier-grid" style="position:relative;">
            <button class="danger icon-btn" style="position:absolute; top:-8px; right:-8px; padding:4px 8px; font-size:11px; border-radius:50%; box-shadow:none;" onclick="removeRule(${tIdx})">✕</button>
            <div><label>${t('rule_from')}</label><input type="number" value="${tData.from}" min="${minFrom}" onchange="updateRuleField(${tIdx}, 'from', this.value)"></div>
            <div><label>${t('rule_to')}</label>
                <div style="display:flex; gap:4px;">
                    <select onchange="updateRuleField(${tIdx}, 'toType', this.value)" style="flex:1;">
                        <option value="number" ${tData.to !== 'above' ? 'selected' : ''}>Number</option>
                        <option value="above" ${tData.to === 'above' ? 'selected' : ''}>Above</option>
                    </select>
                    ${tData.to !== 'above' ? `<input type="number" value="${tData.to}" onchange="updateRuleField(${tIdx}, 'to', this.value)" style="flex:1;">` : ''}
                </div>
            </div>
            <div class="full-width"><label>${t('rule_mult')}</label><select onchange="updateRuleField(${tIdx}, 'multiplier', this.value)">${multOptions}</select></div>
        </div>`;
    }).join('');
}
