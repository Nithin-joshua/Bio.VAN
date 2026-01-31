import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import { fetchRegisteredUsers } from '../api/admin.api';

/**
 * Administrative Dashboard Page
 * Displays a secure registry of all users in the system.
 * Requires a valid JWT token in localStorage to access.
 */
const AdminPage = () => {
    // Registry state management
    const [personnelRegistry, setPersonnelRegistry] = useState([]);
    const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
    const [accessError, setAccessError] = useState(null);

    const navigate = useNavigate();

    // Verify authentication and fetch data on mount
    useEffect(() => {
        const adminToken = localStorage.getItem('admin_token');

        // Redirect to login if no token is present
        if (!adminToken) {
            navigate('/admin');
            return;
        }

        const populateRegistry = async () => {
            try {
                // Fetch secure user list from backend
                const registryData = await fetchRegisteredUsers(adminToken);
                setPersonnelRegistry(registryData);
            } catch (err) {
                setAccessError('Failed to load user registry. Session may represent a security risk or be expired.');
                // Redirect on authentication failures
                if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
                    navigate('/admin');
                }
            } finally {
                setIsLoadingRegistry(false);
            }
        };

        populateRegistry();
    }, [navigate]);

    /**
     * Clears local session and redirects to login
     */
    const handleAdminLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin');
    };

    return (
        <div className="page-container">
            {/* Dashboard Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', width: '100%', maxWidth: '800px' }}>
                <Logo size="medium" style={{ justifyContent: 'center' }} />
                <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
                    ADMINISTRATIVE DASHBOARD
                </h2>
                {/* Logout Control */}
                <div style={{ position: 'absolute', right: 0, top: 0 }}>
                    <Button variant="secondary" onClick={handleAdminLogout} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                        LOGOUT
                    </Button>
                </div>
            </div>

            {/* Main Registry Table Card */}
            <Card title="REGISTERED PERSONNEL" status={isLoadingRegistry ? "SYNCING..." : "SECURE"} delay={0.1}>
                <div style={{ padding: '1rem', width: '100%', minWidth: '600px' }}>
                    {accessError && (
                        <div style={{ padding: '1rem', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: 'red', marginBottom: '1rem' }}>
                            {accessError}
                        </div>
                    )}

                    {!isLoadingRegistry && !accessError && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--primary-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)' }}>ID</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)' }}>FULL NAME</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)' }}>EMAIL</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)' }}>ROLE</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {personnelRegistry.map((user) => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <td style={{ padding: '1rem' }}>{String(user.id).padStart(4, '0')}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{user.full_name}</td>
                                        <td style={{ padding: '1rem' }}>{user.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                background: user.role === 'admin' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 243, 255, 0.1)',
                                                color: user.role === 'admin' ? 'gold' : 'inherit',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: user.voice_profile_status === 'active' ? '#0f0' : '#888' }}>
                                                {user.voice_profile_status ? user.voice_profile_status.toUpperCase() : 'UNKNOWN'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!isLoadingRegistry && personnelRegistry.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            NO RECORDS FOUND
                        </div>
                    )}
                </div>
            </Card>

            <div style={{ marginTop: '2rem' }}>
                <Link to="/">
                    <Button variant="secondary">RETURN TO GATEWAY</Button>
                </Link>
            </div>
        </div>
    );
};

export default AdminPage;
