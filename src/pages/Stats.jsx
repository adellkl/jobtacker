import React from 'react';
import { motion } from 'framer-motion';
import { subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LineChart from '../components/LineChart';
import { useJobContext } from '../context/JobContext';

const Stats = () => {
    const { applications } = useJobContext();

    const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
    const labels = days.map(d => format(d, 'dd/MM', { locale: fr }));
    const byDay = days.map(d => {
        const dayStr = format(d, 'yyyy-MM-dd');
        const apps = applications.filter(a => format(new Date(a.appliedAt), 'yyyy-MM-dd') === dayStr);
        return {
            applied: apps.length,
            interview: apps.filter(a => a.status === 'interview').length,
            accepted: apps.filter(a => a.status === 'accepted').length,
        };
    });

    const total = applications.length;
    const series = [
        { label: 'Candidatures', color: '#3B82F6', data: byDay.map(x => x.applied) },
        { label: 'Entretiens', color: '#10B981', data: byDay.map(x => x.interview) },
        { label: 'Acceptées', color: '#F59E0B', data: byDay.map(x => x.accepted) },
    ];

    const pct = (n) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';
    const countApplied = applications.filter(a => a.status === 'applied').length;
    const countInterview = applications.filter(a => a.status === 'interview').length;
    const countAccepted = applications.filter(a => a.status === 'accepted').length;
    const countRejected = applications.filter(a => a.status === 'rejected').length;

    const cards = [
        { title: 'Total', value: total, sub: pct(total) },
        { title: 'En attente', value: countApplied, sub: pct(countApplied) },
        { title: 'Entretiens', value: countInterview, sub: pct(countInterview) },
        { title: 'Acceptées', value: countAccepted, sub: pct(countAccepted) },
        { title: 'Refusées', value: countRejected, sub: pct(countRejected) },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
                <p className="text-gray-600">Aperçu de vos candidatures</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((c, i) => (
                    <motion.div key={c.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-sm text-gray-600">{c.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                        <p className="text-xs text-gray-500">{c.sub}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tendance 30 jours</h2>
                <div className="block sm:hidden space-y-5">
                    <LineChart
                        series={[series[0]]}
                        labels={labels}
                        width={640}
                        height={260}
                        padding={{ top: 16, right: 18, bottom: 28, left: 38 }}
                        showLegend={true}
                        pointRadius={2.5}
                        strokeWidth={3}
                        axisFontSize={12}
                    />
                    <LineChart
                        series={[series[1]]}
                        labels={labels}
                        width={640}
                        height={260}
                        padding={{ top: 16, right: 18, bottom: 28, left: 38 }}
                        showLegend={true}
                        pointRadius={2.5}
                        strokeWidth={3}
                        axisFontSize={12}
                    />
                    <LineChart
                        series={[series[2]]}
                        labels={labels}
                        width={640}
                        height={260}
                        padding={{ top: 16, right: 18, bottom: 28, left: 38 }}
                        showLegend={true}
                        pointRadius={2.5}
                        strokeWidth={3}
                        axisFontSize={12}
                    />
                </div>
                <div className="hidden sm:block">
                    <LineChart series={series} labels={labels} width={640} height={300} />
                </div>
            </motion.div>
        </div>
    );
};

export default Stats;


