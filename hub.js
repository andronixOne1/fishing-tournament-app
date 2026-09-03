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
let isLeaderboardExpanded = false;
let regRoleSelect = 'participant';
let tempProfileAvatarBase64 = "";

// Minimal SVGs for replacement
const svgTrophy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M4 9h3"/><path d="M17 9h3"/></svg>`;
const svgCircle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
const svgUsers = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgFish = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="15" cy="12" r="1"/><path d="M2 12c2 2 4 4 6 4s6-2 6-2"/></svg>`;
const svgCal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
const svgDownload = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const svgEdit = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const svgWarning = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

const translations = {
    en: {},
    ka: { login_btn: "შესვლა" }
};

function changeLanguage(lang) {
    currentLang = lang;
    if(!document.getElementById("setupSection").classList.contains("hidden")) refreshSetupUI();
    if(!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
    if(!document.getElementById("rulesModal").classList.contains("hidden") && activeSpeciesIndex !== null) renderRules();
    if(!document.getElementById("fishModal").classList.contains("hidden") && activeFishParticipantIndex !== null) renderModalCatches();
    
    let myEventsView = document.getElementById("myEventsSection");
    if(myEventsView && !myEventsView.classList.contains("hidden")) processDashboard();
    
    let historyView = document.getElementById("historyView");
    if(historyView && !historyView.classList.contains("hidden")) renderHistoryTab();
    
    if(!document.getElementById("publicEventModal").classList.contains("hidden")) renderPublicLeaderboardList(allPublicEvents.find(e => e.id === currentParticipationEventId)?.details);
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
        if (modalId === 'publicEventModal') closePublicEventModal();
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
    ["loginSection", "registerSection", "dashboardSection", "profileSection", "myEventsSection", "participateSection", "setupSection", "hubSection"].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

window.addEventListener("popstate", (event) => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    let view = (event.state && event.state.view) ? event.state.view : "dashboardSection";
    
    hideAllSections();
    let target = document.getElementById(view);
    if(target) target.classList.remove("hidden");
    window.scrollTo(0, 0);
});

function showPublicHub() {
    hideAllSections();
    let dbSec = document.getElementById("dashboardSection");
    if(dbSec) dbSec.classList.remove("hidden");
    history.pushState({view: 'dashboardSection'}, "");
    renderPublicHub();
}

function showMyEvents() {
    hideAllSections();
    let myEv = document.getElementById("myEventsSection");
    if(myEv) myEv.classList.remove("hidden");
    history.pushState({view: 'myEventsSection'}, "");
    processDashboard();
}

function showProfilePage() {
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
        localStorage.setItem("lureboard_session_data", JSON.stringify(loggedInUserData));
        
        let headerAvatar = document.getElementById("headerAvatar");
        if(headerAvatar) headerAvatar.src = loggedInUserData.avatar || "https://via.placeholder.com/40";
        
        let headerName = document.getElementById("headerUserName");
        if(headerName) headerName.innerText = loggedInUserData.fullName || loggedInUser;

        document.getElementById("profPassword").value = "";
        alert("Profile saved successfully!");
    }).catch(err => {
        console.error("Error updating profile: ", err);
        alert("Failed to save profile. Ensure database connection is stable.");
    });
}

// AUTHENTICATION
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
    
    localStorage.setItem("lureboard_session_user", user);
    localStorage.setItem("lureboard_session_data", JSON.stringify(data));
    
    updateUIAfterAuth();
    showPublicHub();
    subscribeToEventsRealtime();
}

function updateUIAfterAuth() {
    let btnLogin = document.getElementById("headerLoginBtn");
    let btnLogout = document.getElementById("headerLogoutBtn");
    let userWrap = document.getElementById("headerUserWrap");
    let avatarEl = document.getElementById("headerAvatar");
    let nameEl = document.getElementById("headerUserName");
    let myEventsBtn = document.getElementById("headerMyEventsBtn");

    if (loggedInUser && loggedInUserData) {
        if (btnLogin) btnLogin.classList.add("hidden");
        if (btnLogout) btnLogout.classList.add("hidden"); 
        if (userWrap) userWrap.classList.remove("hidden");
        if (avatarEl) {
            avatarEl.src = loggedInUserData.avatar || "https://via.placeholder.com/40";
        }
        if (nameEl) {
            nameEl.innerText = loggedInUserData.fullName || loggedInUser;
        }
        if (myEventsBtn) {
            if (loggedInUserData.role === 'organization' || !loggedInUserData.role) {
                myEventsBtn.classList.remove("hidden");
            } else {
                myEventsBtn.classList.add("hidden");
            }
        }
    } else {
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (btnLogout) btnLogout.classList.add("hidden");
        if (userWrap) userWrap.classList.add("hidden");
        if (myEventsBtn) myEventsBtn.classList.add("hidden");
    }
}

function handleLogout() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    loggedInUser = "";
    loggedInUserData = null;
    
    localStorage.removeItem("lureboard_session_user");
    localStorage.removeItem("lureboard_session_data");
    
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

// EVENTS SUBSCRIPTION & DASHBOARD
function subscribeToEventsRealtime() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    
    unsubscribeEventsListener = db.collection("events").onSnapshot(snapshot => {
        loadedEvents = [];
        allPublicEvents = [];
        
        snapshot.forEach(doc => { 
            let data = { id: doc.id, ...doc.data() };
            if (!data.details) data.details = {};
            
            if (loggedInUser && data.username === loggedInUser) {
                loadedEvents.push(data);
            }
            
            let isPub = data.details.isPublic;
            if (isPub === true || String(isPub) === "true") {
                allPublicEvents.push(data);
            }
        });
        
        let myEvSec = document.getElementById("myEventsSection");
        if (loggedInUser && myEvSec && !myEvSec.classList.contains("hidden")) {
            processDashboard();
        }
        
        let histSec = document.getElementById("historyView");
        if (loggedInUser && histSec && !histSec.classList.contains("hidden")) {
            renderHistoryTab();
        }
        
        let dbSec = document.getElementById("dashboardSection");
        if (dbSec && !dbSec.classList.contains("hidden")) {
            renderPublicHub();
        }

        let hubSection = document.getElementById("hubSection");
        if (currentEvent && hubSection && !hubSection.classList.contains("hidden")) {
            let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id) || allPublicEvents.find(e => e.id === currentEvent.id);
            if (activeUpdated) {
                currentEvent = activeUpdated.details;
                renderHubUI();
            }
        }
    }, error => {
        console.error("Firebase Read Error: ", error);
        let container = document.getElementById("publicEventsList");
        if(container) {
            container.innerHTML = `<div class="card" style="text-align:center; padding:40px 16px; color:var(--danger);"><b>Database Connection Issue</b><br>Firebase is blocking reads. Please verify your Firestore Database rules.</div>`;
        }
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
    if (!container) return;
    
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
        let stBadge = status === 'finished' ? 'neutral' : (status === 'ongoing' ? 'success' : 'primary-light');

        let hostName = ev.details.hostFullName || ev.username;
        let hostAvatar = ev.details.hostAvatar || "https://via.placeholder.com/40";

        html += `
        <div class="card" style="padding:16px; cursor:pointer;" onclick="openPublicEvent('${ev.id}')">
            ${thumb}
            <div class="flex flex-between" style="align-items:flex-start;">
                <div>
                    <h3 style="margin-bottom:8px;">${ev.name}</h3>
                    <div class="flex" style="font-size:12px; color:var(--text-muted);">
                        <img src="${hostAvatar}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">
                        <b>${hostName}</b>
                    </div>
                </div>
                <span class="badge ${stBadge}">${status}</span>
            </div>
            <div style="margin-top:16px; font-size:13px; color:var(--text-muted); display:flex; gap:16px;">
                <span class="flex">${svgUsers} ${pCount}</span>
                <span class="flex">${svgFish} ${cCount}</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// History Tab for Participants
