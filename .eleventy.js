module.exports = function(eleventyConfig) {

    // Dit à Eleventy de copier le dossier 'src/css' vers '_site/css'
    eleventyConfig.addPassthroughCopy("src/css");
    // Dit à Eleventy de copier le dossier 'src/images' vers '_site/images'
    eleventyConfig.addPassthroughCopy("src/images");
    
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