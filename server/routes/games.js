import express from 'express';
import db from '../db.js';
import { GameEngine } from '../services/gameEngine.js';

const router = express.Router();

// Get default mission categories
router.get('/missions-default', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM missions WHERE game_id IS NULL').all();
    const missions = db.prepare('SELECT category, description FROM missions WHERE game_id IS NULL').all();
    res.json({ categories: categories.map(c => c.category), missions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create game (Organizer)
router.post('/create', (req, res) => {
  try {
    const { name, categories, customMissions, organizerPseudo } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la partie est requis.' });
    }

    const gameRes = GameEngine.createGame(name, categories || [], customMissions || []);

    // Also join organizer as player or moderator
    const organizer = GameEngine.joinGame(gameRes.code, organizerPseudo || 'Organisateur (MJ)', 'organizer');

    res.json({
      gameId: gameRes.gameId,
      code: gameRes.code,
      name: gameRes.name,
      organizer
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Join game (Player)
router.post('/join', (req, res) => {
  try {
    const { code, pseudo } = req.body;
    if (!code || !pseudo) {
      return res.status(400).json({ error: 'Le code et le pseudo sont requis.' });
    }

    const player = GameEngine.joinGame(code, pseudo);
    res.json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get player dashboard data
router.get('/player/:userId', (req, res) => {
  try {
    const data = GameEngine.getPlayerDashboard(req.params.userId);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get live dashboard (MJ & Spectators)
router.get('/:gameId/live', (req, res) => {
  try {
    const data = GameEngine.getLiveDashboard(req.params.gameId);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
