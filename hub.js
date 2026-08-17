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
let loggedInUserData = null; 
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
let tempProfileAvatarBase64 = "";

const translations = {
    en: {
        login_title: "Login", login_desc: "Enter your credentials.", username: "Username", password: "Password", login_btn: "Login",
        register_title: "Register", full_name: "Full Name", dob: "Date of Birth", role_part: "Participant", role_org: "Organization",
        register_btn: "Create Account", go_register: "Don't have an account? Register", go_login: "Already have an account? Login",
        your_events: "Your Events", logout: "Logout", create_event: "+ Create New Event", step1_title: "Step 1: Setup", back: "← Back", client_area: "Client Area", public_hub: "Public Hub", my_events: "My Events",
        tourn_name: "Tournament Name", ranked_tourn: "Ranked Tournament", ranked_desc: "Include in Yearly Leaderboard (Max 7/year)", bulk_part: "Participants List",
        bulk_desc: "Paste names. Symbols/brackets are auto-removed.", fish_species_title: "Species & Multipliers", add_species: "+ Add Species", next_btn: "Next",
        hub_title: "Tournament Hub", edit_setup: "← Setup", manage_part: "Participants", add_new: "+ Add", leaderboard: "Leaderboard", mode_pts: "Rank by Points",
        mode_cm: "Rank by Size/Weight", save_event: "Save Event", finish_event: "Finish Event", start_event: "Start Event", modal_add_title: "Add New Participant", close: "Cancel", add: "Add",
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
        for_me: "For Me", for_friend: "For a Friend", friend_name: "Friend's Full Name", friend_dob: "Friend's DOB", show_all: "Show Full Leaderboard", hide_all: "Hide Full Leaderboard",
        profile: "Profile", events: "Events", save_profile: "Save Profile", change_picture: "Change Picture"
    },
    ka: { 
        login_title: "შესვლა", go_register: "რეგისტრაცია", public_hub: "საჯარო ჰაბი", client_area: "კლიენტის სივრცე", status_announced: "გამოცხადდა",
        profile: "პროფილი", events: "ტურნირები", save_profile: "შენახვა", change_picture: "სურათის შეცვლა"
    }
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
    if(!document.getElementById("myEventsView").classList.contains("hidden") && loadedEvents.length > 0) processDashboard();
    if(!document.getElementById("publicEventModal").classList.contains("hidden")) renderPublicLeaderboardList(allPublicEvents.find(e => e.id === currentParticipationEventId)?.details);
    if(!document.getElementById("publicHubView").classList.contains("hidden")) renderPublicHub();
}

function t(key) { return translations[currentLang] ? (translations[currentLang][key] || translations['en'][key] || key) : key; }

function getMyName() {
    return (loggedInUserData && loggedInUserData.fullName) ? loggedInUserData.fullName : loggedInUser;
}

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
    let view = (event.state && event.state.view) ? event.state.view : "publicHubView";
    
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    document.getElementById("profileSection").classList.add("hidden");
    document.getElementById("publicHubView").classList.add("hidden");
    
    if (view === 'profileSection') {
        document.getElementById("profileSection").classList.remove("hidden");
        if (event.state && event.state.sub === 'events') {
            switchProfileTab('events');
        } else {
            switchProfileTab('profile');
        }
    } else {
        let target = document.getElementById(view);
        if(target) target.classList.remove("hidden");
    }
    
    window.scrollTo(0, 0);
});

// NAVIGATION LOGIC
function showPublicHub() {
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    document.getElementById("profileSection").classList.add("hidden");
    
    document.getElementById("publicHubView").classList.remove("hidden");
    
    history.pushState({view: 'publicHubView'}, "");
    renderPublicHub();
}

function showProfilePage() {
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
    document.getElementById("publicHubView").classList.add("hidden");
    
    document.getElementById("profileSection").classList.remove("hidden");
    
    if (loggedInUserData && loggedInUserData.role === 'organization') {
        document.getElementById("tabMyEvents").style.display = "block";
        document.getElementById("btnCreateEvent").style.display = "flex";
    } else {
        document.getElementById("tabMyEvents").style.display = "none";
        document.getElementById("btnCreateEvent").style.display = "none";
    }

    document.getElementById("profUsername").value = loggedInUser;
    document.getElementById("profFullName").value = loggedInUserData.fullName || "";
    document.getElementById("profDob").value = loggedInUserData.dob || "";
    document.getElementById("profPassword").value = "";
    document.getElementById("profileAvatarPreview").src = loggedInUserData.avatar || "https://via.placeholder.com/100";
    tempProfileAvatarBase64 = "";

    switchProfileTab('profile');
    history.pushState({view: 'profileSection', sub: 'profile'}, "");
}

