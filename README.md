# Job Apply App - Gestionnaire de Candidatures

Une application moderne et intuitive pour gérer vos candidatures d'emploi, construite avec React, Tailwind CSS et Framer Motion.

## 🚀 Fonctionnalités

### 📋 Gestion des Candidatures
- **Suivi des statuts** : Candidature envoyée, Entretien, Acceptée, Refusée
- **Notes personnalisées** : Ajoutez et modifiez des notes pour chaque candidature
- **Historique complet** : Dates de candidature et suivi temporel
- **Suppression** : Supprimez facilement les candidatures obsolètes

### 🔍 Recherche et Filtrage
- **Recherche textuelle** : Par titre de poste, entreprise ou localisation
- **Filtres par statut** : Visualisez rapidement vos candidatures par état
- **Filtres avancés** : Par date, entreprise et localisation
- **Groupement intelligent** : Candidatures organisées par statut

### 📊 Tableau de Bord
- **Statistiques visuelles** : Vue d'ensemble de vos candidatures
- **Compteurs par statut** : Suivi en temps réel de vos progrès
- **Interface responsive** : Optimisé pour tous les appareils

### 🎨 Interface Utilisateur
- **Design moderne** : Interface épurée et professionnelle
- **Animations fluides** : Transitions et micro-interactions avec Framer Motion
- **Thème français** : Interface entièrement localisée
- **Responsive design** : Adaptation automatique à tous les écrans

## 🛠️ Technologies Utilisées

- **Frontend** : React 18 avec Hooks
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **Gestion d'état** : Context API + useReducer
- **Stockage** : localStorage pour la persistance
- **Icons** : Lucide React
- **Dates** : date-fns avec localisation française
- **Notifications** : react-hot-toast

## 📁 Structure du Projet

```
src/
├── components/          # Composants réutilisables
│   └── Navbar.jsx      # Navigation principale
├── context/            # Gestion d'état global
│   └── JobContext.jsx  # Contexte des emplois et candidatures
├── pages/              # Pages de l'application
│   ├── Applications.jsx # Gestion des candidatures
│   ├── Dashboard.jsx   # Tableau de bord
│   ├── JobSearch.jsx   # Recherche d'emplois
│   └── Profile.jsx     # Profil utilisateur
├── styles/             # Styles globaux
│   └── index.css       # CSS principal
└── main.jsx           # Point d'entrée
```

## 🚀 Installation et Démarrage

1. **Cloner le projet**
   ```bash
   git clone [url-du-repo]
   cd job-apply-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer l'application**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:5173
   ```

## 📱 Utilisation

### Ajouter une Candidature
1. Naviguez vers la page "Recherche d'emplois"
2. Recherchez un poste qui vous intéresse
3. Cliquez sur "Postuler" pour ajouter à vos candidatures

### Gérer vos Candidatures
1. Accédez à la page "Mes Candidatures"
2. Modifiez le statut selon l'avancement
3. Ajoutez des notes personnelles
4. Suivez vos statistiques dans le tableau de bord

### Personnaliser votre Profil
1. Allez dans "Mon Profil"
2. Mettez à jour vos informations personnelles
3. Configurez vos préférences de recherche

## 🔧 Configuration

L'application utilise Supabase pour l'authentification et le stockage. Vous devez renseigner les variables d'environnement suivantes.

### Variables requises

```
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ<cle_anon_publique>

# Optionnel (API emplois)
VITE_RAPIDAPI_KEY=<votre_cle_rapidapi>
# Optionnel (serveur local agrégateur)
RAPIDAPI_KEY=<votre_cle_rapidapi>
API_PORT=5175
```

### Configuration en local

1. Copiez le fichier `.env.example` en `.env` à la racine du projet
2. Remplissez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` depuis Supabase:
   - Supabase → Settings → API → Project URL et anon public
3. (Optionnel) Ajoutez `VITE_RAPIDAPI_KEY` si vous utilisez la recherche d'emplois JSearch
4. Redémarrez le serveur de dev: `npm run dev`

### Déploiement sur Vercel

1. Vercel → Project → Settings → Environment Variables
2. Ajoutez exactement (sensible à la casse):
   - `VITE_SUPABASE_URL` = URL du projet Supabase
   - `VITE_SUPABASE_ANON_KEY` = clé anon publique
   - (Optionnel) `VITE_RAPIDAPI_KEY`
3. Choisissez les environnements "Production" et "Preview"
4. Redeployez le projet (bouton Redeploy)

Après déploiement, l'erreur « Configuration Supabase manquante... » disparaît si les variables sont bien définies.

## 🎯 Fonctionnalités à Venir

- [ ] Synchronisation cloud
- [ ] Rappels et notifications
- [ ] Export des données
- [ ] Intégration avec des APIs d'emploi
- [ ] Mode sombre
- [ ] PWA (Progressive Web App)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ en France** 🇫🇷
# jobtacker
