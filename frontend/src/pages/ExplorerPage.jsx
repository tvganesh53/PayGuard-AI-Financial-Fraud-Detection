import React from 'react';
import DatasetExplorer from '../components/DatasetExplorer';

export default function ExplorerPage({ onSelectRecord }) {
  return (
    <div className="space-y-6">
      <DatasetExplorer onSelectRecord={onSelectRecord} />
    </div>
  );
}
