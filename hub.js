// =========================================================================
// FIREBASE FIRESTORE CLOUD DATABASE CONFIGURATION
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

// Enable Offline Dead-Zone Persistence
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn("Offline persistence note:", err.code);
});

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

let currentLang = "en";
let selectedYear = new Date().getFullYear().toString();

let confUnit = 'metric';
let confMeasure = 'size';
let confLimit = 'all';
let confEventType = 'standard';
let activeHubTab = 'part';

let currentParticipationEventId = null;
let isLeaderboardExpanded = false;
let regRoleSelect = 'participant';
let tempProfileAvatarBase64 = "";

// Minimal SVGs
const svgTrophy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10"/><path d="M17 4v8a5 5 0 0 1-10 0V4"/><path d="M4 9h3"/><path d="M17 9h3"/></svg>`;
const svgCircle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
const svgUsers = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const svgFish = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="15" cy="12" r="1"/><path d="M2 12c2 2 4 4 6 4s6-2 6-2"/></svg>`;
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
    if (bg === "#10b981") {
        setTimeout(() => { el.style.display = "none"; }, 2000);
    }
}

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
        if(headerName) {
            let dispName = loggedInUserData.fullName || loggedInUser;
            headerName.innerText = dispName.length > 5 ? dispName.substring(0, 5) + "..." : dispName;
        }

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
    let userWrap = document.getElementById("headerUserWrap");
    let avatarEl = document.getElementById("headerAvatar");
    let nameEl = document.getElementById("headerUserName");
    let myEventsBtn = document.getElementById("headerMyEventsBtn");

    if (loggedInUser && loggedInUserData) {
        if (btnLogin) btnLogin.classList.add("hidden");
        if (userWrap) userWrap.classList.remove("hidden");
        if (avatarEl) {
            avatarEl.style.display = "block";
            avatarEl.src = loggedInUserData.avatar || "https://via.placeholder.com/40";
        }
        if (nameEl) {
            let dispName = loggedInUserData.fullName || loggedInUser;
            nameEl.innerText = dispName.length > 5 ? dispName.substring(0, 5) + "..." : dispName;
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
        if (userWrap) userWrap.classList.add("hidden");
        if (avatarEl) avatarEl.style.display = "none";
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

// EVENTS SUBSCRIPTION & AUTOMATIC CLEANUP
function subscribeToEventsRealtime() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    
    unsubscribeEventsListener = db.collection("events").onSnapshot(snapshot => {
        loadedEvents = [];
        allPublicEvents = [];
        
        snapshot.forEach(doc => { 
            let data = { id: doc.id, ...doc.data() };
            if (!data.details) data.details = {};
            data.details.id = doc.id; 
            
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
                    if (changed && data.username === loggedInUser) {
                        db.collection("events").doc(data.id).set({ ...data, details: evDet });
                    }
                }
            }

            if (loggedInUser && data.username === loggedInUser) {
                loadedEvents.push(data);
            }
            
            let isPub = data.details.isPublic;
            if (isPub === true || String(isPub) === "true" || isPub === undefined) {
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
                currentEvent.id = activeUpdated.id; 
                renderHubUI();
            }
        }

        let pubSection = document.getElementById("publicEventSection");
        if (currentParticipationEventId && pubSection && !pubSection.classList.contains("hidden")) {
            let activeUpdated = allPublicEvents.find(e => e.id === currentParticipationEventId);
            if (activeUpdated) {
                activeUpdated.details.id = activeUpdated.id;
                renderPublicLeaderboardList(activeUpdated.details);
                if (activeUpdated.details.eventType === 'cpr') renderPublicGallery(activeUpdated.details);
            }
        }
    }, error => {
        console.error("Firebase Read Error: ", error);
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

function openPublicEvent(eventId) {
    let evData = allPublicEvents.find(e => e.id === eventId);
    if(!evData) return;
    let ev = evData.details;
    ev.id = evData.id; 
    currentParticipationEventId = eventId;

    document.getElementById("pubTitle").innerText = evData.name;
    document.getElementById("pubEvTypeBadge").innerText = ev.eventType === 'cpr' ? "CPR" : "STD";
    if (ev.eventType === 'cpr') document.getElementById("pubEvTypeBadge").className = "badge warning";
    else document.getElementById("pubEvTypeBadge").className = "badge neutral";

    let st = ev.status || 'finished';
    let codeBanner = document.getElementById("pubSecretCodeBanner");
    if (ev.eventType === 'cpr' && st !== 'announced' && ev.secretCode) {
        document.getElementById("pubSecretCodeDisplay").innerText = ev.secretCode;
        codeBanner.classList.remove("hidden");
    } else {
        codeBanner.classList.add("hidden");
    }

    document.getElementById("pubHost").innerText = ev.date || '';
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
            let sizeDisp = c.size > 0 ? c.size + unitText : 'Pending';
            let photoIcon = c.photo ? `<span style="cursor:pointer; color:var(--primary); margin-left:4px; display:inline-flex;" onclick="openPhotoPreviewByUrl('${c.photo}')">${svgCamera}</span>` : '';
            return `<span class="badge neutral" style="font-weight:600; display:inline-flex; align-items:center;">${sizeDisp} ${escapeHTML(c.abbr.toUpperCase())} ${photoIcon}</span>`;
        }).join(' ') : 'None';
        let pens = (p.penalties && p.penalties.length>0) ? `<br><span style="color:var(--danger); font-size:12px; font-weight:600;">Penalties: -${p.penalties.reduce((sum,pn)=>sum+parseFloat(pn.points),0)} pts</span>` : '';
        return `<div style="padding:12px 0; border-bottom:1px solid var(--border);"><b>${i+1}. ${escapeHTML(p.name)}</b><br><span style="color:var(--text-muted);">${catches}</span>${pens}</div>`;
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
    history.pushState({view: 'publicEventSection'}, "");
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
                await db.collection("events").doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
                showSaveStatus("✓ Saved", "#10b981");
                alert("You have left the event.");
                openPublicEvent(currentParticipationEventId);
            } catch(e) {
                showSaveStatus("✕ Error", "#ef4444");
            }
        }
    } else {
        ev.participants.push({
            id: 'p_' + Math.random().toString(36).substr(2, 9),
            name: myName, catches: [], penalties: [], registeredBy: loggedInUser
        });
        let safeDetails;
        try { safeDetails = JSON.parse(JSON.stringify(ev)); } catch(e) { return; }
        showSaveStatus("Updating...", "#f59e0b");
        try {
            await db.collection("events").doc(currentParticipationEventId).set({ ...evData, details: safeDetails });
            showSaveStatus("✓ Saved", "#10b981");
            alert("Successfully joined the event!");
            openPublicEvent(currentParticipationEventId);
        } catch(e) {
            showSaveStatus("✕ Error", "#ef4444");
        }
    }
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
    
    let myName = getMyName() ? getMyName().toLowerCase() : "";

    allPublicEvents.forEach(ev => {
        let pList = ev.details.
