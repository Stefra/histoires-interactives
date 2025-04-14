// Attend que toute la page HTML soit chargée
document.addEventListener('DOMContentLoaded', () => {

    // --- Gestion du Lancer de Dé (Version Améliorée) ---
    const diceButtons = document.querySelectorAll('.dice-roll-button');
    const diceResultArea = document.getElementById('dice-result-area');
    if (diceResultArea) {
        diceButtons.forEach(button => {
            button.addEventListener('click', () => { // Début event listener bouton dé

                button.disabled = true;
                const storyId = button.dataset.storyId;
                const outcomesString = button.dataset.outcomes;

                if (!storyId || !outcomesString) {
                    diceResultArea.textContent = "Erreur : Configuration du bouton (storyId ou outcomes) manquante.";
                    console.error("Attributs data-story-id ou data-outcomes manquants:", button.dataset);
                    return;
                }

                let outcomes;
                try {
                    outcomes = JSON.parse(outcomesString);
                } catch (e) {
                    diceResultArea.textContent = "Erreur : Impossible de lire les résultats possibles (JSON invalide).";
                    console.error("Erreur parsing JSON pour outcomes:", outcomesString, e);
                    return;
                }

                if (!Array.isArray(outcomes) || outcomes.length === 0) {
                    diceResultArea.textContent = "Erreur : Aucun résultat possible défini pour ce lancer.";
                    console.error("La structure 'outcomes' est vide ou n'est pas un tableau:", outcomes);
                    return;
                }

                diceResultArea.innerHTML = "Lancement du dé... <span class='dice-animation'>🎲</span>";

                setTimeout(() => { // Délai avant lancer
                    const roll = Math.floor(Math.random() * 6) + 1;
                    let targetStepId = null;
                    let resultDescription = "";

                    const matchingOutcome = outcomes.find(outcome =>
                        Array.isArray(outcome.rolls) && outcome.rolls.includes(roll)
                    );

                    if (matchingOutcome) {
                        targetStepId = matchingOutcome.target;
                        resultDescription = matchingOutcome.description || "";
                        if (!targetStepId) {
                             diceResultArea.textContent = `Erreur : Résultat ${roll} (${resultDescription}) trouvé, mais pas de cible définie.`;
                             console.error("Aucune 'target' définie pour l'outcome correspondant au jet:", roll, matchingOutcome);
                             return;
                        }
                    } else {
                        diceResultArea.textContent = `Erreur : Aucun résultat défini pour le jet ${roll} ! Vérifiez la configuration.`;
                        console.error("Aucun outcome trouvé pour le jet:", roll, "dans outcomes:", outcomes);
                        return;
                    }

                    let resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll}`;
                    if (resultDescription) {
                        resultMessage += ` (${resultDescription})`;
                    }
                    diceResultArea.innerHTML = resultMessage;

                    setTimeout(() => { // Délai avant redirection
                        const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`;
                        window.location.href = nextPageUrl;
                    }, 1800); // Fin délai redirection

                }, 1000); // Fin délai avant lancer
            }); // Fin event listener bouton dé
        }); // Fin forEach bouton dé
    } // Fin if (diceResultArea)

    // --- Sauvegarde de Progression (Version 3: avec statut Neutre) ---
    const storyContainer = document.querySelector('.etape-contenu');
    if (storyContainer) {
        const pathParts = window.location.pathname.split('/').filter(part => part !== '');
        if (pathParts.length === 3 && pathParts[0] === 'histoires') {
            const currentStoryId = pathParts[1];
            const currentStepId = pathParts[2];
            const storageKey = `storyData_${currentStoryId}`;
            let currentStatus = 'in_progress';
            const endingDiv = document.querySelector('.fin');
            if (endingDiv) {
                const endingType = endingDiv.dataset.endingType;
                if (endingType === 'Réussie' || endingType === 'À suivre') {
                    currentStatus = 'completed';
                } else if (endingType === 'Échec') {
                    currentStatus = 'lost';
                } else if (endingType === 'Neutre') {
                    currentStatus = 'finished_neutral';
                }
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

    // --- Logique pour la Page d'Accueil (Mise à jour Statut/Bouton ET Filtres) ---
    const storyListContainer = document.querySelector('.story-list');
    const filterContainer = document.querySelector('.category-filters');
    let storyCards = []; // Défini en dehors pour être accessible par les deux parties
    if (storyListContainer) {
      storyCards = storyListContainer.querySelectorAll('.story-card');
    }

    // 1. Mise à jour du statut et des boutons
    if (storyListContainer && storyCards.length > 0) {
        storyCards.forEach(card => {
            const storyId = card.dataset.storyId;
            const storyLink = card.querySelector('.story-link');
            const statusDisplay = card.querySelector('.story-status');
            const startStepId = card.dataset.startStep;

            if (!storyId || !storyLink || !statusDisplay || !startStepId) { return; } // Simplifié

            const storageKey = `storyData_${storyId}`;
            try {
                const storedDataString = localStorage.getItem(storageKey);
                let lastStep = null; let status = null;
                if (storedDataString) {
                    try { const storedData = JSON.parse(storedDataString); lastStep = storedData.lastStep; status = storedData.status; }
                    catch (parseError) { console.error(`Erreur parsing JSON pour ${storyId}:`, parseError); }
                }

                statusDisplay.textContent = ''; statusDisplay.className = 'story-status';
                if (status === 'completed') { statusDisplay.textContent = 'Terminé 🎉'; statusDisplay.classList.add('status-completed'); }
                else if (status === 'lost') { statusDisplay.textContent = 'Perdu 💥'; statusDisplay.classList.add('status-lost'); }
                else if (status === 'finished_neutral') { statusDisplay.textContent = 'Fin 😐'; statusDisplay.classList.add('status-neutral'); }

                if (status === 'completed' || status === 'lost' || status === 'finished_neutral') {
                    storyLink.textContent = 'Recommencer'; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`); storyLink.classList.remove('resume-link');
                } else if (lastStep && lastStep !== startStepId) {
                    storyLink.textContent = 'Reprendre l\'aventure'; storyLink.setAttribute('href', `/histoires/${storyId}/${lastStep}/`); storyLink.classList.add('resume-link');
                } else {
                    storyLink.textContent = 'Commencer l\'aventure'; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`); storyLink.classList.remove('resume-link');
                }
            } catch (e) { console.error("Erreur lors de la lecture/mise à jour de la progression:", e); }
        });

        // 2. Ajout de l'avertissement Local Storage
        const warningElement = document.querySelector('.local-storage-warning');
        if (!warningElement) {
            const newWarning = document.createElement('p');
            newWarning.classList.add('local-storage-warning');
            newWarning.innerHTML = `<strong>Attention :</strong> Votre progression est sauvegardée uniquement sur <u>cet appareil</u> et dans <u>ce navigateur</u>...`;
            storyListContainer.insertAdjacentElement('afterend', newWarning);
        }
    }

    // 3. Mise en place des Filtres de Catégorie
    if (filterContainer && storyCards.length > 0) {
        const filterButtons = filterContainer.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filterValue = button.dataset.filter;
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                storyCards.forEach(card => { // Utilise storyCards défini plus haut
                    const cardCategory = card.dataset.category;
                    if (filterValue === 'all' || cardCategory === filterValue) { card.style.display = ''; }
                    else { card.style.display = 'none'; }
                });
            });
        });
    }

}); // Fin de l'écouteur DOMContentLoaded