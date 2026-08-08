import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Sparkles, Check, Plus, Trash2, ArrowLeft, Shield } from 'lucide-react';

export default function CreateGame() {
  const navigate = useNavigate();
  const { saveUserSession, showNotification } = useGame();

  const [gameName, setGameName] = useState('');
  const [organizerPseudo, setOrganizerPseudo] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customMissions, setCustomMissions] = useState(['']);
  const [loading, setLoading] = useState(false);

  // Fetch available default mission categories
  useEffect(() => {
    fetch('/api/games/missions-default')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setAvailableCategories(data.categories);
          setSelectedCategories(data.categories); // Select all by default
        }
      })
      .catch(err => console.error('Erreur chargement catégories:', err));
  }, []);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleCustomMissionChange = (index, value) => {
    const updated = [...customMissions];
    updated[index] = value;
    setCustomMissions(updated);
  };

  const addCustomMissionField = () => {
    setCustomMissions([...customMissions, '']);
  };

  const removeCustomMissionField = (index) => {
    setCustomMissions(customMissions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gameName.trim()) {
      showNotification('Veuillez donner un nom à la partie.', 'error');
      return;
    }
    if (!organizerPseudo.trim()) {
      showNotification('Veuillez saisir votre pseudo d\'organisateur.', 'error');
      return;
    }
    if (selectedCategories.length === 0 && customMissions.filter(m => m.trim()).length === 0) {
      showNotification('Veuillez sélectionner au moins une catégorie ou ajouter une mission.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName.trim(),
          organizerPseudo: organizerPseudo.trim(),
          categories: selectedCategories,
          customMissions: customMissions.filter(m => m.trim())
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création.');

      saveUserSession({
        userId: data.organizer.userId,
        gameId: data.gameId,
        gameCode: data.code,
        gameName: data.name,
        pseudo: data.organizer.pseudo,
        secretCode: data.organizer.secretCode,
        role: 'organizer'
      });

      showNotification('🎉 Partie créée avec succès !', 'success');
      navigate('/lobby');
    } catch (err) {
      showNotification(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-heading text-2xl font-black text-white">Nouvelle Partie</h2>
          <p className="text-xs text-slate-400">Configurez la partie et sélectionnez le mode de missions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Name & Pseudo */}
        <div className="p-5 rounded-3xl glass-card space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nom de la partie *
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Ex: Soirée Anniversaire Lucas 🎂"
              required
              className="w-full py-3 px-4 rounded-xl glass-input text-white placeholder:text-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Votre Pseudo (Maître du Jeu) *
            </label>
            <input
              type="text"
              value={organizerPseudo}
              onChange={(e) => setOrganizerPseudo(e.target.value)}
              placeholder="Ex: Alex (MJ)"
              required
              className="w-full py-3 px-4 rounded-xl glass-input text-white placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Mission Categories Selection */}
        <div className="p-5 rounded-3xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Catégories de missions
            </label>
            <span className="text-xs text-rose-400 font-bold">{selectedCategories.length} sélectionnée(s)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 text-white shadow-md shadow-rose-950'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{cat}</span>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                    isSelected ? 'bg-rose-500 border-rose-400 text-white' : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Missions Input */}
        <div className="p-5 rounded-3xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Missions Personnalisées (Optionnel)
            </label>
            <button
              type="button"
              onClick={addCustomMissionField}
              className="text-xs text-rose-400 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>

          <div className="space-y-2.5">
            {customMissions.map((mission, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={mission}
                  onChange={(e) => handleCustomMissionChange(index, e.target.value)}
                  placeholder={`Mission sur-mesure #${index + 1}...`}
                  className="flex-1 py-2.5 px-3.5 rounded-xl glass-input text-sm text-white placeholder:text-slate-600"
                />
                {customMissions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCustomMissionField(index)}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl btn-primary text-white font-black text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Création de la partie...' : 'Créer et ouvrir le Lobby 🚀'}
        </button>
      </form>
    </div>
  );
}
