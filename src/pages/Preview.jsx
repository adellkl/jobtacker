import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { LineChart, CheckCircle2, Sparkles, TrendingUp, Shield, Upload, FileText, BellRing, Clock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Preview = () => {
    const { scrollYProgress } = useScroll();
    const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <Helmet>
                <title>JobTracker • Gérez vos candidatures</title>
                <meta name="description" content="Recherchez des emplois, importez vos candidatures, suivez vos statuts et visualisez vos statistiques en un coup d'œil." />
            </Helmet>
            <section className="relative pt-20 pb-12">
                <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl" />
                <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                                Gérez vos candidatures avec fluidité
                            </h1>
                            <p className="mt-3 text-base sm:text-lg text-gray-600">
                                Version de démonstration: animations fluides, aperçu des fonctionnalités et navigation simplifiée.
                            </p>
                            <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
                                    Se connecter
                                </Link>
                                <a href="#features" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50">
                                    Découvrir
                                </a>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ amount: 0.4, once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="rounded-xl border border-gray-200 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600">Stat {i}</p>
                                                    <p className="text-2xl font-bold text-gray-900">{12 * i}</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-blue-50">
                                                    <LineChart className="w-5 h-5 text-blue-600" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <motion.svg
                                className="absolute -left-6 top-0 h-full w-6 hidden sm:block"
                                viewBox="0 0 10 400"
                                preserveAspectRatio="none"
                            >
                                <motion.path
                                    d="M5 0 C 5 80, 5 80, 5 160 C 5 240, 5 240, 5 320 C 5 360, 5 380, 5 400"
                                    fill="none"
                                    stroke="url(#grad)"
                                    strokeWidth="2"
                                    style={{ pathLength }}
                                />
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#A855F7" />
                                    </linearGradient>
                                </defs>
                            </motion.svg>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50"> <Sparkles className="w-5 h-5 text-blue-600" /> </div>
                                <h3 className="text-lg font-semibold text-gray-900">Recherche intelligente</h3>
                            </div>
                            <p className="mt-2 text-gray-600">Agrégation multi-sources (LinkedIn, Indeed, WTTJ...) et filtres avancés (remote, salaire, date).</p>
                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Moteur rapide</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Résultats dédoublonnés</li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-50"> <TrendingUp className="w-5 h-5 text-purple-600" /> </div>
                                <h3 className="text-lg font-semibold text-gray-900">Suivi clair</h3>
                            </div>
                            <p className="mt-2 text-gray-600">Gérez vos candidatures et statuts (envoyée, entretien, acceptée, refusée) en un clic.</p>
                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Notes et rappels</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Favoris synchronisés</li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-pink-50"> <LineChart className="w-5 h-5 text-pink-600" /> </div>
                                <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
                            </div>
                            <p className="mt-2 text-gray-600">Visualisez vos tendances 30 jours et vos ratios pour mieux vous organiser.</p>
                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Courbes lisibles</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Indicateurs clés</li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Comment ça marche</h2>
                        <p className="mt-2 text-gray-600">Démarrez en moins d'une minute.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[{ n: '1', t: 'Créez un compte', d: 'Inscrivez-vous et personnalisez vos préférences.' },
                        { n: '2', t: 'Recherchez & importez', d: 'Trouvez des offres et importez vos candidatures.' },
                        { n: '3', t: 'Suivez & analysez', d: 'Mettez à jour vos statuts et consultez vos stats.' }].map((s, idx) => (
                            <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="relative rounded-2xl border border-gray-200 bg-white p-6">
                                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">{s.n}</div>
                                <h3 className="mt-3 text-lg font-semibold text-gray-900">{s.t}</h3>
                                <p className="mt-2 text-gray-600">{s.d}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Informations essentielles</h2>
                        <p className="mt-2 text-gray-600">Transparence sur les données et les fonctionnalités clés.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Confidentialité</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Vos données restent privées. Stockage sécurisé (Supabase) ou local.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <Upload className="w-5 h-5 text-purple-600" />
                                <h3 className="font-semibold text-gray-900">Import facile</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Ajoutez des candidatures depuis LinkedIn, WTTJ, Indeed…</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-pink-600" />
                                <h3 className="font-semibold text-gray-900">Export CV</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Générez un CV Markdown basé sur votre activité.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <BellRing className="w-5 h-5 text-amber-600" />
                                <h3 className="font-semibold text-gray-900">Rappels</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Option de rappels pour les relances et suivis.</p>
                        </motion.div>
                    </div>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Gain de temps</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Centralisez tout au même endroit et évitez les tableaux dispersés.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-semibold text-gray-900">Vos données</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Exportables à tout moment (CSV/MD). Vous en gardez le contrôle.</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-gray-200 bg-white p-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-semibold text-gray-900">Statistiques</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">Identifiez vos meilleurs canaux et optimisez vos candidatures.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ amount: 0.3, once: true }}
                        className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 text-center"
                    >
                        <h3 className="text-2xl font-bold text-gray-900">Essayez JobTracker maintenant</h3>
                        <p className="mt-2 text-gray-700">Créez un compte en quelques secondes pour débloquer la version complète.</p>
                        <div className="mt-4">
                            <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
                                Se connecter
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Preview;


