import React from 'react';
import { InspectionStatus } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import ClockIcon from './icons/ClockIcon';
import NoSymbolIcon from './icons/NoSymbolIcon';

interface BadgeProps {
  status: InspectionStatus;
}

// Fix: Replaced JSX.Element with React.ReactElement to resolve the type from the imported 'React' module.
const statusStyles: { [key in InspectionStatus]: { bg: string; text: string; icon: React.ReactElement } } = {
  [InspectionStatus.PASS]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" />,
  },
  [InspectionStatus.FAIL]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    icon: <XCircleIcon className="w-4 h-4 mr-1.5" />,
  },
  [InspectionStatus.DUE]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    icon: <ClockIcon className="w-4 h-4 mr-1.5" />,
  },
  [InspectionStatus.EXCLUDED]: {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
    icon: <NoSymbolIcon className="w-4 h-4 mr-1.5" />,
  },
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  const styles = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
    >
      {styles.icon}
      {status}
    </span>
  );
};

export default Badge;
