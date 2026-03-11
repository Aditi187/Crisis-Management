import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import RealTimeNotification from './RealTimeNotification';
import '../styles/Layout.css';

function Layout({ user, onLogout }) {
    return (
        <div className="layout">
            <nav className="navbar">
                <div className="nav-brand">
                    <span className="brand-icon">�</span>
                    <span>Disaster Management System</span>
                    <span className="realtime-badge" title="Real-time updates enabled">🔴 LIVE</span>
                </div>
                <div className="nav-user">
                    <span className="user-role-badge">{user?.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                    <span className="user-name">{user?.username}</span>
                    <button onClick={onLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="main-layout">
                <aside className="sidebar">
                    <ul className="sidebar-menu">
                        <li>
                            <NavLink to="/dashboard" className="menu-item">
                                <span className="menu-icon">📊</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/map" className="menu-item">
                                <span className="menu-icon">🗺️</span>
                                <span>Disaster Map</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/disasters" className="menu-item">
                                <span className="menu-icon">🚨</span>
                                <span>Report Disaster</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/alerts" className="menu-item">
                                <span className="menu-icon">⚠️</span>
                                <span>Alerts</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/incidents" className="menu-item">
                                <span className="menu-icon">🔥</span>
                                <span>Incidents</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/donations" className="menu-item">
                                <span className="menu-icon">💰</span>
                                <span>Donations</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/volunteers" className="menu-item">
                                <span className="menu-icon">🤝</span>
                                <span>Volunteers</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/contacts" className="menu-item">
                                <span className="menu-icon">📞</span>
                                <span>Contacts</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/knowledge-base" className="menu-item">
                                <span className="menu-icon">🏥</span>
                                <span>First Aid Guide</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/sdg-goals" className="menu-item">
                                <span className="menu-icon">🌐</span>
                                <span>SDG Goals</span>
                            </NavLink>
                        </li>
                    </ul>
                </aside>

                <main className="content">
                    <Outlet context={{ user }} />
                </main>
            </div>

            {/* Real-time notification component */}
            <RealTimeNotification />
        </div>
    );
}

export default Layout;
