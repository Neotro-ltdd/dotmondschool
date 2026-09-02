import React from 'react';
import { useBranchContext } from '../../context/BranchContext';
import './BranchSwitcher.css';

export const BranchSwitcher: React.FC = () => {
    const { branches, activeBranchId, setActiveBranchId, isGlobalRole, assignedBranchName } = useBranchContext();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setActiveBranchId(val === 'ALL' ? null : val);
        // Refresh page state to re-trigger API calls with new header
        window.dispatchEvent(new Event('branch-changed'));
    };

    if (!isGlobalRole) {
        return (
            <div className="branch-badge-readonly" title="Your assigned campus branch scope">
                <span className="branch-icon">📍</span>
                <span className="branch-name">{assignedBranchName}</span>
            </div>
        );
    }

    return (
        <div className="branch-switcher-container">
            <span className="branch-switcher-icon">🏫</span>
            <select
                className="branch-switcher-select"
                value={activeBranchId || 'ALL'}
                onChange={handleChange}
                title="Switch Campus View"
            >
                <option value="ALL">🌐 All Campuses</option>
                {branches.map(b => (
                    <option key={b.id} value={b.id}>
                        📍 {b.name} ({b.code}) {b.isMainBranch ? '• Main' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
};
