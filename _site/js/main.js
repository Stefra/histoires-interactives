
document.addEventListener('DOMContentLoaded', () => {


    const inventoryToggleButton = document.getElementById('inventory-toggle');
    const inventoryPanel = document.getElementById('inventory-panel');
    const inventoryList = document.getElementById('inventory-list');
    const inventoryCloseButton = document.getElementById('inventory-close');
    let globalItemsData = null;

 
    async function fetchItemsData() {
      if (!globalItemsData) {
          try {
              const response = await fetch('/items.json'); 
              if (!response.ok) throw new Error('Network response was not ok');
              globalItemsData = await response.json();
              console.log("Items data loaded:", globalItemsData);
          } catch (error) {
              console.error('Impossible de charger items.json:', error);
              globalItemsData = {}; 
          }
      }
      return globalItemsData;
    }
    
     fetchItemsData();

    
    function getCurrentInventory(storyId) {
        const storageKey = `storyData_${storyId}`;
        try {
            const storedDataString = localStorage.getItem(storageKey);
            if (storedDataString) {
                const storedData = JSON.parse(storedDataString);
                
                return Array.isArray(storedData.inventory) ? storedData.inventory : [];
            }
        } catch (e) {
            console.error("Erreur lecture inventaire depuis LocalStorage:", e);
        }
        return []; 
    }

    
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
        } catch (e) {
            console.error("Erreur sauvegarde LocalStorage:", e);
        }
    }

    
    if (inventoryToggleButton && inventoryPanel && inventoryCloseButton && inventoryList) {
        inventoryToggleButton.addEventListener('click', async () => {
            const items = await fetchItemsData(); 
            const pathParts = window.location.pathname.split('/').filter(part => part !== '');
            let currentInventory = [];
            
            if (pathParts.length === 3 && pathParts[0] === 'histoires') {
                 currentInventory = getCurrentInventory(pathParts[1]);
            } else {
                
                 console.log("Bouton inventaire cliqué hors page d'histoire.");
                
            }


            
            inventoryList.innerHTML = ''; 
            if (currentInventory.length > 0) {
                currentInventory.forEach(itemId => {
                    const itemInfo = items[itemId];
                    if (itemInfo) {
                        const li = document.createElement('li');
                        li.innerHTML = `<strong>${itemInfo.name || itemId}</strong>: ${itemInfo.description || 'Aucune description'}`;
                        inventoryList.appendChild(li);
                    } else {
                         const li = document.createElement('li');
                         li.textContent = itemId; 
                         inventoryList.appendChild(li);
                    }
                });
            } else {
                inventoryList.innerHTML = '<li>Votre sac à dos est vide.</li>';
            }

            
            inventoryPanel.classList.toggle('hidden');
        });

        inventoryCloseButton.addEventListener('click', () => {
            inventoryPanel.classList.add('hidden');
        });
    } else {
       
       if(inventoryToggleButton) inventoryToggleButton.style.display = 'none';
    }


    
    const diceButtons = document.querySelectorAll('.dice-roll-button');
    const diceResultArea = document.getElementById('dice-result-area');
    if (diceResultArea && diceButtons.length > 0) { 
        diceButtons.forEach(button => {
            button.addEventListener('click', () => {
                
                 button.disabled = true;
                const storyId = button.dataset.storyId;
                const outcomesString = button.dataset.outcomes;
                if (!storyId || !outcomesString) { /*...*/ return; }
                let outcomes; try { outcomes = JSON.parse(outcomesString); } catch (e) { /*...*/ return; }
                if (!Array.isArray(outcomes) || outcomes.length === 0) { /*...*/ return; }
                diceResultArea.innerHTML = "Lancement du dé... <span class='dice-animation'>🎲</span>";
                setTimeout(() => {
                    const roll = Math.floor(Math.random() * 6) + 1;
                    let targetStepId = null; let resultDescription = "";
                    const matchingOutcome = outcomes.find(o => Array.isArray(o.rolls) && o.rolls.includes(roll));
                    if (matchingOutcome) {
                        targetStepId = matchingOutcome.target; resultDescription = matchingOutcome.description || "";
                        if (!targetStepId) { /*...*/ return; }
                    } else { /*...*/ return; }
                    let resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll}`;
                    if (resultDescription) { resultMessage += ` (${resultDescription})`; }
                    diceResultArea.innerHTML = resultMessage;
                    setTimeout(() => { const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`; window.location.href = nextPageUrl; }, 1800);
                }, 1000);
            });
        });
    }

    
    const storyContainer = document.querySelector('.etape-contenu');
    if (storyContainer) {
        const pathParts = window.location.pathname.split('/').filter(part => part !== '');
        if (pathParts.length === 3 && pathParts[0] === 'histoires') {
            const currentStoryId = pathParts[1];
            const currentStepId = pathParts[2];

            
            let inventory = getCurrentInventory(currentStoryId);

            
            const grantedItem = storyContainer.dataset.grantsItem;
            const pickupMessageDiv = document.getElementById('item-pickup-message');

            if (grantedItem && !inventory.includes(grantedItem)) {
                inventory.push(grantedItem); 
                
                if (pickupMessageDiv) {
                   fetchItemsData().then(items => { 
                       const itemInfo = items[grantedItem];
                       pickupMessageDiv.textContent = `✨ Objet trouvé : ${itemInfo ? itemInfo.name : grantedItem} ! Ajouté au sac à dos.`;
                   });
                }
            } else if (pickupMessageDiv) {
                 pickupMessageDiv.textContent = ''; 
            }


            
            let currentStatus = 'in_progress';
            const endingDiv = document.querySelector('.fin');
            if (endingDiv) {
                const endingType = endingDiv.dataset.endingType;
                if (endingType === 'Réussie' || endingType === 'À suivre') { currentStatus = 'completed'; }
                else if (endingType === 'Échec') { currentStatus = 'lost'; }
                else if (endingType === 'Neutre') { currentStatus = 'finished_neutral'; }
            }

            
            saveData(currentStoryId, currentStepId, currentStatus, inventory);

            
            const choiceElements = document.querySelectorAll('.choix li > *'); 
             choiceElements.forEach(choice => {
                 const requiredItem = choice.dataset.requiresItem;
                 if (requiredItem) {
                     if (!inventory.includes(requiredItem)) {
                         
                         choice.style.display = 'none'; 
                         
                         console.log(`Choix masqué car l'objet '${requiredItem}' est manquant.`);
                     } else {
                          
                          choice.style.display = '';
                     }
                 }
             });

        }
    } 

    
    const storyListContainer = document.querySelector('.story-list');
    const filterContainer = document.querySelector('.category-filters');
    let storyCards = [];
    if (storyListContainer) {
      storyCards = storyListContainer.querySelectorAll('.story-card');
    }

    
    if (storyListContainer && storyCards.length > 0) {
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

                statusDisplay.textContent = ''; statusDisplay.className = 'story-status';
                if (status === 'completed') { statusDisplay.textContent = 'Terminé 🎉'; statusDisplay.classList.add('status-completed'); }
                else if (status === 'lost') { statusDisplay.textContent = 'Perdu 💥'; statusDisplay.classList.add('status-lost'); }
                else if (status === 'finished_neutral') { statusDisplay.textContent = 'Fin 😐'; statusDisplay.classList.add('status-neutral'); }

                if (status === 'completed' || status === 'lost' || status === 'finished_neutral') {
                    storyLink.textContent = 'Recommencer'; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`); storyLink.classList.remove('resume-link');
                } else if (lastStep && lastStep !== startStepId) {
                    storyLink.textContent = "Reprendre l'aventure";
                    storyLink.setAttribute('href', `/histoires/${storyId}/${lastStep}/`); 
                    storyLink.classList.add('resume-link');
                } else {
                    storyLink.textContent = "Commencer l'aventure"; storyLink.setAttribute('href', `/histoires/${storyId}/${startStepId}/`); storyLink.classList.remove('resume-link');
                }
            } catch (e) { console.error("Erreur lecture/màj progression accueil:", e); }
        });

        const warningElement = document.querySelector('.local-storage-warning');
        if (storyListContainer && !warningElement) {
            const newWarning = document.createElement('p');
            newWarning.classList.add('local-storage-warning');
            newWarning.innerHTML = `<strong>Attention :</strong> Votre progression et votre inventaire sont sauvegardés uniquement sur <u>cet appareil</u> et dans <u>ce navigateur</u>.`;
            storyListContainer.insertAdjacentElement('afterend', newWarning);
        }
    }

    if (filterContainer && storyCards.length > 0) {
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

});