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
let loadedEvents = [];
let activeFishParticipantIndex = null;
let activePenaltyParticipantIndex = null;
let activeSpeciesIndex = null;

let selectedModalSpecies = "";
let pendingSmallFish = null;
let currentLang = "en";
let selectedYear = new Date().getFullYear().toString();

const translations = {
    en: {
        login_title: "Login / Register", login_desc: "Enter any username and password.", username: "Username", password: "Password", login_btn: "Login / Register",
        your_events: "Your Events", logout: "Logout", create_event: "+ Create New Event", step1_title: "Step 1: Setup", back: "← Back", home: "Home",
        tourn_name: "Tournament Name", ranked_tourn: "Ranked Tournament", ranked_desc: "Include in Yearly Leaderboard (Max 7/year)", bulk_part: "Participants List",
        bulk_desc: "Paste names. Symbols/brackets are auto-removed.", fish_species_title: "Species & Multipliers", add_species: "+ Add Species", start_event: "Start Event", next_btn: "Next",
        hub_title: "Tournament Hub", edit_setup: "← Setup", manage_part: "Participants", add_new: "+ Add", leaderboard: "Leaderboard", mode_pts: "Rank by Points",
        mode_cm: "Rank by Centimeters", save_event: "Save Event", finish_event: "Finish Event", modal_add_title: "Add New Participant", close: "Cancel", add: "Add",
        add_remove_fish: "Add / Remove Catch", species_sel: "Species", size_cm: "Size (cm)", save: "Save", add_fish_btn: "+ Add Catch", edit_rules: "Edit Rules",
        add_rule: "+ Add New Rule", done: "Done", rule_from: "From", rule_to: "To", rule_mult: "Multiplier", download_chart: "PDF", download_season_pdf: "Season PDF",
        season_results: "Season Results", current_catches: "Current Catches", no_catches: "No catches logged.", too_small_title: "Fish Too Small", 
        too_small_desc: "The fish is too small based on the rules.", ok: "OK", ignore: "Ignore", angler_of_year: "Angler of the Year", edit_name: "Edit Name", 
        unranked_badge: "UNRANKED", rank_pts: "Rank Pts", tournaments: "tournaments", editing_disabled: "Editing this is disabled, please edit participant list on the next page",
        finish_warning: "If you finish the event now you will not be able to change anything anymore and the event will be officially finished.",
        status_finished: "Finished", status_ongoing: "Ongoing", place: "Place", name: "Name", points: "Points", total_cm: "Total", biggest_fish: "Biggest Fish", details: "Details", generated_on: "Generated on", 
        tournament_results: "Tournament Results", rank_pts_best5: "Rank Pts (Best 5)", tournaments_played: "Tournaments Played", all_placements: "All Placements", sort_newest: "Newest First", sort_oldest: "Oldest First", sort_az: "Name A-Z",
        penalties: "Penalties", pts_deduct: "Points to Deduct", reason_desc: "Reason / Description", add_penalty: "+ Add Penalty"
    },
    ka: {
        login_title: "შესვლა / რეგისტრაცია", login_desc: "შეიყვანეთ ნებისმიერი სახელი და პაროლი.", username: "მომხმარებელი", password: "პაროლი", login_btn: "შესვლა / რეგისტრაცია",
        your_events: "თქვენი ღონისძიებები", logout: "გასვლა", create_event: "+ ახალი ღონისძიების შექმნა", step1_title: "ნაბიჯი 1: პარამეტრები", back: "← უკან", home: "მთავარი",
        tourn_name: "ტურნირის სახელი", ranked_tourn: "სარეიტინგო ტურნირი", ranked_desc: "წლიურ რეიტინგში დამატება (მაქს 7/წელს)", bulk_part: "მონაწილეთა სია",
        bulk_desc: "ჩასვით სახელები. ფრჩხილები/სიმბოლოები იშლება.", fish_species_title: "სახეობები და კოეფიციენტები", add_species: "+ სახეობის დამატება", start_event: "ტურნირის დაწყება", next_btn: "შემდეგი",
        hub_title: "ტურნირის ჰაბი", edit_setup: "← პარამეტრები", manage_part: "მონაწილეები", add_new: "+ დამატება", leaderboard: "ლიდერბორდი", mode_pts: "ქულებით რეიტინგი",
        mode_cm: "სანტიმეტრებით რეიტინგი", save_event: "ტურნირის შენახვა", finish_event: "ტურნირის დასრულება", modal_add_title: "მონაწილის დამატება", close: "გაუქმება", add: "დამატება",
        add_remove_fish: "თევზის დამატება/წაშლა", species_sel: "სახეობა", size_cm: "ზომა (სმ)", save: "შენახვა", add_fish_btn: "+ დამატება", edit_rules: "წესები",
        add_rule: "+ ახალი წესი", done: "მზადაა", rule_from: "-დან", rule_to: "-მდე", rule_mult: "კოეფიციენტი", download_chart: "PDF", download_season_pdf: "სეზონის PDF",
        season_results: "სეზონის შედეგები", current_catches: "მიმდინარე თევზები", no_catches: "თევზი არ არის.", too_small_title: "თევზი ძალიან პატარაა", 
        too_small_desc: "წესების მიხედვით თევზი ძალიან პატარაა.", ok: "OK", ignore: "იგნორირება", angler_of_year: "წლის მეთევზე", edit_name: "სახელის შეცვლა", 
        unranked_badge: "არასარეიტინგო", rank_pts: "სარეიტინგო ქულა", tournaments: "ტურნირი", editing_disabled: "რედაქტირება გამორთულია, გთხოვთ შეცვალოთ მონაწილეთა სია შემდეგ გვერდზე",
        finish_warning: "თუ ახლა დაასრულებთ ტურნირს, ვეღარაფერს შეცვლით და ტურნირი ოფიციალურად დასრულდება.",
        status_finished: "დასრულებულია", status_ongoing: "მიმდინარე", place: "ადგილი", name: "სახელი", points: "ქულა", total_cm: "ჯამი", biggest_fish: "ყველაზე დიდი", details: "დეტალები", generated_on: "გენერირებულია",
        tournament_results: "ტურნირის შედეგები", rank_pts_best5: "სარეიტინგო ქულა (საუკ. 5)", tournaments_played: "ჩატარებული ტურნირები", all_placements: "ყველა პოზიცია", sort_newest: "ახლები ჯერ", sort_oldest: "ძველები ჯერ", sort_az: "სახელი ა-ჰ",
        penalties: "ჯარიმები", pts_deduct: "დასაკლები ქულა", reason_desc: "მიზეზი / აღწერა", add_penalty: "+ ჯარიმის დამატება"
    },
    uk: {
        login_title: "Вхід / Реєстрація", login_desc: "Введіть будь-яке ім'я та пароль.", username: "Користувач", password: "Пароль", login_btn: "Вхід / Реєстрація",
        your_events: "Ваші події", logout: "Вийти", create_event: "+ Створити нову подію", step1_title: "Крок 1: Налаштування", back: "← Назад", home: "Головна",
        tourn_name: "Назва турніру", ranked_tourn: "Рейтинговий турнір", ranked_desc: "Включити в річний рейтинг (макс 7/рік)", bulk_part: "Список учасників",
        bulk_desc: "Вставте імена. Дужки та символи видаляються.", fish_species_title: "Види та коефіцієнти", add_species: "+ Додати вид", start_event: "Почати подію", next_btn: "Далі",
        hub_title: "Хаб турніру", edit_setup: "← Налаштування", manage_part: "Учасники", add_new: "+ Додати", leaderboard: "Таблиця лідерів", mode_pts: "Рейтинг за балами",
        mode_cm: "Рейтинг за сантиметрами", save_event: "Зберегти подію", finish_event: "Завершити подію", modal_add_title: "Додати учасника", close: "Скасувати", add: "Додати",
        add_remove_fish: "Додати/Видалити рибу", species_sel: "Вид", size_cm: "Розмір (см)", save: "Зберегти", add_fish_btn: "+ Додати рибу", edit_rules: "Правила",
        add_rule: "+ Нове правило", done: "Готово", rule_from: "Від", rule_to: "До", rule_mult: "Множник", download_chart: "PDF", download_season_pdf: "PDF сезону",
        season_results: "Результати сезону", current_catches: "Поточний улов", no_catches: "Немає улову.", too_small_title: "Риба занадто мала", 
        too_small_desc: "За правилами риба занадто мала.", ok: "OK", ignore: "Ігнорувати", angler_of_year: "Рибалка року", edit_name: "Редагувати ім'я", 
        unranked_badge: "БЕЗ РЕЙТИНГУ", rank_pts: "Ранг. очок", tournaments: "турнірів", editing_disabled: "Редагування вимкнено, редагуйте список на наступній сторінці",
        finish_warning: "Якщо ви завершите подію зараз, ви більше не зможете нічого змінити.",
        status_finished: "Завершено", status_ongoing: "Триває", place: "Місце", name: "Ім'я", points: "Очки", total_cm: "Всього", biggest_fish: "Найбільша риба", details: "Деталі", generated_on: "Згенеровано",
        tournament_results: "Результати турніру", rank_pts_best5: "Ранг. очок (Кращі 5)", tournaments_played: "Зіграно турнірів", all_placements: "Всі місця", sort_newest: "Спочатку нові", sort_oldest: "Спочатку старі", sort_az: "Ім'я А-Я",
        penalties: "Штрафи", pts_deduct: "Очки для зняття", reason_desc: "Причина / Опис", add_penalty: "+ Додати штраф"
    },
    ru: {
        login_title: "Вход / Регистрация", login_desc: "Введите любые имя и пароль.", username: "Имя пользователя", password: "Пароль", login_btn: "Вход / Регистрация",
        your_events: "Ваши события", logout: "Выйти", create_event: "+ Создать событие", step1_title: "Шаг 1: Настройка", back: "← Назад", home: "Главная",
        tourn_name: "Название турнира", ranked_tourn: "Рейтинговый турнир", ranked_desc: "Включить в годовой рейтинг (макс 7/год)", bulk_part: "Список участников",
        bulk_desc: "Вставьте имена. Скобки и символы удалятся.", fish_species_title: "Виды и коэффициенты", add_species: "+ Добавить вид", start_event: "Начать событие", next_btn: "Далее",
        hub_title: "Хаб турнира", edit_setup: "← Настройка", manage_part: "Участники", add_new: "+ Добавить", leaderboard: "Таблица лидеров", mode_pts: "Рейтинг по очкам",
        mode_cm: "Рейтинг по см", save_event: "Сохранить событие", finish_event: "Завершить событие", modal_add_title: "Добавить участника", close: "Отмена", add: "Добавить",
        add_remove_fish: "Добавить/Удалить рыбу", species_sel: "Вид", size_cm: "Размер (см)", save: "Сохранить", add_fish_btn: "+ Добавить рыбу", edit_rules: "Правила",
        add_rule: "+ Новое правило", done: "Готово", rule_from: "От", rule_to: "До", rule_mult: "Множитель", download_chart: "PDF", download_season_pdf: "PDF сезона",
        season_results: "Результаты сезона", current_catches: "Текущий улов", no_catches: "Нет улова.", too_small_title: "Рыба слишком мала", 
        too_small_desc: "По правилам рыба слишком мала.", ok: "OK", ignore: "Игнорировать", angler_of_year: "Рыболов года", edit_name: "Изменить имя", 
        unranked_badge: "ВНЕ РЕЙТИНГА", rank_pts: "Ранг. очков", tournaments: "турниров", editing_disabled: "Редактирование отключено, измените список на следующей странице",
        finish_warning: "Если вы завершите турнир сейчас, вы больше не сможете ничего изменить.",
        status_finished: "Завершен", status_ongoing: "Идет", place: "Место", name: "Имя", points: "Очки", total_cm: "Всего", biggest_fish: "Самая большая", details: "Детали", generated_on: "Сгенерировано",
        tournament_results: "Результаты турнира", rank_pts_best5: "Ранг. очков (Топ 5)", tournaments_played: "Сыграно турниров", all_placements: "Все места", sort_newest: "Сначала новые", sort_oldest: "Сначала старые", sort_az: "Имя А-Я",
        penalties: "Штрафы", pts_deduct: "Очки для снятия", reason_desc: "Причина / Описание", add_penalty: "+ Добавить штраф"
    },
    fr: {
        login_title: "Connexion / Inscription", login_desc: "Entrez un nom d'utilisateur et un mot de passe.", username: "Utilisateur", password: "Mot de passe", login_btn: "Connexion / Inscription",
        your_events: "Vos Événements", logout: "Déconnexion", create_event: "+ Créer Événement", step1_title: "Étape 1 : Config", back: "← Retour", home: "Accueil",
        tourn_name: "Nom du Tournoi", ranked_tourn: "Tournoi Classé", ranked_desc: "Inclure dans le classement annuel (Max 7/an)", bulk_part: "Participants",
        bulk_desc: "Collez les noms. Les symboles sont ignorés.", fish_species_title: "Espèces & Multiplicateurs", add_species: "+ Espèce", start_event: "Démarrer", next_btn: "Suivant",
        hub_title: "Hub du Tournoi", edit_setup: "← Config", manage_part: "Participants", add_new: "+ Ajouter", leaderboard: "Classement", mode_pts: "Par Points",
        mode_cm: "Par Centimètres", save_event: "Enregistrer", finish_event: "Terminer", modal_add_title: "Ajouter Participant", close: "Annuler", add: "Ajouter",
        add_remove_fish: "Ajouter/Retirer Prise", species_sel: "Espèce", size_cm: "Taille (cm)", save: "Enregistrer", add_fish_btn: "+ Ajouter Prise", edit_rules: "Règles",
        add_rule: "+ Nouvelle Règle", done: "Terminé", rule_from: "De", rule_to: "À", rule_mult: "Multiplicateur", download_chart: "PDF", download_season_pdf: "PDF de la Saison",
        season_results: "Résultats de la Saison", current_catches: "Prises Actuelles", no_catches: "Aucune prise.", too_small_title: "Poisson trop petit", 
        too_small_desc: "Le poisson est trop petit selon les règles.", ok: "OK", ignore: "Ignorer", angler_of_year: "Pêcheur de l'Année", edit_name: "Modifier le nom", 
        unranked_badge: "NON CLASSÉ", rank_pts: "Pts Class.", tournaments: "tournois", editing_disabled: "Modification désactivée, veuillez modifier la liste sur la page suivante",
        finish_warning: "Si vous terminez l'événement maintenant, vous ne pourrez plus rien modifier.",
        status_finished: "Terminé", status_ongoing: "En cours", place: "Place", name: "Nom", points: "Points", total_cm: "Total", biggest_fish: "Plus gros", details: "Détails", generated_on: "Généré le",
        tournament_results: "Résultats du Tournoi", rank_pts_best5: "Pts Class. (Top 5)", tournaments_played: "Tournois joués", all_placements: "Tous les classements", sort_newest: "Plus récents", sort_oldest: "Plus anciens", sort_az: "Nom A-Z",
        penalties: "Pénalités", pts_deduct: "Points à déduire", reason_desc: "Raison / Description", add_penalty: "+ Ajouter Pénalité"
    },
    it: {
        login_title: "Accesso / Registrazione", login_desc: "Inserisci utente e password.", username: "Utente", password: "Password", login_btn: "Accedi / Registrati",
        your_events: "I tuoi Eventi", logout: "Esci", create_event: "+ Crea Evento", step1_title: "Passo 1: Config", back: "← Indietro", home: "Home",
        tourn_name: "Nome Torneo", ranked_tourn: "Torneo Classificato", ranked_desc: "Includi nella classifica annuale (Max 7/anno)", bulk_part: "Partecipanti",
        bulk_desc: "Incolla i nomi. I simboli vengono rimossi.", fish_species_title: "Specie & Moltiplicatori", add_species: "+ Specie", start_event: "Inizia Evento", next_btn: "Avanti",
        hub_title: "Hub del Torneo", edit_setup: "← Config", manage_part: "Partecipanti", add_new: "+ Aggiungi", leaderboard: "Classifica", mode_pts: "Per Punti",
        mode_cm: "Per Centimetri", save_event: "Salva Evento", finish_event: "Termina Evento", modal_add_title: "Aggiungi Partecipante", close: "Annulla", add: "Aggiungi",
        add_remove_fish: "Aggiungi/Rimuovi Pesce", species_sel: "Specie", size_cm: "Misura (cm)", save: "Salva", add_fish_btn: "+ Aggiungi Pesce", edit_rules: "Regole",
        add_rule: "+ Nuova Regola", done: "Fatto", rule_from: "Da", rule_to: "A", rule_mult: "Moltiplicatore", download_chart: "PDF", download_season_pdf: "PDF Stagione",
        season_results: "Risultati Stagione", current_catches: "Catture Attuali", no_catches: "Nessuna cattura.", too_small_title: "Pesce troppo piccolo", 
        too_small_desc: "Il pesce è troppo piccolo secondo le regole.", ok: "OK", ignore: "Ignora", angler_of_year: "Pescatore dell'Anno", edit_name: "Modifica Nome", 
        unranked_badge: "NON CLASSIFICATO", rank_pts: "Pti Class.", tournaments: "tornei", editing_disabled: "Modifica disabilitata, per favore modifica la lista nella pagina successiva",
        finish_warning: "Se termini l'evento ora, non potrai più modificare nulla.",
        status_finished: "Finito", status_ongoing: "In corso", place: "Posto", name: "Nome", points: "Punti", total_cm: "Totale", biggest_fish: "Pesce più grande", details: "Dettagli", generated_on: "Generato il",
        tournament_results: "Risultati del Torneo", rank_pts_best5: "Pti Class. (Migliori 5)", tournaments_played: "Tornei giocati", all_placements: "Tutti i piazzamenti", sort_newest: "Più recenti", sort_oldest: "Più vecchi", sort_az: "Nome A-Z",
        penalties: "Penalità", pts_deduct: "Punti da dedurre", reason_desc: "Motivo / Descrizione", add_penalty: "+ Aggiungi Penalità"
    },
    de: {
        login_title: "Anmeldung / Registrierung", login_desc: "Benutzername und Passwort eingeben.", username: "Benutzer", password: "Passwort", login_btn: "Anmelden / Registrieren",
        your_events: "Ihre Events", logout: "Abmelden", create_event: "+ Neues Event", step1_title: "Schritt 1: Setup", back: "← Zurück", home: "Startseite",
        tourn_name: "Turniername", ranked_tourn: "Gewertetes Turnier", ranked_desc: "In Jahresbestenliste aufnehmen (Max 7/Jahr)", bulk_part: "Teilnehmer",
        bulk_desc: "Namen einfügen. Symbole werden entfernt.", fish_species_title: "Arten & Multiplikatoren", add_species: "+ Art", start_event: "Event starten", next_btn: "Weiter",
        hub_title: "Turnier-Hub", edit_setup: "← Setup", manage_part: "Teilnehmer", add_new: "+ Neu", leaderboard: "Bestenliste", mode_pts: "Nach Punkten",
        mode_cm: "Nach Zentimetern", save_event: "Event speichern", finish_event: "Event beenden", modal_add_title: "Teilnehmer hinzufügen", close: "Abbrechen", add: "Hinzufügen",
        add_remove_fish: "Fisch Hinzufügen/Entfernen", species_sel: "Art", size_cm: "Größe (cm)", save: "Speichern", add_fish_btn: "+ Fisch Hinzufügen", edit_rules: "Regeln",
        add_rule: "+ Neue Regel", done: "Fertig", rule_from: "Von", rule_to: "Bis", rule_mult: "Multiplikator", download_chart: "PDF", download_season_pdf: "Saison-PDF",
        season_results: "Saisonergebnisse", current_catches: "Aktuelle Fänge", no_catches: "Keine Fänge.", too_small_title: "Fisch zu klein", 
        too_small_desc: "Der Fisch ist nach den Regeln zu klein.", ok: "OK", ignore: "Ignorieren", angler_of_year: "Angler des Jahres", edit_name: "Name bearbeiten", 
        unranked_badge: "NICHT GEWERTET", rank_pts: "Rang-Pkt", tournaments: "turniere", editing_disabled: "Bearbeitung deaktiviert, bitte auf der nächsten Seite bearbeiten",
        finish_warning: "Wenn Sie das Event jetzt beenden, können Sie nichts mehr ändern.",
        status_finished: "Beendet", status_ongoing: "Laufend", place: "Platz", name: "Name", points: "Punkte", total_cm: "Gesamt", biggest_fish: "Größter Fisch", details: "Details", generated_on: "Erstellt am",
        tournament_results: "Turnierergebnisse", rank_pts_best5: "Rang-Pkt (Top 5)", tournaments_played: "Gespielte Turniere", all_placements: "Alle Platzierungen", sort_newest: "Neueste zuerst", sort_oldest: "Älteste zuerst", sort_az: "Name A-Z",
        penalties: "Strafen", pts_deduct: "Abzuziehende Punkte", reason_desc: "Grund / Beschreibung", add_penalty: "+ Strafe hinzufügen"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        let key = el.getAttribute("data-i18n");
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
    if(!document.getElementById("setupSection").classList.contains("hidden")) refreshSetupUI();
    if(!document.getElementById("hubSection").classList.contains("hidden")) renderHubUI();
    if(!document.getElementById("rulesModal").classList.contains("hidden") && activeSpeciesIndex !== null) renderRules();
    if(!document.getElementById("fishModal").classList.contains("hidden") && activeFishParticipantIndex !== null) renderModalCatches();
    if(!document.getElementById("dashboardSection").classList.contains("hidden") && loadedEvents.length > 0) processDashboard();
}

function t(key) { return translations[currentLang] ? (translations[currentLang][key] || translations['en'][key] || key) : key; }

function handleOverlayClick(e, modalId) {
    if (e.target.id === modalId) {
        if (modalId === 'participantModal') closeAddParticipantModal();
        if (modalId === 'fishModal') closeFishModal();
        if (modalId === 'penaltyModal') closePenaltyModal();
        if (modalId === 'rulesModal') closeRulesModal();
        if (modalId === 'smallFishWarningModal') cancelSmallFish();
    }
}

function parseParticipants(rawText) {
    if (!rawText.trim()) return [];
    let cleaned = rawText.replace(/\([\s\S]*?\)|\[[\s\S]*?\]|\{[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/[0-9!@#$%^&*_+=\-\[\]{};':"\\|.<>\/?~`“”„«»]/g, ' ');
    return cleaned.split(/[\n,]+/).map(n => n.replace(/\s+/g, ' ').trim()).filter(n => n.length > 0);
}

window.addEventListener("popstate", (event) => {
    if (!loggedInUser) return;
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    
    let view = (event.state && event.state.view) ? event.state.view : "dashboardSection";
    
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    
    document.getElementById(view).classList.remove("hidden");
    window.scrollTo(0, 0);
});

function getEvTime(ev) { return parseInt(ev.id.replace('ev_', '')) || 0; }

function sortEventsArray(eventsArr, sortMode) {
    return eventsArr.sort((a, b) => {
        if (sortMode === 'newest') return getEvTime(b) - getEvTime(a);
        if (sortMode === 'oldest') return getEvTime(a) - getEvTime(b);
        if (sortMode === 'az') return a.name.localeCompare(b.name);
    });
}

function handleLoginRegister() {
    let user = document.getElementById("usernameInput").value.trim().toLowerCase();
    let pass = document.getElementById("passwordInput").value.trim();
    if (!user || !pass) { alert("Please enter both username and password."); return; }

    const userRef = db.collection("users").doc(user);
    userRef.get().then(doc => {
        if (doc.exists) {
            if (doc.data().password === pass) loginSuccess(user);
            else alert("Incorrect password for existing account.");
        } else {
            userRef.set({ password: pass, createdAt: new Date() }).then(() => loginSuccess(user));
        }
    }).catch(err => {
        console.error(err);
        alert("Database connection error. Please check configuration and database rules.");
    });
}

function loginSuccess(user) {
    loggedInUser = user;
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.getElementById("headerLogoutBtn").classList.remove("hidden");
    
    history.replaceState({view: 'dashboardSection'}, ""); 
    
    subscribeToEventsRealtime();
}

function handleLogout() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    loggedInUser = "";
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("headerLogoutBtn").classList.add("hidden");
}

function subscribeToEventsRealtime() {
    if (unsubscribeEventsListener) unsubscribeEventsListener();
    unsubscribeEventsListener = db.collection("events")
        .where("username", "==", loggedInUser)
        .onSnapshot(snapshot => {
            loadedEvents = [];
            snapshot.forEach(doc => { loadedEvents.push({ id: doc.id, ...doc.data() }); });
            processDashboard();

            if (currentEvent && !document.getElementById("hubSection").classList.contains("hidden")) {
                let activeUpdated = loadedEvents.find(e => e.id === currentEvent.id);
                if (activeUpdated) {
                    currentEvent = activeUpdated.details;
                    renderHubUI();
                }
            }
        });
}

function getEventPlacements(evDetails) {
    let processed = evDetails.participants.map(p => {
        let totalCm = 0; let totalPts = 0; let maxFishCm = 0; let amountCatches = (p.catches || []).length;
        (p.catches || []).forEach(c => {
            totalCm += c.size;
            if (c.size > maxFishCm) maxFishCm = c.size;
            totalPts += calculateFishPoints(c.abbr, c.size, evDetails.species || []);
        });
        let penPts = 0;
        if(p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;
        return { name: p.name, normName: (p.name || "unknown").toLowerCase().trim(), totalPts, totalCm, maxFishCm, amountCatches };
    });

    let caught = processed.filter(p => p.amountCatches > 0 && p.totalPts > 0);
    let zero = processed.filter(p => p.amountCatches === 0 || p.totalPts <= 0);

    caught.sort((a, b) => {
        if(b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
        return b.maxFishCm - a.maxFishCm; 
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
        return {
            name: angler.name,
            validEventsCount: angler.scores.length,
            totalRankPts: totalRankPts
        };
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
        
        let evStatus = ev.details.status || 'finished';
        let statusColor = evStatus === 'finished' ? 'background:#e2e8f0; color:#475569;' : 'background:#d1fae5; color:#059669;';
        let statusText = evStatus === 'finished' ? t('status_finished') : t('status_ongoing');
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
                <button class="danger icon-btn" onclick="deleteEvent('${ev.id}')" style="padding:10px 14px; box-shadow:none;">Del</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function showDashboard() {
    document.getElementById("setupSection").classList.add("hidden");
    document.getElementById("hubSection").classList.add("hidden");
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
        if(currentEvent.isStarted === undefined) currentEvent.isStarted = true;
        if(!currentEvent.status) currentEvent.status = "finished";
        
        document.getElementById("eventNameInput").value = currentEvent.name;
        document.getElementById("bulkParticipantsInput").value = currentEvent.participants.map(p => p.name).join("\n");
        document.getElementById("isRankedToggle").checked = currentEvent.isRanked !== false;
    } else {
        let defaultSpecies = [{ name: "Perch", abbr: "pr", tiers: [{ from: 0, to: "above", multiplier: 1.0 }] }];
        let savedDefaults = localStorage.getItem("lureboard_defaults_" + loggedInUser);
        if (savedDefaults) { try { defaultSpecies = JSON.parse(savedDefaults); } catch(e) {} }
        
        currentEvent = {
            id: "ev_" + Date.now(),
            name: "New Fishing Trip",
            date: new Date().toLocaleDateString(),
            year: new Date().getFullYear().toString(),
            status: "ongoing",
            isRanked: true,
            isStarted: false,
            species: defaultSpecies,
            participants: []
        };
        document.getElementById("eventNameInput").value = "";
        document.getElementById("bulkParticipantsInput").value = "";
        document.getElementById("isRankedToggle").checked = true;
    }
    
    updateParticipantCountStatus();
    refreshSetupUI();
}

function editEvent(id) {
    let found = loadedEvents.find(e => e.id === id);
    if (found) openEventEditor(found.details);
}

function deleteEvent(id) {
    if (confirm("Delete this event from the cloud?")) {
        db.collection("events").doc(id).delete();
    }
}

function updateParticipantCountStatus() {
    let rawText = document.getElementById("bulkParticipantsInput").value;
    let items = parseParticipants(rawText);
    document.getElementById("participantCountStatus").innerText = items.length;
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
            return `${fromVal}-${toVal}cm ${mult}x`;
        }).join(' | ');

        return `
        <div class="card" style="padding:16px; border:1px solid var(--border); margin-bottom:12px; background:var(--card-bg);">
            <div class="flex flex-between">
                <div>
                    <div class="flex">
                        <b style="font-size:16px; color:var(--text);">${s.name}</b>
                        <span class="badge" style="background:#f1f5f9; color:#0284c7; box-shadow:none;">${s.abbr.toUpperCase()}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:6px; font-weight:600;">
                        ${rulesSummary}
                    </div>
                </div>
                <div class="flex">
                    <button class="secondary icon-btn" onclick="openRulesModal(${sIdx})" style="box-shadow:none;">${t('edit_rules')}</button>
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

function goToEventHub() {
    currentEvent.name = document.getElementById("eventNameInput").value.trim() || "Untitled Event";
    let wantsRanked = document.getElementById("isRankedToggle").checked;
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
    let parsedNames = parseParticipants(document.getElementById("modalParticipantName").value);
    if (parsedNames.length === 0) return;
    parsedNames.forEach(name => { currentEvent.participants.push({ id: 'p_' + Math.random().toString(36).substr(2, 9), name: name, catches: [], penalties: [] }); });
    closeAddParticipantModal(); renderHubUI();
}

function editParticipantName(index) {
    let p = currentEvent.participants[index];
    let newName = prompt(t('edit_name') + ":", p.name);
    if (newName && newName.trim() !== "" && newName.trim() !== p.name) {
        p.name = newName.trim();
        renderHubUI();
        saveCurrentEvent(false);
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
    document.getElementById("modalFishSize").value = ""; renderModalCatches(); renderHubUI(); document.getElementById("modalFishSize").focus();
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
    
    container.innerHTML = `<label style="font-size:13px; color:var(--text-muted); margin-bottom:8px; display:block;">${t('current_catches')}:</label>` +
        p.catches.map((c, cIdx) => `
        <div class="flex flex-between" style="padding:12px 0; border-bottom:1px solid var(--border);">
            <span><b>${c.size}</b>cm <span class="badge" style="background:#f1f5f9; color:#0284c7; box-shadow:none;">${c.abbr.toUpperCase()}</span></span>
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

function calculateFishPoints(abbr, size, speciesList) {
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

    let filteredHtml = "";
    currentEvent.participants.forEach((p, pIndexReal) => {
        if (!p.name.toLowerCase().includes(query)) return;

        let catchesText = p.catches.length > 0 
            ? p.catches.map(c => `${c.size}cm ${c.abbr.toUpperCase()}`).join(', ') 
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

function renderLeaderboard() {
    let mode = document.getElementById("rankingMode").value;
    let container = document.getElementById("leaderboardContainer");
    let topSummaryContainer = document.getElementById("leaderboardTopSummary");

    let processed = currentEvent.participants.map(p => {
        let totalCm = 0; let totalPts = 0; let maxFishCm = 0; let maxFishAbbr = ""; let amountCatches = p.catches.length;
        p.catches.forEach(c => {
            totalCm += c.size;
            if (c.size > maxFishCm) { maxFishCm = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, currentEvent.species);
        });
        
        let penPts = 0;
        if(p.penalties) p.penalties.forEach(pen => penPts += parseFloat(pen.points));
        totalPts -= penPts;

        return { name: p.name, totalCm, totalPts, maxFishCm, maxFishAbbr, amountCatches, penPts, hasPenalty: penPts > 0 };
    });

    let sortedByMain = [...processed].sort((a, b) => {
        if(mode === 'points') {
            if(b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
            if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
            return b.maxFishCm - a.maxFishCm; 
        } else {
            if(b.totalCm !== a.totalCm) return b.totalCm - a.totalCm;
            if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches;
            return b.maxFishCm - a.maxFishCm;
        }
    });
    
    let sortedByBiggest = [...processed].sort((a, b) => b.maxFishCm - a.maxFishCm);

    if (sortedByBiggest.length > 0 && sortedByBiggest[0].maxFishCm > 0) {
        topSummaryContainer.innerHTML = `
            <div class="flex flex-between">
                <div>
                    <div style="font-size:12px; color:#b45309; font-weight:700; text-transform:uppercase; letter-spacing: 0.5px;">🏆 ${t('biggest_fish')}</div>
                    <div style="font-weight:700; font-size:18px; color:var(--text); margin-top:4px;">${sortedByBiggest[0].name}</div>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:20px; font-weight:800; color:var(--text);">${sortedByBiggest[0].maxFishCm}</span> cm
                    <div class="badge" style="background:#fef08a; color:#b45309; display:inline-block; margin-left:4px; box-shadow:none;">${sortedByBiggest[0].maxFishAbbr}</div>
                </div>
            </div>`;
        topSummaryContainer.classList.remove('hidden');
    } else { topSummaryContainer.classList.add('hidden'); }

    let html = `<table><tr><th style="width:50px;">#</th><th>${t('name')}</th><th>${t('points')}</th><th>${t('total_cm').toUpperCase()}</th><th>Amt</th><th>Max</th></tr>`;
    sortedByMain.forEach((p, idx) => {
        let placeBadge = (idx === 0) ? "🥇" : (idx === 1) ? "🥈" : (idx === 2) ? "🥉" : `${idx + 1}`;
        let maxDisplay = p.maxFishCm > 0 ? `${p.maxFishCm}<span style="font-size:11px; color:var(--text-muted); margin-left:2px;">${p.maxFishAbbr}</span>` : `-`;
        let penMarker = p.hasPenalty ? `<span style="color:var(--danger); font-size:10px; margin-left:4px;" title="-${p.penPts} pts">❗</span>` : '';
        html += `<tr>
            <td style="font-weight:bold; text-align:center;">${placeBadge}</td>
            <td style="font-weight:600; white-space:nowrap;">${p.name}${penMarker}</td>
            <td style="color:var(--primary); font-weight:700;">${p.totalPts.toFixed(1)}</td>
            <td>${p.totalCm.toFixed(1)}</td>
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
    .catch(err => { console.error("Save error:", err); alert("Failed to save event to cloud. Check your database rules."); });
}

function downloadChart(eventId = null) {
    let ev = currentEvent;
    if (eventId) { let found = loadedEvents.find(e => e.id === eventId); if (found) ev = found.details; }
    if (!ev || ev.participants.length === 0) { alert("No data to download."); return; }

    let processed = ev.participants.map(p => {
        let totalCm = 0, totalPts = 0, maxFishCm = 0, maxFishAbbr = "";
        p.catches.forEach(c => {
            totalCm += c.size;
            if (c.size > maxFishCm) { maxFishCm = c.size; maxFishAbbr = c.abbr.toUpperCase(); }
            totalPts += calculateFishPoints(c.abbr, c.size, ev.species);
        });
        
        let penPts = 0; let penStr = "";
        if(p.penalties && p.penalties.length > 0) {
            p.penalties.forEach(pn => penPts += parseFloat(pn.points));
            penStr = ` (Penalty: -${penPts})`;
        }
        totalPts -= penPts;

        return { name: p.name, totalCm, totalPts, maxFishCm, maxFishAbbr, amountCatches: p.catches.length, allCatchesStr: p.catches.map(c => `${c.size}cm ${c.abbr.toUpperCase()}`).join(', ') || "-", penStr };
    });

    processed.sort((a, b) => {
        if(b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if(a.amountCatches !== b.amountCatches) return a.amountCatches - b.amountCatches; 
        return b.maxFishCm - a.maxFishCm; 
    });

    let htmlContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; width: 1000px; margin: 0 auto; background: white;">
            <h2 style="margin-bottom: 8px; color: #4f46e5; font-size:28px;">${t('tournament_results')}: ${ev.name}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">${t('generated_on')}: ${new Date().toLocaleDateString()}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
                <thead><tr style="background-color: #4f46e5; color: #ffffff;">
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('place')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('name')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('points')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('total_cm')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">Amt</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5;">${t('biggest_fish')}</th>
                    <th style="padding: 12px; border: 1px solid #c7d2fe; color: #ffffff !important; background-color: #4f46e5; width: 40%;">${t('details')}</th>
                </tr></thead>
                <tbody>${processed.map((p, i) => `
                    <tr style="${i % 2 === 0 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${i + 1}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${p.name}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; color: #4f46e5; font-weight: bold;">${p.totalPts.toFixed(1)}${p.penStr ? `<br><span style="color:#e11d48; font-size:11px;">${p.penStr}</span>` : ''}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.totalCm.toFixed(1)}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.amountCatches}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.maxFishCm > 0 ? `${p.maxFishCm}cm ${p.maxFishAbbr}` : '-'}</td>
                        <td style="padding: 12px; border: 1px solid #e2e8f0; color: #475569; font-size: 13px; line-height: 1.4;">${p.allCatchesStr}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    let opt = { margin: 0.3, filename: `${ev.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' } };
    let tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlContent; html2pdf().set(opt).from(tempDiv).save();
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
        return { name: angler.name, validEventsCount: angler.scores.length, totalRankPts: totalRankPts, allScoresStr: sortedScores.join(', ') };
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
