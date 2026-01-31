import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/core/Button';
import Logo from '../components/core/Logo';
import Card from '../components/ui/Card';
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
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch('http://127.0.0.1:8000/token', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            localStorage.setItem('admin_token', data.access_token);
            navigate('/admin/dashboard');

        } catch (err) {
            setError('ACCESS DENIED: Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <Logo size="medium" style={{ justifyContent: 'center' }} />
                <h2 style={{ fontFamily: 'var(--font-header)', color: 'var(--text-secondary)', letterSpacing: '4px', fontSize: '1rem', marginTop: '1rem' }}>
                    SECURE LOGIN
                </h2>
            </div>

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
        </div>
    );
};

export default AdminLoginPage;
