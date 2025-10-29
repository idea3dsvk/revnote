import React from 'react';
import { Asset, InspectionStatus } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import ClockIcon from './icons/ClockIcon';
import NoSymbolIcon from './icons/NoSymbolIcon';

interface DashboardProps {
  assets: Asset[];
}

const getAssetStatus = (asset: Asset): InspectionStatus => {
  if (asset.isExcluded) {
    return InspectionStatus.EXCLUDED;
  }

  if (asset.inspections.length === 0) {
    return InspectionStatus.DUE;
  }

  const latestInspection = asset.inspections.reduce((latest, current) => 
    new Date(current.date) > new Date(latest.date) ? current : latest
  );

  if (latestInspection.status === InspectionStatus.FAIL) {
    return InspectionStatus.FAIL;
  }

  const today = new Date();
  const nextDate = new Date(asset.nextInspectionDate);
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < today) {
    return InspectionStatus.FAIL;
  }

  return InspectionStatus.PASS;
};

const getDaysUntilNextInspection = (asset: Asset): number | null => {
  if (asset.isExcluded || asset.inspections.length === 0) {
    return null;
  }

  const today = new Date();
  const nextDate = new Date(asset.nextInspectionDate);
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  // Štatistiky podľa statusu
  const stats = {
    total: assets.length,
    pass: assets.filter(a => getAssetStatus(a) === InspectionStatus.PASS).length,
    fail: assets.filter(a => getAssetStatus(a) === InspectionStatus.FAIL).length,
    due: assets.filter(a => getAssetStatus(a) === InspectionStatus.DUE).length,
    excluded: assets.filter(a => getAssetStatus(a) === InspectionStatus.EXCLUDED).length,
  };

  // Zariadenia s revíziou do 30 dní
  const assetsWithin30Days = assets.filter(asset => {
    const days = getDaysUntilNextInspection(asset);
    return days !== null && days > 0 && days <= 30;
  });

  // Zariadenia po termíne
  const overdueAssets = assets.filter(asset => {
    const days = getDaysUntilNextInspection(asset);
    return days !== null && days < 0;
  });

  // Priemer dní do ďalšej revízie (iba pre aktívne zariadenia s revíziami)
  const activeAssetsWithInspections = assets.filter(
    a => !a.isExcluded && a.inspections.length > 0
  );
  const avgDaysToNextInspection = activeAssetsWithInspections.length > 0
    ? Math.round(
        activeAssetsWithInspections.reduce((sum, asset) => {
          const days = getDaysUntilNextInspection(asset);
          return sum + (days || 0);
        }, 0) / activeAssetsWithInspections.length
      )
    : 0;

  // Percentuálny pomer
  const passPercentage = stats.total > 0 
    ? Math.round((stats.pass / (stats.total - stats.excluded)) * 100) 
    : 0;

  const statCards = [
    {
      title: 'Vyhovuje',
      value: stats.pass,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Nevyhovuje',
      value: stats.fail,
      icon: XCircleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Plánovaná',
      value: stats.due,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Vylúčené',
      value: stats.excluded,
      icon: NoSymbolIcon,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hlavná štatistika */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard - Prehľad revízií</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={`${stat.bgColor} rounded-lg p-4 border-l-4 ${stat.color.replace('bg-', 'border-')}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-3xl font-bold ${stat.textColor} mt-1`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`w-12 h-12 ${stat.textColor} opacity-60`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dodatočné štatistiky */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Percentuálny úspech */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Percentuálny úspech</h3>
          <div className="flex items-end justify-center">
            <span className="text-5xl font-bold text-primary-600">{passPercentage}</span>
            <span className="text-2xl font-semibold text-gray-500 mb-1 ml-1">%</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            zariadení vyhovuje požiadavkám
          </p>
          <div className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${passPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Revízie do 30 dní */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Revízie do 30 dní</h3>
          <div className="flex items-end justify-center">
            <span className="text-5xl font-bold text-yellow-600">{assetsWithin30Days.length}</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            zariadení potrebuje revíziu
          </p>
          {assetsWithin30Days.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {assetsWithin30Days.slice(0, 5).map((asset) => {
                  const days = getDaysUntilNextInspection(asset);
                  return (
                    <li key={asset.id} className="text-gray-700 flex justify-between">
                      <span className="truncate">{asset.name}</span>
                      <span className="text-yellow-600 font-semibold ml-2">{days}d</span>
                    </li>
                  );
                })}
                {assetsWithin30Days.length > 5 && (
                  <li className="text-gray-500 italic">+{assetsWithin30Days.length - 5} ďalších</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Zariadenia po termíne */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Po termíne</h3>
          <div className="flex items-end justify-center">
            <span className="text-5xl font-bold text-red-600">{overdueAssets.length}</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {overdueAssets.length === 0 ? 'Žiadne' : 'zariadení po termíne'}
          </p>
          {overdueAssets.length > 0 && (
            <div className="mt-4 max-h-32 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {overdueAssets.slice(0, 5).map((asset) => {
                  const days = getDaysUntilNextInspection(asset);
                  return (
                    <li key={asset.id} className="text-gray-700 flex justify-between">
                      <span className="truncate">{asset.name}</span>
                      <span className="text-red-600 font-semibold ml-2">{Math.abs(days!)}d</span>
                    </li>
                  );
                })}
                {overdueAssets.length > 5 && (
                  <li className="text-gray-500 italic">+{overdueAssets.length - 5} ďalších</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Celkový prehľad */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Celkový prehľad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Celkový počet zariadení</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Aktívnych zariadení</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total - stats.excluded}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Priemerný čas do revízie</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {avgDaysToNextInspection > 0 ? `${avgDaysToNextInspection}d` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
