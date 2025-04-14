// Attend que toute la page HTML soit chargée
document.addEventListener('DOMContentLoaded', () => {

    // --- Gestion du Lancer de Dé ---
    const diceButtons = document.querySelectorAll('.dice-roll-button');
    const diceResultArea = document.getElementById('dice-result-area');
    if (diceResultArea) {
        diceButtons.forEach(button => {
            button.addEventListener('click', () => {
                button.disabled = true;
                const storyId = button.dataset.storyId;
                const successRoll = parseInt(button.dataset.successRoll, 10);
                const successTarget = button.dataset.successTarget;
                const failureTarget = button.dataset.failureTarget;

                if (!storyId || isNaN(successRoll) || !successTarget || !failureTarget) {
                    diceResultArea.textContent = "Erreur : Configuration du bouton incorrecte.";
                    console.error("Attributs data-* manquants ou invalides sur le bouton de dé :", button.dataset);
                    return;
                }
                diceResultArea.innerHTML = "Lancement du dé... <span class='dice-animation'>🎲</span>";
                setTimeout(() => {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    let targetStepId;
                    let resultMessage;
                    if (roll >= successRoll) {
                        targetStepId = successTarget;
                        resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Réussite !)`;
                    } else {
                        targetStepId = failureTarget;
                        resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Échec)`;
                    }
                    diceResultArea.innerHTML = resultMessage;
                    setTimeout(() => {
                        const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`;
                        window.location.href = nextPageUrl;
                    }, 1800);
                }, 1000);
            });
        });
    }

    // --- Sauvegarde de Progression (Version 3: avec statut Neutre) ---
    const storyContainer = document.querySelector('.etape-contenu');
    if (storyContainer) {
        const pathParts = window.location.pathname.split('/').filter(part => part !== '');
        if (pathParts.length === 3 && pathParts[0] === 'histoires') {
            const currentStoryId = pathParts[1];
            const currentStepId = pathParts[2];
            const storageKey = `storyData_${currentStoryId}`;
            let currentStatus = 'in_progress'; // Statut par défaut
            const endingDiv = document.querySelector('.fin');
            if (endingDiv) {
                const endingType = endingDiv.dataset.endingType;
                // Détermine le statut en fonction du type de fin
                if (endingType === 'Réussie' || endingType === 'À suivre') {
                    currentStatus = 'completed';
                } else if (endingType === 'Échec') {
                    currentStatus = 'lost';
                } else if (endingType === 'Neutre') { // <-- Condition ajoutée pour Neutre
                    currentStatus = 'finished_neutral'; // Nouveau statut
                }
                // Si le type n'est aucun de ceux-là, currentStatus reste 'in_progress'
            }
            const dataToStore = { lastStep: currentStepId, status: currentStatus };
            try {
                localStorage.setItem(storageKey, JSON.stringify(dataToStore));
                console.log(`Données sauvegardées: Histoire ${currentStoryId}`, dataToStore);
            } catch (e) {
                console.error("Erreur lors de la sauvegarde dans le Local Storage:", e);
            }
        }
    }

    // --- Vérification Progression sur l'Accueil (Version 3: avec statut Neutre) ---
    const storyListContainer = document.querySelector('.story-list');
    // On définit storyCards ici pour qu'il soit accessible par les deux parties (statut et filtre)
    let storyCards = [];
    if (storyListContainer) {
      storyCards = storyListContainer.querySelectorAll('.story-card');
    }


    // 1. Mise à jour du statut et des boutons (si on est sur l'accueil et qu'il y a des cartes)
    if (storyListContainer && storyCards.length > 0) {
        storyCards.forEach(card => {
            const storyId = card.dataset.storyId;
            const storyLink = card.querySelector('.story-link');
            const statusDisplay = card.querySelector('.story-status');
            const startStepId = card.dataset.startStep;

            if (!storyId || !storyLink || !statusDisplay || !startStepId) {
                console.warn("Carte d'histoire incomplète :", card);
                return;
            }
            const storageKey = `storyData_${storyId}`;
            try {
                const storedDataString = localStorage.getItem(storageKey);
                let lastStep = null;
                let status = null;
                if (storedDataString) {
                    try {
                        const storedData = JSON.parse(storedDataString);
                        lastStep = storedData.lastStep;
                        status = storedData.status;
                    } catch (parseError) { console.error(`Erreur parsing JSON pour ${storyId}:`, parseError); }
                }

                // Mise à jour affichage statut
                statusDisplay.textContent = ''; // Vide d'abord
                statusDisplay.className = 'story-status'; // Reset classes
                if (status === 'completed') {
                    statusDisplay.textContent = 'Terminé 🎉';
                    statusDisplay.classList.add('status-completed');
                } else if (status === 'lost') {
                    statusDisplay.textContent = 'Perdu 💥';
                    statusDisplay.classList.add('status-lost');
                } else if (status === 'finished_neutral') { // <-- Condition ajoutée
                    statusDisplay.textContent = 'Fin 😐'; // Affichage pour Neutre
                    statusDisplay.classList.add('status-neutral'); // Classe CSS pour Neutre
                }

                // Mise à jour bouton : Recommencer pour TOUS les statuts de fin
                if (status === 'completed' || status === 'lost' || status === 'finished_neutral') { // <-- Condition ajoutée
                    storyLink.textContent = 'Recommencer';
                    storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`);
                    storyLink.classList.remove('resume-link'); // Enlève le style vert si besoin
                } else if (lastStep && lastStep !== startStepId) { // Cas "Reprendre"
                    storyLink.textContent = 'Reprendre l\'aventure';
                    storyLink.setAttribute('href', `/histoires/${storyId}/${lastStep}/`);
                    storyLink.classList.add('resume-link');
                } else { // Cas "Commencer" par défaut
                    storyLink.textContent = 'Commencer l\'aventure';
                    storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`);
                    storyLink.classList.remove('resume-link');
                }
            } catch (e) { console.error("Erreur lors de la lecture/mise à jour de la progression:", e); }
        });

        // 2. Ajout de l'avertissement Local Storage (s'il n'est pas déjà là)
        const warningElement = document.querySelector('.local-storage-warning');
        if (!warningElement) {
            const newWarning = document.createElement('p');
            newWarning.classList.add('local-storage-warning');
            newWarning.innerHTML = `<strong>Attention :</strong> Votre progression est sauvegardée uniquement sur <u>cet appareil</u> et dans <u>ce navigateur</u>. Changer d'appareil ou effacer les données de navigation entraînera la perte de vos sauvegardes.`;
            storyListContainer.insertAdjacentElement('afterend', newWarning);
        }
    } // Fin if (storyListContainer)

    // --- Filtrage par Catégorie d'Âge sur l'Accueil ---
    const filterContainer = document.querySelector('.category-filters');
    // On utilise les storyCards déjà récupérées si elles existent
    if (filterContainer && storyCards.length > 0) {
        const filterButtons = filterContainer.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterValue = button.dataset.filter;
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // On utilise la variable storyCards définie plus haut
                storyCards.forEach(card => {
                    const cardCategory = card.dataset.category;
                    if (filterValue === 'all' || cardCategory === filterValue) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    } // Fin if (filterContainer && storyCards.length > 0)

}); // Fin de l'écouteur DOMContentLoaded