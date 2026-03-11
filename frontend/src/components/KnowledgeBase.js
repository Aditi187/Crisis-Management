import React, { useState } from 'react';
import '../styles/KnowledgeBase.css';

const knowledgeCards = [
    {
        id: 'floods',
        icon: '🌊',
        title: 'Floods',
        color: '#3498db',
        summary: 'Essential survival protocols during flood emergencies',
        preparedness: [
            'Store important documents in waterproof bags',
            'Keep a "go bag" ready with 3 days of essentials',
            'Know your area\'s flood evacuation routes',
            'Install check valves in plumbing to prevent backflow',
            'Elevate electrical components (switches, sockets, circuit panels)'
        ],
        during: [
            'Move immediately to higher ground – do NOT wait for instructions',
            'Never walk, swim, or drive through flood waters (6 inches can knock you down)',
            'Stay off bridges over fast-moving water',
            'If trapped in a building, go to its highest level but do NOT climb into a locked attic',
            'Call emergency services: 112 / NDRF: 011-24363260'
        ],
        firstAid: [
            'Treat hypothermia: remove wet clothes, wrap in warm blankets',
            'Clean and bandage any cuts immediately – floodwater carries bacteria',
            'Watch for waterborne diseases: do NOT drink unboiled water',
            'Treat drowning: CPR if unconscious and not breathing (30 compressions, 2 breaths)',
            'Disinfect wounds with clean water and antiseptic – seek medical help ASAP'
        ],
        after: [
            'Return home only when authorities say it is safe',
            'Photograph damage for insurance claims before cleanup',
            'Discard food that has come in contact with floodwater',
            'Boil water until supply is certified safe',
            'Watch for weakened structures – risk of collapse'
        ]
    },
    {
        id: 'fires',
        icon: '🔥',
        title: 'Fires',
        color: '#e74c3c',
        summary: 'Critical fire safety and evacuation procedures',
        preparedness: [
            'Install smoke alarms on every level – test monthly',
            'Keep fire extinguishers in kitchen and near exits (know PASS: Pull, Aim, Squeeze, Sweep)',
            'Plan two escape routes from every room',
            'Practice fire drills with family every 6 months',
            'Clear dry vegetation within 30 feet of buildings'
        ],
        during: [
            'GET OUT, STAY OUT, and CALL 101 / 112',
            'Crawl low under smoke – breathable air is near the floor',
            'Feel doors before opening – if hot, use alternate route',
            'If clothes catch fire: STOP, DROP, and ROLL',
            'Never go back inside a burning building'
        ],
        firstAid: [
            'Burns: cool with running water for at least 20 minutes (not ice)',
            'Cover burns with clean, non-fluffy material (cling film works)',
            'Do NOT pop blisters or apply butter/creams',
            'For smoke inhalation: move to fresh air, sit upright, call ambulance',
            'If unconscious: check airway, breathing, circulation – begin CPR if needed'
        ],
        after: [
            'Do not enter until fire department declares it safe',
            'Watch for hot spots that can reignite',
            'Document all damage with photos/video',
            'Contact insurance company immediately',
            'Beware of structural weakening – walls and roofs may collapse'
        ]
    },
    {
        id: 'earthquakes',
        icon: '🌍',
        title: 'Earthquakes',
        color: '#9b59b6',
        summary: 'Survival strategies for seismic events',
        preparedness: [
            'Secure heavy furniture, water heaters, and appliances to walls',
            'Identify safe spots: under sturdy tables, against interior walls',
            'Keep emergency kit: water, food, flashlight, radio, first aid, medications',
            'Learn how to shut off gas, water, and electricity',
            'If in a seismic zone, get earthquake insurance'
        ],
        during: [
            'DROP to your hands and knees to prevent falling',
            'Take COVER under sturdy furniture – protect head and neck',
            'HOLD ON until shaking stops',
            'If outdoors: move to clear area away from buildings, power lines, trees',
            'If in a vehicle: pull over, set parking brake, stay inside'
        ],
        firstAid: [
            'Check yourself and others for injuries – treat life-threatening conditions first',
            'Apply pressure to bleeding wounds with clean cloth',
            'Immobilize suspected fractures – do NOT try to straighten broken bones',
            'For crush injuries: do NOT remove heavy objects without medical guidance',
            'Treat shock: lay person down, elevate legs, keep warm'
        ],
        after: [
            'Expect aftershocks – drop, cover, hold on each time',
            'Check for gas leaks. If you smell gas, open windows and leave immediately',
            'Inspect for structural damage before entering buildings',
            'Use texts/social media instead of phone calls to keep lines clear',
            'Stay away from damaged areas and coastlines (tsunami risk)'
        ]
    },
    {
        id: 'cyclones',
        icon: '🌀',
        title: 'Cyclones & Storms',
        color: '#2c3e50',
        summary: 'Cyclone-specific preparedness and response protocols',
        preparedness: [
            'Monitor IMD cyclone warnings regularly during season',
            'Reinforce windows with storm shutters or plywood boards',
            'Trim trees and secure loose outdoor items',
            'Stock 7 days of food, water, medications, and batteries',
            'Know your nearest cyclone shelter location'
        ],
        during: [
            'Stay indoors in an interior room, away from windows',
            'Do NOT go outside during the "eye" – the storm will resume',
            'If ordered to evacuate, comply immediately via designated routes',
            'Turn off gas and electricity if advised',
            'Listen to official broadcasts on battery-powered radio'
        ],
        firstAid: [
            'Treat flying-debris injuries: clean wounds, control bleeding, splint fractures',
            'For electrical shock from downed wires: do NOT touch the victim, call emergency',
            'Hypothermia from wet conditions: remove wet clothes, warm gradually',
            'Watch for snake/insect bites in flooded areas – immobilize, keep calm, seek help',
            'Stress/anxiety is normal – practice deep breathing, reassure others'
        ],
        after: [
            'Stay away from downed power lines and flooded roads',
            'Boil water before drinking until safety confirmation',
            'Watch for secondary hazards: landslides, flooding, contamination',
            'Report damaged infrastructure to local authorities',
            'Document damage for insurance and relief claims'
        ]
    },
    {
        id: 'landslides',
        icon: '⛰️',
        title: 'Landslides',
        color: '#8B4513',
        summary: 'Warning signs and safety measures for landslides',
        preparedness: [
            'Know if your area is prone to landslides (steep slopes, recent fires)',
            'Watch for warning signs: new cracks in walls, tilting trees, bulging ground',
            'Install flexible pipe fittings to resist breakage',
            'Create proper drainage systems around your home',
            'Never build near steep slopes or mountain edges'
        ],
        during: [
            'If you suspect imminent landslide, evacuate immediately',
            'Move away from the path of the slide – go perpendicular to the flow',
            'If escape is not possible, curl into a ball and protect your head',
            'Stay alert for flash floods which often accompany landslides',
            'Listen for unusual sounds: trees cracking, boulders moving, rumbling'
        ],
        firstAid: [
            'Search for and assist trapped persons near the edge of the slide',
            'Check for injuries – focus on breathing and bleeding first',
            'Keep buried victims calm – help is coming',
            'Watch for broken gas lines or electrical damage before rescue',
            'Treat trauma injuries: fractures, crush injuries, head wounds'
        ],
        after: [
            'Stay away from the slide area – more slides can follow',
            'Check for damaged utility lines and report them',
            'Replant damaged ground ASAP to prevent further erosion',
            'Seek geotechnical assessment before returning to affected area',
            'Report to local disaster management authorities'
        ]
    }
];