function switchProfileTab(tab) {
    document.getElementById("tabProfile").classList.remove("active");
    document.getElementById("tabMyEvents").classList.remove("active");
    document.getElementById("profileView").classList.add("hidden");
    document.getElementById("myEventsView").classList.add("hidden");

    if (tab === 'events') {
        document.getElementById("tabMyEvents").classList.add("active");
        document.getElementById("myEventsView").classList.remove("hidden");
        processDashboard(); 
        history.replaceState({view: 'profileSection', sub: 'events'}, "");
    } else {
        document.getElementById("tabProfile").classList.add("active");
        document.getElementById("profileView").classList.remove("hidden");
        history.replaceState({view: 'profileSection', sub: 'profile'}, "");
    }
}

// PROFILE AVATAR LOGIC
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

function saveProfile() {
    let newName = document.getElementById("profFullName").value.trim();
    let newDob = document.getElementById("profDob").value;
    let newPass = document.getElementById("profPassword").value.trim();
    
    let updateData = { fullName: newName, dob: newDob };
    if (newPass) updateData.password = newPass;
    if (tempProfileAvatarBase64) updateData.avatar = tempProfileAvatarBase64;

    db.collection("users").doc(loggedInUser).update(updateData).then(() => {
        loggedInUserData = { ...loggedInUserData, ...updateData };
        document.getElementById("headerAvatar").src = loggedInUserData.avatar || "https://via.placeholder.com/40";
        document.getElementById("profPassword").value = "";
        alert("Profile saved successfully!");
    }).catch(err => {
        console.error("Error updating profile: ", err);
        alert("Failed to save profile. Ensure database connection is stable.");
    });
}

function handleClientAreaClick() {
    if (loggedInUser) showProfilePage();
    else openLogin();
}

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
        alert("Registration Error: " + err.message);
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
        alert("Login Error: " + err.message);
    });
}

function loginSuccess(user, data) {
    loggedInUser = user;
    loggedInUserData = data;
    
    document.getElementById("headerLoginBtn").classList.add("hidden");
    document.getElementById("headerLogoutBtn").classList.remove("hidden");
    
    let avatarEl = document.getElementById("headerAvatar");
    avatarEl.style.display = "block";
    avatarEl.src = data.avatar || "https://via.placeholder.com/40";

    showProfilePage();
    subscribeToEventsRealtime();
}

function handleLogout() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    loggedInUser = "";
    loggedInUserData = null;
    
    document.getElementById("headerLoginBtn").classList.remove("hidden");
    document.getElementById("headerAvatar").style.display = "none";
    document.getElementById("headerLogoutBtn").classList.add("hidden");
    
    showPublicHub();
    subscribeToEventsRealtime(); 
}