function renderHistoryTab() {
    let container = document.getElementById("historyListContainer");
    if (!container) return;

    let myName = getMyName().toLowerCase();
    
    // Find all events where user is a participant
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
                <div class="flex" style="margin-bottom:6px;"><b style="font-size:15px;">${ev.name}</b> <span class="badge ${stBadge}" style="font-size:10px; padding: 2px 6px;">${status}</span></div>
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
        let medals = ["1st", "2nd", "3rd"];
        let aotyHtml = `<div class="card" style="background: var(--primary); color: white; border:none;">
            <div class="flex flex-between" style="margin-bottom: 16px;">
                <h3 style="color:white; margin:0; font-size:16px;">Angler of the Year (${selectedYear})</h3>
                <button class="secondary icon-btn" onclick="downloadSeasonChart()" style="padding:4px 8px; width:auto; border:none; background:rgba(255,255,255,0.2); color:white;">${svgDownload}</button>
            </div>`;
        
        aotyArray.slice(0, 3).forEach((angler, idx) => {
            aotyHtml += `
            <div class="flex flex-between" style="background: rgba(255,255,255,0.1); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 8px;">
                <div class="flex" style="gap: 12px;">
                    <span style="font-size: 14px; font-weight: bold; opacity:0.8;">${medals[idx]}</span>
                    <b style="font-size: 15px;">${angler.name}</b>
                </div>
                <div style="text-align:right;">
                    <b style="font-size: 15px;">${angler.totalRankPts} <span style="font-size:11px; font-weight:normal;">pts</span></b>
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
        let rankBadge = ev.details.isRanked === false ? `<span class="badge" style="background:var(--danger-bg); color:var(--danger); padding:2px 6px; font-size:10px; margin-left:6px;">Unranked</span>` : '';
        
        let status = ev.details.status || 'finished';
        let stBadge = status === 'finished' ? 'neutral' : (status === 'ongoing' ? 'success' : 'primary-light');

        html += `<div class="card flex flex-between" style="padding: 16px;">
            <div style="flex:1;">
                <div class="flex flex-wrap" style="font-weight:700; margin-bottom:6px; font-size:15px; color:var(--text-main);">
                    <span style="color:var(--primary);">${rankIcon}</span> 
                    <span>${ev.name}</span>
                    <div class="flex" style="gap:4px;">
                        <span class="badge ${stBadge}" style="padding:2px 6px; font-size:10px;">${status}</span>
                        ${rankBadge}
                    </div>
                </div>
                <div class="flex" style="font-size:12px; color:var(--text-muted); font-weight:500;">
                    ${svgCal} ${publishDate} • ${svgUsers} ${(ev.details.participants||[]).length}
                </div>
            </div>
            <div class="flex" style="gap:8px; align-items:center;">
                <button onclick="downloadChart('${ev.id}')" class="secondary icon-btn" style="box-shadow:none; padding:8px;">${svgDownload}</button>
                <button onclick="editEvent('${ev.id}')" class="primary icon-btn" style="padding:8px;">${svgEdit}</button>
                <button onclick="deleteEvent('${ev.id}')" class="danger icon-btn" style="padding:8px;">${svgTrash}</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// SETUP PHASE
function editEvent(id) {
    let found = loadedEvents.find(e => e.id === id);
    if (found) openEventEditor(found.details);
}

function deleteEvent(id) {
    if (confirm("Are you sure you want to permanently delete this event?")) {
        db.collection("events").doc(id).delete().catch(err => alert("Failed to delete: " + err.message));
    }
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

function openEventEditor(eventObj = null) {
    hideAllSections();
    document.getElementById("setupSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    history.pushState({view: 'setupSection'}, "");

    if (eventObj) {
        currentEvent = JSON.parse(JSON.stringify(eventObj));
        
        document.getElementById("eventNameInput").value = currentEvent.name || "";
        document.getElementById("eventDescInput").value = currentEvent.description || "";
        document.getElementById("isPublicToggle").checked = currentEvent.isPublic !== false && currentEvent.isPublic !== "false";
        document.getElementById("isRankedToggle").checked = currentEvent.isRanked !== false;
        
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
            isPublic: true,
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
        document.getElementById("isPublicToggle").checked = true;
        document.getElementById("isRankedToggle").checked = true;
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
        <div class="card" style="padding:16px; margin-bottom:12px;">
            <div class="flex flex-between">
                <div>
                    <div class="flex">
                        <b style="font-size:15px;">${s.name}</b>
                        <span class="badge neutral" style="font-size:10px;">${s.abbr.toUpperCase()}</span>
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
            <button class="danger icon-btn" style="position:absolute; top:-8px; right:-8px; padding:4px; border-radius:50%; box-shadow:none;" onclick="removeRule(${tIdx})">${svgTrash}</button>
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
    let wantsRanked = document.getElementById("isRankedToggle").checked;
    
    let thumbSrc = document.getElementById('thumbnailPreview').src;
    if(thumbSrc && thumbSrc.startsWith('data:')) currentEvent.thumbnail = thumbSrc;

    currentEvent.unit = confUnit;
    currentEvent.measureType = confMeasure;
    currentEvent.limitType = confLimit;
    
    // Save host info directly onto the event details
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
    
    hideAllSections();
    document.getElementById("hubSection").classList.remove("hidden");
    window.scrollTo(0, 0);
    
    history.pushState({view: 'hubSection'}, "");
    renderHubUI();
}

function backToSetup() {
    hideAllSections();
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
    if (confirm("Finish event? This will lock scoring permanently.")) {
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
            <span><b>${c.size}</b>${unitText} <span class="badge neutral">${c.abbr.toUpperCase()}</span></span>
            <button class="danger icon-btn" style="padding:6px; box-shadow:none;" onclick="removeFish(${activeFishParticipantIndex}, ${cIdx})">${svgTrash}</button>
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

    let countEl = document.getElementById("hubParticipantCount");
    if(countEl) countEl.innerText = (currentEvent.participants||[]).length;

    let unitText = currentEvent.unit === 'imperial' ? (currentEvent.measureType === 'weight' ? 'lbs' : 'in') : (currentEvent.measureType === 'weight' ? 'kg' : 'cm');

    let filteredHtml = "";
    (currentEvent.participants||[]).forEach((p, pIndexReal) => {
        if (!p.name.toLowerCase().includes(query)) return;

        let catchesText = (p.catches||[]).length > 0 
            ? p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') 
            : `<span style="color:var(--text-muted); opacity: 0.7; font-style:italic;">${t('no_catches')}</span>`;

        let penBadge = (p.penalties && p.penalties.length > 0) ? `<button onclick="showPenaltyReason(${pIndexReal})" class="danger icon-btn" style="padding:4px; border-radius:50%; box-shadow:none; font-size:12px;">${svgWarning}</button>` : '';

        let actionButtons = '';
        if (isFinished) {
            actionButtons = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Locked</span>`;
        } else if (isAnnounced) {
            actionButtons = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold; padding-right:8px;">Announced</span>`;
        } else {
            actionButtons = `
                <button onclick="openPenaltyModal(${pIndexReal})" class="secondary icon-btn" style="padding:10px;">${svgWarning}</button>
                <button onclick="openFishModal(${pIndexReal})" class="icon-btn primary" style="padding:10px 14px;">${svgFish}</button>
            `;
        }

        let editBtn = isFinished ? '' : `<button onclick="editParticipantName(${pIndexReal})" class="icon-btn" style="padding:4px; background:transparent; color:var(--text-muted); box-shadow:none;">${svgEdit}</button>`;

        filteredHtml += `
        <div class="card" style="padding:16px; margin-bottom:16px;">
            <div class="flex flex-between" style="align-items:center;">
                <div class="flex" style="gap: 8px;">
                    <b style="font-size:15px;">${pIndexReal + 1}. ${p.name}</b> ${penBadge} ${editBtn}
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
        actionBtnHtml = `<button id="btnFinishEvent" onclick="promptFinishEvent()" class="danger" style="flex: 1;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg> Finish Event</button>`;
    } else {
        actionBtnHtml = `<button disabled class="danger" style="flex: 1;">Event Finished</button>`;
    }

    document.getElementById("bottomActionBarButtons").innerHTML = `
        <a href="javascript:void(0)" onclick="downloadChart()" style="color: var(--text-muted); padding: 8px;">${svgDownload}</a>
        ${actionBtnHtml}
        <button onclick="saveCurrentEvent(true)" class="primary" style="flex: 1;">Save Event</button>
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
                    <div style="font-size:12px; color:#b45309; font-weight:700; text-transform:uppercase;">${svgTrophy} Biggest Catch</div>
                    <div style="font-weight:700; font-size:16px; color:var(--text-main); margin-top:4px;">${sortedByBiggest[0].name}</div>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:18px; font-weight:800; color:var(--text-main);">${sortedByBiggest[0].maxFishMeasure}</span> ${unitText}
                    <div class="badge" style="background:#fef08a; color:#b45309; margin-left:4px;">${sortedByBiggest[0].maxFishAbbr}</div>
                </div>
            </div>`;
        topSummaryContainer.classList.remove('hidden');
    } else { topSummaryContainer.classList.add('hidden'); }

    let html = `<table><tr><th style="width:40px;">#</th><th>Name</th><th>Pts</th><th>Total</th><th>Amt</th><th>Max</th></tr>`;
    sortedByMain.forEach((p, idx) => {
        let placeBadge = (idx === 0) ? "1st" : (idx === 1) ? "2nd" : (idx === 2) ? "3rd" : `${idx + 1}`;
        let maxDisplay = p.maxFishMeasure > 0 ? `${p.maxFishMeasure}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${p.maxFishAbbr}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;" title="-${p.penPts} pts">${svgWarning}</span>` : '';
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

function openPublicEvent(eventId) {
    let evData = allPublicEvents.find(e => e.id === eventId);
    if(!evData) return;
    let ev = evData.details;
    currentParticipationEventId = eventId;

    document.getElementById("pubTitle").innerText = evData.name;
    document.getElementById("pubHost").innerText = `Hosted by ${ev.hostFullName || evData.username} | ${ev.date || ''}`;
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
        return `<div><b>${s.name} (${s.abbr.toUpperCase()}):</b> ${trs}</div>`;
    }).join('');
    document.getElementById("pubRules").innerHTML = rulesHtml;

    let unitText = ev.unit === 'imperial' ? (ev.measureType === 'weight' ? 'lbs' : 'in') : (ev.measureType === 'weight' ? 'kg' : 'cm');
    document.getElementById("pubParticipantsDetail").innerHTML = (ev.participants||[]).map((p, i) => {
        let catches = (p.catches||[]).length > 0 ? p.catches.map(c => `${c.size}${unitText} ${c.abbr.toUpperCase()}`).join(', ') : 'None';
        let pens = (p.penalties && p.penalties.length>0) ? `<br><span style="color:var(--danger);">Penalties: -${p.penalties.reduce((sum,pn)=>sum+parseFloat(pn.points),0)} pts</span>` : '';
        return `<div style="padding:8px 0; border-bottom:1px solid var(--border);"><b>${i+1}. ${p.name}</b><br><span style="color:var(--text-muted);">${catches}</span>${pens}</div>`;
    }).join('');

    isLeaderboardExpanded = false;
    let st = ev.status || 'finished';
    
    let partBtn = document.getElementById("pubParticipateBtn");
    
    if (st === 'announced') {
        document.getElementById("pubRulesCard").classList.remove("hidden");
        document.getElementById("pubLeaderboardCard").classList.add("hidden");
        document.getElementById("pubPartCard").classList.remove("hidden");
        
        if (loggedInUserData && loggedInUserData.role === 'participant') {
            partBtn.classList.remove("hidden");
            let isAlreadyJoined = (ev.participants||[]).some(p => p.name === getMyName());
            if (isAlreadyJoined) {
                partBtn.innerHTML = `${svgCircle} Leave Event`;
                partBtn.className = "danger";
            } else {
                partBtn.innerHTML = `${svgCircle} Join Event`;
                partBtn.className = "success";
            }
        } else {
            partBtn.classList.add("hidden");
        }
    } else {
        document.getElementById("pubRulesCard").classList.remove("hidden");
        document.getElementById("pubLeaderboardCard").classList.remove("hidden");
        document.getElementById("pubPartCard").classList.add("hidden");
        partBtn.classList.add("hidden");
        renderPublicLeaderboardList(ev);
    }

    document.getElementById("publicEventModal").classList.remove("hidden");
}

function closePublicEventModal() { 
    document.getElementById("publicEventModal").classList.add("hidden"); 
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
        let countedCatches = ev.limitType === 'top5' ? [...(p.catches||[])].sort((a,b) => b.size - a.size).slice(0,5) : (p.catches||[]);

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
        let maxDisplay = p.maxFishMeasure > 0 ? `${p.maxFishMeasure}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${p.maxFishAbbr}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;">${svgWarning}</span>` : '';
        html += `<tr>
            <td style="font-weight:bold; text-align:center;">${placeBadge}</td>
            <td style="font-weight:600; white-space:nowrap;">${p.name}${penMarker}</td>
            <td style="color:var(--primary); font-weight:700;">${p.totalPts.toFixed(1)}</td>
            <td>${maxDisplay}</td>
        </tr>`;
    });
    html += `</table>`;
    
    document.getElementById("pubLeaderboard").innerHTML = html;
    document.getElementById("btnToggleLeaderboard").style.display = processed.length > 3 ? "inline-block" : "none";
}

function joinEventDirectly() {
    let evData = allPublicEvents.find(e => e.id === currentParticipationEventId);
    let ev = evData.details;
    if(!ev.participants) ev.participants = [];
    
    let myName = getMyName();
    let isAlreadyJoined = ev.participants.some(p => p.name === myName);
    
    if (isAlreadyJoined) {
        if(confirm("Are you sure you want to leave this event?")) {
            ev.participants = ev.participants.filter(p => p.name !== myName);
            db.collection("events").doc(currentParticipationEventId).set({ ...evData, details: ev }).then(() => {
                alert("You have left the event.");
                closePublicEventModal();
            });
        }
    } else {
        if(confirm("Join this event? Participation fee: 50 coins (Simulation).")) {
            ev.participants.push({
                id: 'p_' + Math.random().toString(36).substr(2, 9),
                name: myName, catches: [], penalties: [], registeredBy: loggedInUser
            });
            db.collection("events").doc(currentParticipationEventId).set({ ...evData, details: ev }).then(() => {
                alert("Successfully joined the event!");
                closePublicEventModal();
            });
        }
    }
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
            <h2 style="margin-bottom: 8px; color: #4f46e5; font-size:28px;">Tournament Results: ${ev.name}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Generated on: ${new Date().toLocaleDateString()} | Format: ${ev.limitType==='top5'?'Top 5 Counted':'All Fish'}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <thead><tr style="background-color: #4f46e5; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Place</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Name</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Points</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Total ${unitText.toUpperCase()}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Amt</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Biggest Fish</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5; width: 35%;">Details</th>
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
            <h2 style="margin-bottom: 8px; color: #4f46e5; font-size:28px;">Season Results ${selectedYear}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Generated on: ${new Date().toLocaleDateString()}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <thead><tr style="background-color: #4f46e5; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Place</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Name</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Rank Pts (Best 5)</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Tournaments Played</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">All Placements</th>
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

// RESTORE SESSION & INITIALIZATION
let savedUser = localStorage.getItem("lureboard_session_user");
let savedData = localStorage.getItem("lureboard_session_data");

if (savedUser && savedData) {
    try {
        loggedInUser = savedUser;
        loggedInUserData = JSON.parse(savedData);
    } catch(e) {
        loggedInUser = "";
        loggedInUserData = null;
    }
}

updateUIAfterAuth();

hideAllSections();
document.getElementById("dashboardSection").classList.remove("hidden");
history.replaceState({view: 'dashboardSection'}, "");

subscribeToEventsRealtime();
