import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl text-center"
      >
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Page introuvable</h1>
        <p className="mt-3 text-gray-600">
          L'URL "{location.pathname}" n'existe pas. Vérifiez l'adresse ou revenez vers une page existante.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/preview" className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
            Aperçu
          </Link>
          <Link to="/login" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium">
            Se connecter
          </Link>
          <Link to="/" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50 font-medium">
            Accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;


