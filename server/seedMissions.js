import db from './db.js';
import { cryptoRandomString } from './utils.js';

export const defaultMissions = [
  // Mots à dire
  { category: 'Mots à dire', description: 'Faire dire le mot "Chocolat" à votre cible sans prononcer de mot sucré.' },
  { category: 'Mots à dire', description: 'Faire dire à votre cible "C\'est de ta faute" en lui posant une question.' },
  { category: 'Mots à dire', description: 'Faire répéter "Absolument" 3 fois de suite à votre cible.' },
  { category: 'Mots à dire', description: 'Faire chanter au moins une phrase d\'une chanson à votre cible.' },
  { category: 'Mots à dire', description: 'Faire dire le nom de son premier animal de compagnie à votre cible.' },
  { category: 'Mots à dire', description: 'Faire avouer à votre cible qu\'elle a tort sur un sujet fictif.' },

  // Actions physiques
  { category: 'Actions physiques', description: 'Faire faire un "Check" (high-five) avec les deux mains à votre cible.' },
  { category: 'Actions physiques', description: 'Faire toucher son nez avec son index à votre cible.' },
  { category: 'Actions physiques', description: 'Faire s\'asseoir votre cible par terre ou sur un coussin.' },
  { category: 'Actions physiques', description: 'Faire lever les deux bras au ciel à votre cible.' },
  { category: 'Actions physiques', description: 'Faire imiter un cri d\'animal à votre cible.' },
  { category: 'Actions physiques', description: 'Faire faire un pas de danse à votre cible.' },

  // Objets
  { category: 'Objets', description: 'Faire tenir votre verre à votre cible pendant au moins 10 secondes.' },
  { category: 'Objets', description: 'Se faire prêter un vêtement ou un accessoire par votre cible.' },
  { category: 'Objets', description: 'Faire ramasser un objet que vous avez fait tomber à votre cible.' },
  { category: 'Objets', description: 'Faire déboucher ou ouvrir une bouteille/canette à votre cible.' },
  { category: 'Objets', description: 'Se faire donner un chewing-gum ou un bonbon par votre cible.' },

  // Insolite & Absurde
  { category: 'Insolite', description: 'Faire chuchoter un secret totalement inventé à votre cible.' },
  { category: 'Insolite', description: 'Faire dire "Je suis un agent secret" à votre cible sans qu\'elle se doute de rien.' },
  { category: 'Insolite', description: 'Faire vérifier l\'heure sur son téléphone à votre cible après lui avoir donné l\'heure.' },
  { category: 'Insolite', description: 'Faire féliciter quelqu\'un d\'autre à votre cible.' },
  { category: 'Insolite', description: 'Faire faire un compliment sur votre tenue à votre cible.' }
];

export function seedDefaultMissions() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM missions WHERE game_id IS NULL').get().cnt;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO missions (id, game_id, category, description, is_custom) VALUES (?, NULL, ?, ?, 0)');
    const insertMany = db.transaction((missions) => {
      for (const m of missions) {
        insert.run(cryptoRandomString(), m.category, m.description);
      }
    });
    insertMany(defaultMissions);
    console.log(`🎯 ${defaultMissions.length} missions par défaut ajoutées au pool.`);
  }
}
