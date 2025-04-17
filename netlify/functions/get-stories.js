// netlify/functions/get-stories.js

// Importe le client Supabase
const { createClient } = require('@supabase/supabase-js');

// La fonction principale qui sera exécutée par Netlify
exports.handler = async function(event, context) {
    
    // Récupère les clés depuis les variables d'environnement
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    // Vérifie si les clés sont bien définies
    if (!supabaseUrl || !supabaseKey) {
        console.error("Erreur: Variables d'environnement Supabase manquantes.");
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "aaplication/json; charset=utf-8"
            },
            body: JSON.stringify({ error: "Configuration serveur incomplète." }),
        };
    }

    // Crée une connexion sécurisée à Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Interroge la table 'stories' pour récupérer toutes les lignes (*)
        // Sélectionne seulement les colonnes nécessaires pour l'accueil
        const { data, error } = await supabase
            .from('stories')
            .select('story_id, title, description, cover_image_url, start_step_id, age_category')
            .order('title', { ascending: true }); // Trie par titre (optionnel)

        // S'il y a une erreur retournée par Supabase
        if (error) {
            throw error; // Lance l'erreur pour être attrapée par le catch
        }

        // Si tout va bien, retourne le statut 200 (OK) et les données en JSON
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify(data), // 'data' contient la liste des histoires
        };

    } catch (err) {
        // En cas d'erreur (connexion, requête, etc.)
        console.error("Erreur lors de la récupération des histoires:", err);
        return {
            statusCode: 500, // Erreur serveur
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({ error: "Impossible de récupérer les histoires.", details: err.message }),
        };
    }
};