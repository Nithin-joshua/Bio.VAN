import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
import SystemStatus from '../components/ui/SystemStatus';
import '../styles/components.css';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Bypass backend authentication for now as password field is removed
            // const formData = new FormData();
            // formData.append('username', email);
            // formData.append('password', password);

            // const response = await fetch('http://127.0.0.1:8000/token', {
            //     method: 'POST',
            //     body: formData,
            // });

            // if (!response.ok) {
            //     throw new Error('Invalid credentials');
            // }

            // const data = await response.json();
            // localStorage.setItem('admin_token', data.access_token);
            
            // Set dummy token for admin access
            localStorage.setItem('admin_token', 'bypass_token');
            navigate('/admin/dashboard');

        } catch (err) {
            setError('ACCESS DENIED: Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <SystemStatus />
            
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <Logo size="medium" style={{ justifyContent: 'center' }} />
                <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
                    SECURE LOGIN
                </h2>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <Card title="ADMIN CONTROL" status="LOCKED" delay={0.1}>
                    <form onSubmit={handleLogin} style={{ padding: '2rem', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {error && (
                            <div style={{ padding: '0.8rem', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: 'red', fontSize: '0.9rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div className="cyber-input-group">
                            <label className="cyber-label">ADMIN EMAIL</label>
                            <input
                                type="email"
                                className="cyber-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin@biovan.internal"
                            />
                        </div>

                        <div className="cyber-input-group">
                            <label className="cyber-label">PASSWORD</label>
                            <input
                                type="password"
                                className="cyber-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? 'AUTHENTICATING...' : 'ACCESS MAINFRAME'}
                        </Button>
                    </form>
                </Card>

                <div className="mobile-hide" style={{ width: '300px' }}>
                     <Card title="SYSTEM DIAGNOSTICS" status="MONITORING" delay={0.3}>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <span>SERVER STATUS</span>
                                <span style={{ color: 'var(--neon-green)' }}>ONLINE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <span>DB CONNECTION</span>
                                <span style={{ color: 'var(--neon-green)' }}>STABLE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <span>LAST BACKUP</span>
                                <span style={{ color: 'var(--neon-blue)' }}>04:00 AM</span>
                            </div>
                            <div style={{ borderTop: '1px solid var(--text-secondary)', margin: '0.5rem 0', opacity: 0.3 }}></div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                UNAUTHORIZED ACCESS ATTEMPTS WILL BE LOGGED AND REPORTED TO ISSEC.
                            </div>
                        </div>
                     </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
