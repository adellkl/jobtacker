import React from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
    const links = [
        { label: 'Accueil', href: '/' },
        { label: 'Recherche', href: '/search' },
        { label: 'Candidatures', href: '/applications' },
        { label: 'Profil', href: '/profile' },
    ];

    return (
        <footer className="relative mt-12 border-t border-gray-200/80 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wide">JobTracker</h3>
                        <p className="mt-2 text-sm text-gray-600">Trouvez, suivez et réussissez vos candidatures avec fluidité.</p>
                    </div>
                    <nav className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm text-gray-600">
                        {links.map((l) => (
                            <a key={l.href} href={l.href} className="hover:text-gray-900 transition-colors">
                                {l.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3 justify-start md:justify-end">
                        <a href="https://github.com/adellkl" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="GitHub">
                            <Github className="w-4 h-4 text-gray-700" />
                        </a>
                        <a href="https://www.linkedin.com/in/adel-loukal-257541221/" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="LinkedIn">
                            <Linkedin className="w-4 h-4 text-gray-700" />
                        </a>
                        <a href="mailto:adelloukal23@gmail.com" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Email">
                            <Mail className="w-4 h-4 text-gray-700" />
                        </a>
                    </div>
                </div>
                <div className="mt-8 flex items-center justify-between text-xs text-gray-500">
                    <span>© {new Date().getFullYear()} JobTracker. Tous droits réservés.</span>
                    <span className="hidden sm:inline">Fait avec ❤️ pour votre réussite.</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;


