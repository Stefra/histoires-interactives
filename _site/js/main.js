// Attend que toute la page HTML soit chargée
document.addEventListener('DOMContentLoaded', () => {

    // --- Fonctions Utilitaires (Inventaire, Sauvegarde) ---

    let globalItemsData = null; // Cache pour les données des objets

    // Charge les données des items depuis items.json (une seule fois)
    async function fetchItemsData() {
        if (globalItemsData === null) { // Vérifie si déjà chargé ou en erreur
            try {
                const response = await fetch('/items.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                globalItemsData = await response.json();
                console.log("Items data loaded:", globalItemsData);
            } catch (error) {
                console.error('Impossible de charger items.json:', error);
                globalItemsData = {}; // Met un objet vide en cas d'erreur pour éviter de retenter
            }
        }
        return globalItemsData;
    }

    // Fonction pour récupérer l'inventaire actuel d'une histoire
    function getCurrentInventory(storyId) {
        const storageKey = `storyData_${storyId}`;
        try {
            const storedDataString = localStorage.getItem(storageKey);
            if (storedDataString) {
                const storedData = JSON.parse(storedDataString);
                return Array.isArray(storedData.inventory) ? storedData.inventory : [];
            }
        } catch (e) { console.error("Erreur lecture inventaire:", e); }
        return [];
    }

    // Fonction pour sauvegarder les données (progression + inventaire)
    function saveData(storyId, stepId, status, inventory) {
        const storageKey = `storyData_${storyId}`;
        const dataToStore = {
            lastStep: stepId,
            status: status,
            inventory: Array.isArray(inventory) ? inventory : []
        };
        try {
            localStorage.setItem(storageKey, JSON.stringify(dataToStore));
            console.log(`Données sauvegardées: Histoire ${storyId}`, dataToStore);
        } catch (e) { console.error("Erreur sauvegarde LocalStorage:", e); }
    }


    // --- Logique pour le Panneau d'Inventaire ---

    const inventoryToggleButton = document.getElementById('inventory-toggle');
    const inventoryPanel = document.getElementById('inventory-panel');
    const inventoryList = document.getElementById('inventory-list');
    const inventoryCloseButton = document.getElementById('inventory-close');

    if (inventoryToggleButton && inventoryPanel && inventoryCloseButton && inventoryList) {
        inventoryToggleButton.addEventListener('click', async () => {
            inventoryPanel.classList.toggle('hidden'); // Affiche/cache d'abord
            if (!inventoryPanel.classList.contains('hidden')) { // Si on vient de l'afficher
                inventoryList.innerHTML = '<li>Chargement...</li>'; // Message attente
                const items = await fetchItemsData(); // Charge les data items si besoin
                const pathParts = window.location.pathname.split('/').filter(part => part !== '');
                let currentInventory = [];
                let storyIdForInventory = null;

                if (pathParts.length === 3 && pathParts[0] === 'histoires') {
                    storyIdForInventory = pathParts[1];
                    currentInventory = getCurrentInventory(storyIdForInventory);
                }

                // Remplit la liste
                inventoryList.innerHTML = ''; // Vide la liste
                if (currentInventory.length > 0 && storyIdForInventory) {
                     currentInventory.forEach(itemId => {
                        const itemInfo = items[itemId];
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${itemInfo ? itemInfo.name : itemId}</strong>${itemInfo && itemInfo.description ? `: ${itemInfo.description}` : ''}`;
                        inventoryList.appendChild(li);
                    });
                } else {
                    inventoryList.innerHTML = '<li>Votre sac à dos est vide pour cette aventure.</li>';
                }
            }
        });
        inventoryCloseButton.addEventListener('click', () => {
            inventoryPanel.classList.add('hidden');
        });
    } else {
         if(inventoryToggleButton) inventoryToggleButton.style.display = 'none';
    }


    // --- Gestion du Lancer de Dé (sur les pages d'histoire) ---
    const diceButtons = document.querySelectorAll('.dice-roll-button');
    const diceResultArea = document.getElementById('dice-result-area');
    if (diceResultArea && diceButtons.length > 0) {
        diceButtons.forEach(button => {
            button.addEventListener('click', () => {
                 button.disabled = true;
                const storyId = button.dataset.storyId;
                const outcomesString = button.dataset.outcomes;
                if (!storyId || !outcomesString) { diceResultArea.textContent = "Erreur Config Bouton"; console.error("Data manque", button.dataset); return; }
                let outcomes; try { outcomes = JSON.parse(outcomesString); } catch (e) { diceResultArea.textContent="Erreur JSON"; console.error(e); return; }
                if (!Array.isArray(outcomes) || outcomes.length === 0) { diceResultArea.textContent="Erreur Outcomes"; console.error(outcomes); return; }
                diceResultArea.innerHTML = "Lancement... <span class='dice-animation'>🎲</span>";
                setTimeout(() => {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    let targetStepId = null; let resultDescription = "";
                    const matchingOutcome = outcomes.find(o => Array.isArray(o.rolls) && o.rolls.includes(roll));
                    if (matchingOutcome) {
                        targetStepId = matchingOutcome.target; resultDescription = matchingOutcome.description || "";
                        if (!targetStepId) { diceResultArea.textContent = `Erreur cible pour ${roll}`; console.error(matchingOutcome); return; }
                    } else { diceResultArea.textContent = `Erreur jet ${roll}`; console.error(outcomes); return; }
                    let resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll}${resultDescription ? ` (${resultDescription})` : ''}`;
                    diceResultArea.innerHTML = resultMessage;
                    setTimeout(() => { const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`; window.location.href = nextPageUrl; }, 1800);
                }, 1000);
            });
        });
    }


    // --- Logique exécutée sur les Pages d'Histoire ---
    const storyContainer = document.querySelector('.etape-contenu');
    if (storyContainer) { // Code spécifique aux pages d'étape
        const pathParts = window.location.pathname.split('/').filter(part => part !== '');
        if (pathParts.length === 3 && pathParts[0] === 'histoires') {
            const currentStoryId = pathParts[1];
            const currentStepId = pathParts[2];
            let inventory = getCurrentInventory(currentStoryId);
            const grantedItem = storyContainer.dataset.grantsItem;
            const pickupMessageDiv = document.getElementById('item-pickup-message');

            // 1. Gérer l'obtention d'objet
            if (grantedItem && !inventory.includes(grantedItem)) {
                inventory.push(grantedItem);
                if (pickupMessageDiv) {
                   fetchItemsData().then(items => {
                       const itemInfo = items[grantedItem];
                       pickupMessageDiv.textContent = `✨ Objet trouvé : ${itemInfo ? itemInfo.name : grantedItem} ! Ajouté au sac à dos.`;
                   });
                }
            } else if (pickupMessageDiv) { pickupMessageDiv.textContent = ''; }

            // 2. Déterminer le statut actuel et sauvegarder
            let currentStatus = 'in_progress';
            const endingDiv = document.querySelector('.fin');
            if (endingDiv) {
                const endingType = endingDiv.dataset.endingType;
                if (endingType === 'Réussie' || endingType === 'À suivre') { currentStatus = 'completed'; }
                else if (endingType === 'Échec') { currentStatus = 'lost'; }
                else if (endingType === 'Neutre') { currentStatus = 'finished_neutral'; }
            }
            saveData(currentStoryId, currentStepId, currentStatus, inventory); // Sauvegarde TOUT (step, status, inventaire à jour)

            // 3. Gérer les choix conditionnels
            const choiceElements = document.querySelectorAll('.choix li > *');
             choiceElements.forEach(choice => {
                 const requiredItem = choice.dataset.requiresItem;
                 if (requiredItem) {
                     if (!inventory.includes(requiredItem)) {
                         choice.style.display = 'none'; // Masque si objet manquant
                         console.log(`Choix masqué car l'objet '${requiredItem}' est manquant.`);
                     } else {
                          choice.style.display = ''; // Assure qu'il est visible si objet présent
                     }
                 }
             });
        }
    } // Fin if(storyContainer)


    // --- Logique Exécutée sur la Page d'Accueil ---

    // Fonction pour mettre à jour les cartes sur l'accueil
    function updateStoryCardStatus() {
        const storyCards = document.querySelectorAll('.story-list .story-card');
        if (storyCards.length === 0) return; // Sort si pas de cartes

        storyCards.forEach(card => {
            const storyId = card.dataset.storyId;
            const storyLink = card.querySelector('.story-link');
            const statusDisplay = card.querySelector('.story-status');
            const startStepId = card.dataset.startStep;

            if (!storyId || !storyLink || !statusDisplay || !startStepId) { return; }

            const storageKey = `storyData_${storyId}`;
            try {
                const storedDataString = localStorage.getItem(storageKey);
                let lastStep = null; let status = null;
                if (storedDataString) {
                    try { const storedData = JSON.parse(storedDataString); lastStep = storedData.lastStep; status = storedData.status; }
                    catch (parseError) { console.error(`Erreur parsing JSON pour ${storyId}:`, parseError); }
                }

                statusDisplay.textContent = ''; statusDisplay.className = 'story-status'; // Reset
                if (status === 'completed') { statusDisplay.textContent = 'Terminé 🎉'; statusDisplay.classList.add('status-completed'); }
                else if (status === 'lost') { statusDisplay.textContent = 'Perdu 💥'; statusDisplay.classList.add('status-lost'); }
                else if (status === 'finished_neutral') { statusDisplay.textContent = 'Fin 😐'; statusDisplay.classList.add('status-neutral'); }

                storyLink.classList.remove('resume-link'); // Reset style bouton
                if (status === 'completed' || status === 'lost' || status === 'finished_neutral') {
                    storyLink.textContent = 'Recommencer'; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`);
                } else if (lastStep && lastStep !== startStepId) {
                    storyLink.textContent = "Reprendre l'aventure"; storyLink.setAttribute('href', `/histoires/${storyId}/${lastStep}/`); storyLink.classList.add('resume-link');
                } else {
                    storyLink.textContent = "Commencer l'aventure"; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`);
                }
            } catch (e) { console.error("Erreur lecture/màj progression accueil:", e); }
        });
    }

    // Fonction pour ajouter l'avertissement Local Storage
    function addLocalStorageWarning() {
        const storyListContainer = document.querySelector('.story-list');
        const warningElement = document.querySelector('.local-storage-warning');
        if (storyListContainer && !warningElement) {
            const newWarning = document.createElement('p');
            newWarning.classList.add('local-storage-warning');
            newWarning.innerHTML = `<strong>Attention :</strong> Votre progression et votre inventaire sont sauvegardés uniquement sur <u>cet appareil</u> et dans <u>ce navigateur</u>...`;
            storyListContainer.insertAdjacentElement('afterend', newWarning);
        }
    }

    // Fonction pour configurer les filtres de catégorie
    function setupCategoryFilters() {
        const filterContainer = document.querySelector('.category-filters');
        const storyListContainer = document.querySelector('.story-list'); // Re-select ici
        if (filterContainer && storyListContainer) {
             const storyCards = storyListContainer.querySelectorAll('.story-card'); // Re-select ici
             if (storyCards.length === 0) return;

            const filterButtons = filterContainer.querySelectorAll('.filter-button');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const filterValue = button.dataset.filter;
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    storyCards.forEach(card => {
                        const cardCategory = card.dataset.category;
                        if (filterValue === 'all' || cardCategory === filterValue) { card.style.display = ''; }
                        else { card.style.display = 'none'; }
                    });
                });
            });
        }
    }

    // Fonction principale pour charger les histoires sur l'accueil
    async function loadAndDisplayStories() {
        const storyListContainer = document.querySelector('.story-list');
        const filterContainer = document.querySelector('.category-filters'); // Trouve le conteneur des filtres

        if (!storyListContainer) { return; } // Ne fait rien si pas sur l'accueil

        storyListContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Chargement des histoires...</p>';
        if (filterContainer) filterContainer.style.display = 'none'; // Cache les filtres pendant le chargement

        try {
            const response = await fetch('/.netlify/functions/get-stories'); // Appelle la fonction Netlify
            if (!response.ok) { throw new Error(`Erreur ${response.status}: ${response.statusText}`); }
            const stories = await response.json();

            storyListContainer.innerHTML = ''; // Vide le chargement

            if (!stories || stories.length === 0) {
                storyListContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Aucune histoire disponible.</p>';
                return; // Pas besoin d'afficher filtres ou avertissement si pas d'histoires
            }

             if (filterContainer) filterContainer.style.display = ''; // Affiche les filtres

            stories.forEach(story => {
                const card = document.createElement('div');
                card.classList.add('story-card');
                card.dataset.category = story.age_category || 'Inconnue';
                card.dataset.storyId = story.story_id;
                card.dataset.startStep = story.start_step_id;

                card.innerHTML = `
                    ${story.cover_image_url ? `<img class="story-image" src="${story.cover_image_url}" alt="Illustration pour ${story.title}">` : ''}
                    <div class="story-content">
                        <span class="story-status"></span>
                        <h2 class="story-title">${story.title}</h2>
                        ${story.description ? `<p class="story-description">${story.description}</p>` : ''}
                        <a class="story-link" href="/histoires/${story.story_id}/${story.start_step_id}/">Commencer l'aventure</a>
                    </div>
                `;
                storyListContainer.appendChild(card);
            });

            updateStoryCardStatus(); // Met à jour les statuts/boutons des cartes créées
            setupCategoryFilters(); // Attache les événements aux filtres
            addLocalStorageWarning(); // Ajoute l'avertissement

        } catch (error) {
            console.error("Erreur chargement histoires:", error);
            storyListContainer.innerHTML = `<p style="text-align: center; color: #c0392b;">Oups ! Impossible de charger les histoires. (${error.message})</p>`;
            if (filterContainer) filterContainer.style.display = 'none'; // Cache les filtres
        }
    }

    // --- Point d'Entrée Principal ---
    // Si on est sur une page qui pourrait être l'accueil (on vérifie la présence de story-list)
    if (document.querySelector('.story-list')) {
        loadAndDisplayStories(); // Lance le chargement dynamique
    }

    // Le code de sauvegarde sur les pages d'histoire et le code de l'inventaire (attaché à DOMContentLoaded) s'exécuteront aussi si les éléments correspondants sont trouvés.


}); // Fin de l'écouteur DOMContentLoaded