function KnowledgeBase() {
    const [expandedCard, setExpandedCard] = useState(null);
    const [expandedSection, setExpandedSection] = useState({});

    const toggleCard = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
        setExpandedSection({});
    };

    const toggleSection = (cardId, section) => {
        setExpandedSection(prev => ({
            ...prev,
            [`${cardId}-${section}`]: !prev[`${cardId}-${section}`]
        }));
    };

    const sections = [
        { key: 'preparedness', label: '🛡️ Preparedness', data: 'preparedness' },
        { key: 'during', label: '⚡ During Emergency', data: 'during' },
        { key: 'firstAid', label: '🏥 First Aid', data: 'firstAid' },
        { key: 'after', label: '🔄 After the Event', data: 'after' }
    ];

    return (
        <div className="knowledge-page">
            <div className="kb-hero">
                <h1>🏥 Emergency Knowledge Base</h1>
                <p>Instant access to life-saving protocols. Tap any card to expand detailed first aid and safety procedures.</p>
                <div className="kb-hero-badge">📴 Offline-Ready Safety Protocols</div>
            </div>

            <div className="kb-grid">
                {knowledgeCards.map(card => (
                    <div key={card.id} className={`kb-card ${expandedCard === card.id ? 'expanded' : ''}`}>
                        <div
                            className="kb-card-header"
                            onClick={() => toggleCard(card.id)}
                            style={{ borderLeftColor: card.color }}
                        >
                            <div className="kb-card-icon" style={{ background: card.color }}>
                                {card.icon}
                            </div>
                            <div className="kb-card-title">
                                <h3>{card.title}</h3>
                                <p>{card.summary}</p>
                            </div>
                            <span className="kb-expand-icon">
                                {expandedCard === card.id ? '▲' : '▼'}
                            </span>
                        </div>

                        {expandedCard === card.id && (
                            <div className="kb-card-body">
                                {sections.map(section => {
                                    const isOpen = expandedSection[`${card.id}-${section.key}`];
                                    return (
                                        <div key={section.key} className="kb-section">
                                            <div
                                                className="kb-section-header"
                                                onClick={() => toggleSection(card.id, section.key)}
                                            >
                                                <span>{section.label}</span>
                                                <span className="kb-section-toggle">{isOpen ? '−' : '+'}</span>
                                            </div>
                                            {isOpen && (
                                                <ul className="kb-section-list">
                                                    {card[section.data].map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="kb-emergency-numbers">
                <h3>📞 Emergency Helplines</h3>
                <div className="helpline-grid">
                    <div className="helpline-card">
                        <span className="helpline-number">112</span>
                        <span className="helpline-label">National Emergency</span>
                    </div>
                    <div className="helpline-card">
                        <span className="helpline-number">101</span>
                        <span className="helpline-label">Fire Department</span>
                    </div>
                    <div className="helpline-card">
                        <span className="helpline-number">108</span>
                        <span className="helpline-label">Ambulance</span>
                    </div>
                    <div className="helpline-card">
                        <span className="helpline-number">1078</span>
                        <span className="helpline-label">Disaster Helpline</span>
                    </div>
                    <div className="helpline-card">
                        <span className="helpline-number">011-2436-3260</span>
                        <span className="helpline-label">NDRF</span>
                    </div>
                    <div className="helpline-card">
                        <span className="helpline-number">1070</span>
                        <span className="helpline-label">Flood / Cyclone</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KnowledgeBase;
