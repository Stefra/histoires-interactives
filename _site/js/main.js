// Attend que toute la page HTML soit chargée
document.addEventListener('DOMContentLoaded', () => {

  // --- Gestion du Lancer de Dé ---

  // Trouve tous les boutons qui ont la classe 'dice-roll-button'
  const diceButtons = document.querySelectorAll('.dice-roll-button');
  // Trouve la zone où afficher le résultat
  const diceResultArea = document.getElementById('dice-result-area'); // Renommé pour clarté

  // Vérifie si la zone existe AVANT d'attacher les écouteurs
  if (diceResultArea) {
      // Pour chaque bouton trouvé...
      diceButtons.forEach(button => {
          // Ajoute un écouteur d'événement : que faire quand on clique ?
          button.addEventListener('click', () => {

              // Désactive le bouton pour éviter les clics multiples pendant le lancer
              button.disabled = true;

              // Récupère les informations stockées dans les attributs data-*
              const storyId = button.dataset.storyId;
              const successRoll = parseInt(button.dataset.successRoll, 10); // Convertit en nombre
              const successTarget = button.dataset.successTarget;
              const failureTarget = button.dataset.failureTarget;

              // Vérification simple (au cas où)
              if (!storyId || isNaN(successRoll) || !successTarget || !failureTarget) {
                  diceResultArea.textContent = "Erreur : Configuration du bouton incorrecte.";
                  console.error("Attributs data-* manquants ou invalides sur le bouton de dé :", button.dataset);
                  // Ne pas réactiver le bouton ici pour éviter des clics répétés sur une config erronée
                  return; // Arrête l'exécution
              }

              // Affiche un message d'attente
              diceResultArea.innerHTML = "Lancement du dé... <span class='dice-animation'>🎲</span>"; // Ajout d'un dé qui tourne

              // --- Simulation du lancer de dé ---
              setTimeout(() => {
                  const roll = Math.floor(Math.random() * 6) + 1; // Nombre aléatoire entre 1 et 6

                  // Détermine la cible en fonction du résultat
                  let targetStepId;
                  let resultMessage;
                  if (roll >= successRoll) {
                      targetStepId = successTarget;
                      resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Réussite !)`;
                  } else {
                      targetStepId = failureTarget;
                      resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Échec)`;
                  }

                  // Affiche le résultat
                  diceResultArea.innerHTML = resultMessage;

                  // --- Redirection vers la page suivante ---
                  setTimeout(() => {
                      const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`;
                      window.location.href = nextPageUrl; // Change l'URL du navigateur
                  }, 1800); // Attend 1.8 seconde

              }, 1000); // Attend 1 seconde
          });
      });
  } // Fin de la vérification if(diceResultArea)

  // --- Sauvegarde de Progression ---

  // Essaie de trouver le conteneur principal d'une étape d'histoire
  const storyContainer = document.querySelector('.etape-contenu');

  if (storyContainer) { // Si on est bien sur une page d'étape
      const pathParts = window.location.pathname.split('/').filter(part => part !== '');
      if (pathParts.length === 3 && pathParts[0] === 'histoires') {
          const currentStoryId = pathParts[1];
          const currentStepId = pathParts[2];
          const storageKey = `progression_${currentStoryId}`;

          try {
              localStorage.setItem(storageKey, currentStepId);
              console.log(`Progression sauvegardée: Histoire ${currentStoryId}, Étape ${currentStepId}`);
          } catch (e) {
              console.error("Erreur lors de la sauvegarde dans le Local Storage:", e);
          }
      }
  }

  // --- Vérification Progression sur l'Accueil ---

  // Cherche la liste des cartes d'histoires
  const storyListContainer = document.querySelector('.story-list');

  if (storyListContainer) { // Si on est bien sur la page d'accueil
      const storyLinks = storyListContainer.querySelectorAll('.story-link');

      storyLinks.forEach(link => {
          const linkUrlParts = link.getAttribute('href').split('/').filter(part => part !== '');
          if (linkUrlParts.length === 3 && linkUrlParts[0] === 'histoires') {
              const storyId = linkUrlParts[1];
              const startStepId = linkUrlParts[2];
              const storageKey = `progression_${storyId}`;

              try {
                  const lastVisitedStep = localStorage.getItem(storageKey);

                  if (lastVisitedStep && lastVisitedStep !== startStepId) {
                      link.textContent = 'Reprendre l\'aventure';
                      link.setAttribute('href', `/histoires/${storyId}/${lastVisitedStep}/`);
                      link.classList.add('resume-link'); // Ajoute la classe pour le style vert
                  }
              } catch (e) {
                  console.error("Erreur lors de la lecture du Local Storage:", e);
              }
          }
      });

      // Ajouter l'avertissement sur la sauvegarde locale
      const warningElement = document.createElement('p');
      warningElement.classList.add('local-storage-warning');
      warningElement.innerHTML = `<strong>Attention :</strong> Votre progression est sauvegardée uniquement sur <u>cet appareil</u> et dans <u>ce navigateur</u>. Changer d'appareil ou effacer les données de navigation entraînera la perte de vos sauvegardes.`;
      storyListContainer.insertAdjacentElement('afterend', warningElement);
  }
  // --- Filtrage par Catégorie d'Âge sur l'Accueil ---

const filterContainer = document.querySelector('.category-filters');
const storyCards = document.querySelectorAll('.story-list .story-card'); // Sélectionne toutes les cartes

// Vérifie si les éléments nécessaires existent (on est sur la bonne page)
if (filterContainer && storyCards.length > 0) {
    const filterButtons = filterContainer.querySelectorAll('.filter-button');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterValue = button.dataset.filter; // Récupère la valeur du data-filter (ex: "all", "6-9 ans")

            // Gère l'état actif des boutons
            filterButtons.forEach(btn => btn.classList.remove('active')); // Enlève 'active' de tous
            button.classList.add('active'); // Ajoute 'active' au bouton cliqué

            // Filtre les cartes d'histoires
            storyCards.forEach(card => {
                const cardCategory = card.dataset.category; // Récupère la catégorie de la carte

                // Si le filtre est "all" OU si la catégorie de la carte correspond au filtre
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = ''; // Affiche la carte (enlève le display:none)
                    // Ou si tu préfères utiliser une classe : card.classList.remove('hidden');
                } else {
                    card.style.display = 'none'; // Masque la carte
                    // Ou : card.classList.add('hidden');
                }
            });
        });
    });
}
// --- Fin Filtrage par Catégorie ---

}); // Fin de l'écouteur DOMContentLoaded