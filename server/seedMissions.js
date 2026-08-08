import db from './db.js';
import { cryptoRandomString } from './utils.js';

export const defaultMissions = [
  // Mots Faciles
  { category: 'Mots Faciles', description: 'Chocolat' },
  { category: 'Mots Faciles', description: 'Soleil' },
  { category: 'Mots Faciles', description: 'Vacances' },
  { category: 'Mots Faciles', description: 'Musique' },
  { category: 'Mots Faciles', description: 'Café' },
  { category: 'Mots Faciles', description: 'Pizza' },
  { category: 'Mots Faciles', description: 'Chapeau' },
  { category: 'Mots Faciles', description: 'Avion' },

  // Mots Courants
  { category: 'Mots Courants', description: 'Parapluie' },
  { category: 'Mots Courants', description: 'Guitare' },
  { category: 'Mots Courants', description: 'Cravate' },
  { category: 'Mots Courants', description: 'Croissant' },
  { category: 'Mots Courants', description: 'Téléphone' },
  { category: 'Mots Courants', description: 'Chaussette' },
  { category: 'Mots Courants', description: 'Bicyclette' },
  { category: 'Mots Courants', description: 'Fromage' },

  // Mots Insolites
  { category: 'Mots Insolites', description: 'Astronaute' },
  { category: 'Mots Insolites', description: 'Hippopotame' },
  { category: 'Mots Insolites', description: 'Caméléon' },
  { category: 'Mots Insolites', description: 'Aquarium' },
  { category: 'Mots Insolites', description: 'Papillon' },
  { category: 'Mots Insolites', description: 'Kangourou' },
  { category: 'Mots Insolites', description: 'Trompette' },
  { category: 'Mots Insolites', description: 'Tornade' },

  // Mots Difficiles
  { category: 'Mots Difficiles', description: 'Ananas' },
  { category: 'Mots Difficiles', description: 'Dinosaure' },
  { category: 'Mots Difficiles', description: 'Submersible' },
  { category: 'Mots Difficiles', description: 'Catapulte' },
  { category: 'Mots Difficiles', description: 'Labyrinthe' },
  { category: 'Mots Difficiles', description: 'Perroquet' },
  { category: 'Mots Difficiles', description: 'Pharaon' }
];

export function seedDefaultMissions() {
  // Clear and re-seed single word default missions
  db.prepare('DELETE FROM missions WHERE game_id IS NULL AND is_custom = 0').run();
  
  const insert = db.prepare('INSERT INTO missions (id, game_id, category, description, is_custom) VALUES (?, NULL, ?, ?, 0)');
  const insertMany = db.transaction((missions) => {
    for (const m of missions) {
      insert.run(cryptoRandomString(), m.category, m.description);
    }
  });
  insertMany(defaultMissions);
  console.log(`🎯 ${defaultMissions.length} mots uniques par défaut ajoutés au pool.`);
}
