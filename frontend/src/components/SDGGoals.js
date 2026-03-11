import React from 'react';
import '../styles/SDGGoals.css';

const sdgGoals = [
    {
        number: 2,
        title: 'Zero Hunger',
        icon: '🍽️',
        color: '#DDA63A',
        description: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.',
        impact: 'Our disaster reporting and response system ensures rapid food distribution to affected areas, preventing famine during crises.',
        actions: [
            'Rapid food supply chain coordination during disasters',
            'Real-time tracking of food distribution to affected areas',
            'Volunteer mobilization for food relief operations',
            'Donation gateway for hunger relief campaigns'
        ]
    },
    {
        number: 3,
        title: 'Good Health and Well-being',
        icon: '🏥',
        color: '#4C9F38',
        description: 'Ensure healthy lives and promote well-being for all at all ages.',
        impact: 'Our platform enables swift medical response coordination, volunteer deployment, and real-time health emergency tracking.',
        actions: [
            'Emergency medical response coordination',
            'Real-time health crisis monitoring and alerts',
            'Volunteer medical professionals directory',
            'Navigation support for rescue teams to reach victims'
        ]
    },
    {
        number: 11,
        title: 'Sustainable Cities and Communities',
        icon: '🏘️',
        color: '#FD9D24',
        description: 'Make cities and human settlements inclusive, safe, resilient and sustainable.',
        impact: 'Interactive disaster mapping and early warning systems help build resilient communities prepared for natural disasters.',
        actions: [
            'Interactive disaster map for community awareness',
            'Early warning alert system for cities',
            'Incident reporting for infrastructure damage',
            'Community volunteer network for rapid response'
        ]
    },
    {
        number: 13,
        title: 'Climate Action',
        icon: '🌍',
        color: '#3F7E44',
        description: 'Take urgent action to combat climate change and its impacts.',
        impact: 'Climate-related disaster tracking helps communities adapt to and mitigate the effects of climate change.',
        actions: [
            'Tracking climate-related disasters (floods, droughts, cyclones)',
            'Data-driven insights for climate adaptation planning',
            'Community awareness through real-time disaster reporting',
            'Supporting climate resilience through rapid disaster response'
        ]
    },
    {
        number: 17,
        title: 'Partnerships for the Goals',
        icon: '🤝',
        color: '#19486A',
        description: 'Strengthen the means of implementation and revitalize the global partnership for sustainable development.',
        impact: 'Our platform connects volunteers, donors, government agencies, and communities in a unified disaster response ecosystem.',
        actions: [
            'Connecting volunteers with disaster response teams',
            'Enabling financial partnerships through donation gateway',
            'Multi-stakeholder coordination via real-time communication',
            'Open platform fostering collaboration across organizations'
        ]
    }
];

function SDGGoals() {
    return (
        <div className="sdg-page">
            <div className="sdg-hero">
                <h1>🌐 UN Sustainable Development Goals</h1>
                <p>Disaster Management System actively contributes to achieving the United Nations Sustainable Development Goals through AI-powered disaster response and community resilience technology.</p>
            </div>

            <div className="sdg-overview">
                <div className="sdg-overview-card">
                    <h3>🎯 Our Impact Focus</h3>
                    <p>We align our disaster management efforts with key UN SDGs to create lasting positive impact on communities affected by crises.</p>
                </div>
            </div>

            <div className="sdg-goals-list">
                {sdgGoals.map(goal => (
                    <div key={goal.number} className="sdg-goal-card" style={{ borderLeftColor: goal.color }}>
                        <div className="sdg-goal-header">
                            <div className="sdg-number" style={{ background: goal.color }}>
                                {goal.number}
                            </div>
                            <div>
                                <h2>{goal.icon} {goal.title}</h2>
                                <p className="sdg-description">{goal.description}</p>
                            </div>
                        </div>

                        <div className="sdg-impact">
                            <h4>💡 Our Impact</h4>
                            <p>{goal.impact}</p>
                        </div>

                        <div className="sdg-actions">
                            <h4>🔧 How We Contribute</h4>
                            <ul>
                                {goal.actions.map((action, i) => (
                                    <li key={i}>{action}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sdg-footer">
                <div className="sdg-cta">
                    <h3>🌟 Join Our Mission</h3>
                    <p>Every action counts. Whether you report a disaster, volunteer your time, or donate to relief efforts — you are contributing to a more resilient and sustainable world.</p>
                    <div className="sdg-badges">
                        {sdgGoals.map(goal => (
                            <span key={goal.number} className="sdg-badge" style={{ background: goal.color }}>
                                SDG {goal.number}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SDGGoals;