function openLogin() {
    document.getElementById("publicHubView").classList.add("hidden");
    document.getElementById("profileSection").classList.add("hidden");
    document.getElementById("participateSection").classList.add("hidden");
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
            
            if (loggedInUser && data.username === loggedInUser) {
                loadedEvents.push(data);
            }
            
            let isPub = data.details && data.details.isPublic;
            if (isPub === true || isPub === "true") {
                allPublicEvents.push(data);
            }
        });
        
        if (loggedInUser && !document.getElementById("myEventsView").classList.contains("hidden")) {
            processDashboard();
        }
        if (!document.getElementById("publicHubView").classList.contains("hidden")) {
            renderPublicHub();
        }

        if (currentEvent && !document.getElementById("hubSection").classList.contains("hidden")) {
            let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id);
            if (activeUpdated) {
                currentEvent = activeUpdated.details;
                renderHubUI();
            }
        }
    }, error => {
        console.error("Firebase Read Error: ", error);
        alert("Database connection failed. Please ensure your Firebase security rules allow reading.");
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

function renderPublicHub() {
    let container = document.getElementById("publicEventsList");
    if (allPublicEvents.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--text-muted);">No public tournaments right now.</div>`;
        return;
    }

    allPublicEvents.sort((a, b) => b.id.localeCompare(a.id));
    let html = "";
    allPublicEvents.forEach(ev => {
        let pList = ev.details.participants || [];
        let pCount = pList.length;
        let cCount = pList.reduce((sum, p) => sum + (p.catches || []).length, 0);
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
    let processed = (evDetails.participants || []).map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; 
        let countedCatches = evDetails.limitType === 'top5' ? [...(p.catches||[])].sort((a,b)=>b.size-a.size).slice(0,5) : (p.catches||[]);
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
                <div style="font-size:13px; color:var(--text-muted); font-weight:500;">📅 ${publishDate} • ${(ev.details.participants||[]).length} Participants</div>
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

function openEventEditor(eventObj = null) {
    document.getElementById("profileSection").classList.add("hidden");
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
        document.getElementById("bulkParticipantsInput").value = (currentEvent.participants||[]).map(p => p.name).join("\n");
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

function goToEventHub() {
    currentEvent.name = document.getElementById("eventNameInput").value.trim() || "Untitled Event";
    currentEvent.description = document.getElementById("eventDescInput").value.trim();
    currentEvent.isPublic = document.getElementById("isPublicToggle").checked;
    currentEvent.status = document.getElementById("eventStatusSelect").value;
    let wantsRanked = document.getElementById("isRankedToggle").checked;
    
    let thumbSrc = document.getElementById('thumbnailPreview').src;
    if(thumbSrc && thumbSrc.startsWith('data:')) currentEvent.thumbnail = thumbSrc;

    currentEvent.unit = confUnit;
    currentEvent.measureType = confMeasure;
    currentEvent.limitType = confLimit;
    
    if(!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();

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

    let items = parseParticipants(document.getElementById("bulkParticipantsInput").value);
    let existingMap = {};
    (currentEvent.participants||[]).forEach(p => existingMap[p.name.toLowerCase()] = { catches: p.catches, id: p.id, penalties: p.penalties || [], registeredBy: p.registeredBy });

    currentEvent.participants = items.map(name => {
        let lowerName = name.toLowerCase();
        return {
            id: existingMap[lowerName] ? existingMap[lowerName].id : 'p_' + Math.random().toString(36).substr(2, 9),
            name: name,
            catches: existingMap[lowerName] ? existingMap[lowerName].catches : [],
            penalties: existingMap[lowerName] ? existingMap[lowerName].penalties : [],
            registeredBy: existingMap[lowerName] ? existingMap[lowerName].registeredBy : loggedInUser
        };
    });
    
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

function startEventNow() {
    if (confirm("Start the event? This will lock the participant list and allow scoring.")) {
        currentEvent.status = 'ongoing';
        saveCurrentEvent(false);
        renderHubUI();
    }
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
    items.forEach(name => currentEvent.participants.push({ id: 'p_'+Math.random().toString(36).substr(2,9), name: name, catches: [], penalties: [], registeredBy: loggedInUser }));
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
    if(currentEvent.status !== 'ongoing') return;
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
    if ((p.catches||[]).length === 0) { container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); text-align:center;">${t('no_catches')}</p>`; return; }
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');
    container.innerHTML = `<label style="font-size:13px; color:var(--text-muted); margin-bottom:8px; display:block;">${t('current_catches')}:</label>` + 
        p.catches.map((c, cIdx) => `
        <div class="flex flex-between" style="padding:12px 0; border-bottom:1px solid var(--border);">
            <span><b>${c.size}</b>${unitText} <span class="badge" style="background:#f1f5f9; box-shadow:none;">${c.abbr.toUpperCase()}</span></span>
            <button class="danger icon-btn" style="padding:6px 10px; box-shadow:none;" onclick="removeFish(${activeFishParticipantIndex}, ${cIdx})">✕</button>
        </div>`).join('');
}

function openPenaltyModal(pIndexReal) {
    if(currentEvent.status !== 'ongoing') return;
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
    let isAnnounced = currentEvent.status === 'announced';
    
    document.getElementById("hubAddNewParticipantBtn").style.display = (isFinished) ? "none" : "block";

    let query = document.getElementById("searchParticipant").value.toLowerCase();
    let container = document.getElementById("participantsHubContainer");
    let addRemoveText = t("add_remove_fish");

    let countEl = document.getElementById("hubParticipantCount");
    if(countEl) countEl.innerText = (currentEvent.participants||[]).length;

    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let filteredHtml = "";
    (currentEvent.participants||[]).forEach((p, pIndexReal) => {
        if (!p.name.toLowerCase().includes(query)) return;

        let catchesText = (p.catches||[]).length > 0 
            ? p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') 
            : `<span style="color:var(--text-muted); opacity: 0.7; font-style:italic;">${t('no_catches')}</span>`;

        let penBadge = (p.penalties && p.penalties.length > 0) ? `<button onclick="showPenaltyReason(${pIndexReal})" class="danger icon-btn" style="padding:2px 6px; border-radius:50%; box-shadow:none; font-size:10px;" title="Has Penalties">❗</button>` : '';

        let actionButtons = '';
        if (isFinished) {
            actionButtons = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Locked</span>`;
        } else if (isAnnounced) {
            actionButtons = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Announced</span>`;
        } else {
            actionButtons = `
                <button onclick="openPenaltyModal(${pIndexReal})" class="secondary icon-btn" style="padding:10px; box-shadow:none;" title="Add Penalty">⚖️</button>
                <button onclick="openFishModal(${pIndexReal})" class="icon-btn primary-dark" style="padding:10px 16px;">${addRemoveText}</button>
            `;
        }

        let editBtn = isFinished ? '' : `<button onclick="editParticipantName(${pIndexReal})" class="icon-btn" style="padding:4px; background:transparent; color:var(--text-muted); box-shadow:none;">✏️</button>`;

        filteredHtml += `
        <div class="card" style="padding:16px; margin-bottom:16px;">
            <div class="flex flex-between" style="align-items:center;">
                <div class="flex" style="gap: 8px;">
                    <b style="font-size:16px;">${pIndexReal + 1}. ${p.name}</b> ${penBadge} ${editBtn}
                </div>
                <div class="flex">${actionButtons}</div>
            </div>
            ${!isAnnounced ? `<div style="margin-top:16px; font-size:14px; color:var(--text-muted); line-height: 1.5;">${catchesText}</div>` : ''}
        </div>`;
    });

    container.innerHTML = filteredHtml || `<div style="text-align:center; padding:20px; color:var(--text-muted);">No matching participants found.</div>`;

    let actionBtnHtml = '';
    if (isAnnounced) {
        actionBtnHtml = `<button onclick="startEventNow()" class="success" style="flex: 1; padding:12px;" data-i18n="start_event">Start Event</button>`;
    } else if (!isFinished) {
        actionBtnHtml = `<button id="btnFinishEvent" onclick="promptFinishEvent()" class="danger" style="flex: 1; padding:12px;" data-i18n="finish_event">Finish Event</button>`;
    } else {
        actionBtnHtml = `<button disabled class="danger" style="flex: 1; padding:12px;" data-i18n="status_finished">Event Finished</button>`;
    }

    document.getElementById("bottomActionBarButtons").innerHTML = `
        <a href="javascript:void(0)" onclick="downloadChart()" data-i18n="download_chart" style="color: var(--text-muted); font-size: 14px; font-weight: 600; text-decoration: underline; flex-shrink: 0; padding: 0 8px;">PDF</a>
        ${actionBtnHtml}
        <button onclick="saveCurrentEvent(true)" class="primary-dark" data-i18n="save_event" style="flex: 1; padding:12px;">Save Event</button>
    `;

    renderLeaderboard();
}

function renderLeaderboard() {
    let mode = document.getElementById("rankingMode").value;
    let topSummaryContainer = document.getElementById("leaderboardTopSummary"); 
    
    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let processed = (currentEvent.participants||[]).map(p => {
        let totalMeasure = 0; let totalPts = 0; let maxFishMeasure = 0; let maxFishAbbr = "";
        let countedCatches = currentEvent.limitType === 'top5' ? [...(p.catches||[])].sort((a,b) => b.size - a.size).slice(0,5) : (p.catches||[]);

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
    document.getElementById("leaderboardContainer").innerHTML = html;
}

function saveCurrentEvent(redirect = true) {
    if (!currentEvent.date) currentEvent.date = new Date().toLocaleDateString();
    if (!currentEvent.year) currentEvent.year = new Date().getFullYear().toString();

    const eventPayload = { username: loggedInUser, name: currentEvent.name, details: currentEvent, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    localStorage.setItem("lureboard_defaults_" + loggedInUser, JSON.stringify(currentEvent.species));

    db.collection("events").doc(currentEvent.id).set(eventPayload).then(() => { 
        if(redirect) showMyEvents(); 
    }).catch(err => { 
        console.error("Save error:", err); 
        alert("Failed to save event to cloud. Check internet connection."); 
    });
}

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
    let rankedFinishedEvents = loadedEvents.filter(e => {
        let eYear = String(e.details.year || (e.details.date ? e.details.date.split('.').pop().split('/').pop().slice(-4) : new Date().getFullYear().toString()));
        let status = e.details.status || 'finished';
        return eYear === String(selectedYear) && e.details.isRanked !== false && status === 'finished';
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

document.getElementById("loginSection").classList.add("hidden");
document.getElementById("registerSection").classList.add("hidden");
document.getElementById("dashboardSection").classList.remove("hidden");
document.getElementById("myEventsView").classList.add("hidden");
document.getElementById("publicHubView").classList.remove("hidden");

history.replaceState({view: 'dashboardSection', sub: 'public'}, "");
subscribeToEventsRealtime();
