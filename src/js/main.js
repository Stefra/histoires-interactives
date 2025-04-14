// Attend que toute la page HTML soit chargée
document.addEventListener('DOMContentLoaded', () => {

    // Trouve tous les boutons qui ont la classe 'dice-roll-button'
    const diceButtons = document.querySelectorAll('.dice-roll-button');
    // Trouve la zone où afficher le résultat
    const resultArea = document.getElementById('dice-result-area');
  
    // Si on ne trouve ni bouton ni zone de résultat, pas besoin de continuer
    if (!diceButtons.length || !resultArea) {
      return;
    }
  
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
          resultArea.textContent = "Erreur : Configuration du bouton incorrecte.";
          console.error("Attributs data-* manquants ou invalides sur le bouton de dé :", button.dataset);
          // Ne pas réactiver le bouton ici pour éviter des clics répétés sur une config erronée
          return; // Arrête l'exécution
        }
  
        // Affiche un message d'attente
        resultArea.innerHTML = "Lancement du dé... <span class='dice-animation'>🎲</span>"; // Ajout d'un dé qui tourne (simple)
  
        // --- Simulation du lancer de dé ---
        // Petit délai pour l'effet visuel
        setTimeout(() => {
          const roll = Math.floor(Math.random() * 6) + 1; // Nombre aléatoire entre 1 et 6
  
          // Détermine la cible en fonction du résultat
          let targetStepId;
          let resultMessage;
          if (roll >= successRoll) {
            targetStepId = successTarget;
            resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Réussite !)`; // Affichage du dé et du résultat
          } else {
            targetStepId = failureTarget;
            resultMessage = `Résultat : <span class="dice-result roll-${roll}"></span> ${roll} (Échec)`; // Affichage du dé et du résultat
          }
  
          // Affiche le résultat
          resultArea.innerHTML = resultMessage; // Utilise innerHTML pour interpréter les span
  
          // --- Redirection vers la page suivante ---
          // Attends un peu pour que le joueur voie le résultat
          setTimeout(() => {
            const nextPageUrl = `/histoires/${storyId}/${targetStepId}/`;
            window.location.href = nextPageUrl; // Change l'URL du navigateur
          }, 1800); // Attend 1.8 seconde avant de changer de page
  
        }, 1000); // Attend 1 seconde avant de "lancer" le dé
      });
    });
  });