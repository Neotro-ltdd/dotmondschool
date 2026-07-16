import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import './SystemSchools.css'; // Reuse styles for consistency
import { useDialog } from '../../../context/DialogContext';


interface SystemSettingsModel {
    globalSmsApiKey: string;
    globalSmsProviderUrl: string;
}

export default function SystemSettings() {
  const { showAlert } = useDialog();

    const [settings, setSettings] = useState<SystemSettingsModel>({
        globalSmsApiKey: '',
        globalSmsProviderUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/system/settings');
                if (res) {
                    setSettings(res);
                }
            } catch (err: any) {
                console.error(err);
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await api.put('/system/settings', settings);
            setSettings(res);
            showAlert('Settings updated successfully!');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="system-schools-container">Loading settings...</div>;
    }

    return (
        <div className="system-schools-container">
            <div className="schools-header-actions" style={{ marginBottom: '1.5rem' }}>
                <h2>Global Platform Settings</h2>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMS Provider API URL</label>
                        <input 
                            type="text" 
                            name="globalSmsProviderUrl" 
                            value={settings.globalSmsProviderUrl} 
                            onChange={handleChange} 
                            placeholder="https://api.smsprovider.com/v1/send"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>SMS API Key</label>
                        <input 
                            type="password" 
                            name="globalSmsApiKey" 
                            value={settings.globalSmsApiKey} 
                            onChange={handleChange} 
                            placeholder="Enter API Key"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={saving} 
                        style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </form>
            </div>
        </div>
    );
}
