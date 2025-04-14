module.exports = function(eleventyConfig) {

    // Dit à Eleventy de copier le dossier 'src/css' vers '_site/css'
    eleventyConfig.addPassthroughCopy("src/css");
    // Dit à Eleventy de copier le dossier 'src/images' vers '_site/images'
    eleventyConfig.addPassthroughCopy("src/images");
    // Dit à Eleventy de copier le dossier 'src/js' vers '_site/js'
    eleventyConfig.addPassthroughCopy("src/js");

    // Création d'une collection "allStorySteps"
    eleventyConfig.addCollection("allStorySteps", function(collectionApi) {
    let allSteps = []; // Une liste vide pour ranger toutes les étapes

    // 1. Récupérer la liste de toutes les histoires depuis _data/histoires.json
    const stories = collectionApi.getAll()[0].data.histoires;
    // Note: On prend [0].data car les données globales sont attachées au premier item ici.
    // Il y a peut-être une façon plus directe, mais celle-ci fonctionne.

    // 2. Pour chaque histoire dans la liste...
    stories.forEach(storyInfo => {
      const storyId = storyInfo.id; // L'ID de l'histoire (ex: "ile-mystere")

    // 3. Essayer de récupérer les étapes de cette histoire
    // Eleventy charge les fichiers JSON dans _data automatiquement.
    // Le fichier _data/histoires/ile_mystere.json est accessible via data.histoires.ile_mystere
    // Le fichier _data/histoires/foret_perdue.json est accessible via data.histoires.foret_perdue
    // On construit le nom de la clé dynamiquement
    const stepsData = collectionApi.getAll()[0].data.histoires[storyId];

    if (stepsData && Array.isArray(stepsData)) {
      // 4. Si on a trouvé les étapes (et que c'est bien une liste)...
      stepsData.forEach(step => {
        // 5. On ajoute l'ID de l'histoire à chaque étape
        // (pour savoir d'où elle vient)
        // On ajoute aussi le titre de l'histoire pour l'utiliser dans le titre de la page
        allSteps.push({
          ...step, // Copie toutes les infos de l'étape (id, text, choices...)
          storyId: storyId, // Ajoute l'ID de l'histoire
          storyTitle: storyInfo.title // Ajoute le titre de l'histoire
        });
      });
      } else {
        console.warn(`[Eleventy] Attention: Impossible de trouver les données d'étapes pour l'histoire "${storyId}" dans _data/histoires/${storyId}.json`);
      }
    });

    // 6. On retourne la liste complète de toutes les étapes, chacune avec son storyId
    return allSteps;
  });
    
    // Dit à Eleventy où trouver les fichiers (templates, data, includes)
    return {
      dir: {
        input: "src",         // Notre dossier source
        output: "_site",      // Le dossier où le site sera généré (Eleventy le crée pour nous)
        includes: "_includes", // Le dossier pour les bouts de code réutilisables
        data: "_data"         // Le dossier pour les données (comme notre JSON)
      }
    };
  };