import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
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
            <SystemStatus />
            
            {/* Dashboard Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', width: '100%' }}>
                {/* Main Registry Table Card */}
                <div style={{ gridColumn: 'span 2' }}>
                    <Card title="REGISTERED PERSONNEL" status={isLoadingRegistry ? "SYNCING..." : "SECURE"} delay={0.1}>
                        <div style={{ padding: '1rem', width: '100%', overflowX: 'auto' }}>
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
                                            <tr key={user.id} className="registry-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace', letterSpacing: '1px' }}>{user.id}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{user.full_name}</td>
                                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ 
                                                        padding: '0.2rem 0.5rem', 
                                                        border: '1px solid var(--neon-blue)', 
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem' 
                                                    }}>
                                                        {user.role || 'PERSONNEL'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', color: 'var(--neon-green)' }}>ACTIVE</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>

                {/* System Activity Feed (Mock) */}
                <div>
                    <Card title="NETWORK ACTIVITY" status="LIVE" delay={0.3}>
                         <div style={{ padding: '1rem', height: '300px', overflow: 'hidden', position: 'relative' }}>
                             <div className="data-particle" style={{ left: '20%', animationDelay: '0s' }}></div>
                             <div className="data-particle" style={{ left: '50%', animationDelay: '2s' }}></div>
                             <div className="data-particle" style={{ left: '80%', animationDelay: '5s' }}></div>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>&gt; INCOMING_PACKET_2394</span>
                                    <span style={{ color: 'var(--neon-blue)' }}>VERIFIED</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>&gt; NODE_SYNC_04</span>
                                    <span style={{ color: 'var(--neon-green)' }}>COMPLETE</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>&gt; AUTH_REQUEST_992</span>
                                    <span style={{ color: 'var(--neon-purple)' }}>PENDING</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                                    <span>&gt; SYSTEM_GC</span>
                                    <span>DONE</span>
                                </div>
                                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                     <div style={{ marginBottom: '0.5rem' }}>BANDWIDTH USAGE:</div>
                                     <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                         <div style={{ width: '45%', height: '100%', background: 'var(--neon-blue)' }}></div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
