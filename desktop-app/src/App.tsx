import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Search, Terminal, Check, X, Download, Sparkles, Trash2, BookOpen, HardDrive, ChevronDown, ChevronRight, Loader2, LogOut } from 'lucide-react';

// Types matching Rust backend
interface Agent {
  id: string;
  name: string;
  installed: boolean;
  install_path: string | null;
  skills_dir: string | null;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  owner: string;
  repo: string;
  category: string;
  agents: string[];
  install_command: string;
  tags?: string[];
}

interface InstallResult {
  success: boolean;
  message: string;
  agent: string;
}

interface AgentInstalledSkills {
  agent_id: string;
  agent_name: string;
  skills: string[];
}

// Mock skills data (fallback) - expanded with more examples
const FALLBACK_SKILLS: Skill[] = [
  {
    id: 'skillful-frontend-design',
    name: 'frontend-design',
    description: 'Design high-quality, production-ready frontend interfaces with strong layout, visual hierarchy, accessibility, and component taste.',
    owner: 'anthropics',
    repo: 'skills',
    category: 'Design',
    agents: ['claude-code', 'cursor', 'windsurf', 'codex'],
    install_command: 'npx skills add anthropics/skills/frontend-design',
  },
  {
    id: 'skillful-react-best-practices',
    name: 'react-best-practices',
    description: 'Review React and Next.js components for accessibility, performance, hooks usage, server/client boundaries, and TypeScript quality.',
    owner: 'vercel-labs',
    repo: 'agent-skills',
    category: 'Frontend',
    agents: ['claude-code', 'cursor', 'codex', 'github-copilot'],
    install_command: 'npx skills add vercel-labs/agent-skills/react-best-practices',
  },
  {
    id: 'skillful-test-driven-development',
    name: 'test-driven-development',
    description: 'Guide agents through test-first implementation, red-green-refactor loops, regression coverage, and verification discipline.',
    owner: 'obra',
    repo: 'superpowers',
    category: 'Testing',
    agents: ['claude-code', 'opencode', 'cursor', 'codex'],
    install_command: 'npx skills add obra/superpowers/test-driven-development',
  },
  {
    id: 'skillful-clean-code',
    name: 'clean-code',
    description: 'Apply Clean Code principles, SOLID, and best practices for maintainable, readable, and robust software.',
    owner: 'universal-skills-hub',
    repo: 'skills',
    category: 'Development',
    agents: ['claude-code', 'cursor', 'windsurf', 'cline'],
    install_command: 'npx skills add universal-skills-hub/skills/clean-code',
  },
  {
    id: 'skillful-security-audit',
    name: 'security-audit',
    description: 'Scan for common vulnerabilities, hardcoded secrets, unsafe patterns, and security best practices.',
    owner: 'anthropics',
    repo: 'skills',
    category: 'Security',
    agents: ['claude-code', 'cursor', 'codex'],
    install_command: 'npx skills add anthropics/skills/security-audit',
  },
  {
    id: 'skillful-db-schema',
    name: 'db-schema-design',
    description: 'Design database schemas with proper relationships, indexes, migrations, and follow database best practices.',
    owner: 'vercel-labs',
    repo: 'agent-skills',
    category: 'Database',
    agents: ['claude-code', 'cursor', 'codex', 'opencode'],
    install_command: 'npx skills add vercel-labs/agent-skills/db-schema-design',
  },
];

// Natural language search function
function naturalSearch(query: string, skills: Skill[]): Skill[] {
  if (!query.trim()) return skills;

  const normalizedQuery = query.toLowerCase().trim();

  // Remove common filler words for better search
  const fillerWords = ['a', 'an', 'the', 'i', 'want', 'need', 'for', 'that', 'skill', 'skills', 'to', 'be', 'which', 'can', 'help', 'with', 'something', 'look', 'find', 'get', 'search', 'looking', 'like', 'make', 'create', 'build', 'do', 'use', 'using', 'how', 'what', 'where', 'when', 'why', 'who'];

  // Intent patterns for better matching
  const intentPatterns = [
    // Frontend/UI intents
    { pattern: /frontend|front-end|ui|interface|design|layout|visual|component|react|vue|angular|html|css/, intent: 'frontend' },
    // Backend intents
    { pattern: /backend|back-end|server|api|database|db|sql|mongo|express|nest/, intent: 'backend' },
    // Testing intents
    { pattern: /test|testing|tdd|bdd|jest|cypress|coverage|unit|integration/, intent: 'testing' },
    // Security intents
    { pattern: /security|secure|vulnerability|audit|auth|oauth|jwt|permission|permission/, intent: 'security' },
    // DevOps intents
    { pattern: /devops|ci\/cd|deploy|docker|kubernetes|k8s|aws|cloud|infrastructure/, intent: 'devops' },
    // Code quality intents
    { pattern: /code.?quality|lint|eslint|prettier|refactor|clean.?code|solid|architecture/, intent: 'code-quality' },
    // Performance intents
    { pattern: /performance|optimize|speed|fast|lazy|loading|cache/, intent: 'performance' },
    // Documentation intents
    { pattern: /doc|documentation|readme|swagger|openapi|schema/, intent: 'documentation' },
    // Data/ML intents
    { pattern: /data|machine.?learning|ml|ai|analytics|pandas|numpy|tensorflow/, intent: 'data-ml' },
    // Mobile intents
    { pattern: /mobile|ios|android|react.?native|flutter|swift|kotlin/, intent: 'mobile' },
  ];

  const coreQuery = normalizedQuery.split(' ')
    .filter(word => !fillerWords.includes(word))
    .join(' ');

  // Extract key topics/intents from the query
  const topics = coreQuery.split(/\s+/).filter(t => t.length > 1);
  const detectedIntents = intentPatterns
    .filter(ip => ip.pattern.test(normalizedQuery))
    .map(ip => ip.intent);

  return skills.filter(skill => {
    const searchText = `${skill.name} ${skill.description} ${skill.category} ${skill.agents.join(' ')} ${skill.owner}/${skill.repo} ${skill.tags?.join(' ') || ''}`.toLowerCase();

    // Check if any topic matches
    const topicMatches = topics.some(topic => {
      // Check for partial matches and synonyms
      const topicVariants = [
        topic,
        topic.replace(/ing$/, ''),
        topic.replace(/tion$/, 't'),
        topic.replace(/s$/, ''),
        topic.replace(/ed$/, ''),
        topic.replace(/er$/, ''),
        topic.replace(/est$/, ''),
      ];

      return topicVariants.some(variant =>
        searchText.includes(variant) ||
        // Fuzzy match for common terms
        (topic.length > 3 && (
          searchText.includes(topic.substring(0, Math.floor(topic.length * 0.6))) ||
          LevenshteinDistance(topic, searchText.split(' ').join('')) < 4
        ))
      );
    });

    // Check if detected intents match
    const intentMatches = detectedIntents.some(intent =>
      searchText.includes(intent) ||
      searchText.includes(intent.replace(/-/g, ''))
    );

    // Also do a direct text search
    const directMatch = searchText.includes(normalizedQuery) ||
                        searchText.includes(coreQuery) ||
                        coreQuery.split(' ').every(word => searchText.includes(word) || word.length < 3);

    // Boost score for intent matches
    const hasIntentMatch = intentMatches && detectedIntents.length > 0;

    return (topicMatches || directMatch || hasIntentMatch);
  }).sort((a, b) => {
    // Prioritize exact name matches
    const aExact = a.name.toLowerCase().includes(coreQuery.replace(/\s+/g, '')) ? 2 : 0;
    const bExact = b.name.toLowerCase().includes(coreQuery.replace(/\s+/g, '')) ? 2 : 0;

    // Boost for intent matches
    const aIntent = detectedIntents.some(intent => `${a.name} ${a.description} ${a.category}`.toLowerCase().includes(intent)) ? 1 : 0;
    const bIntent = detectedIntents.some(intent => `${b.name} ${b.description} ${b.category}`.toLowerCase().includes(intent)) ? 1 : 0;

    return (bExact + bIntent) - (aExact + aIntent);
  });
}

// Simple Levenshtein distance for fuzzy matching
function LevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>(FALLBACK_SKILLS);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>(FALLBACK_SKILLS);
  const [installedSkillsList, setInstalledSkillsList] = useState<AgentInstalledSkills[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [installingSkill, setInstallingSkill] = useState<string | null>(null);
  const [installResults, setInstallResults] = useState<InstallResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillsLoadError, setSkillsLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'installed'>('catalog');
  const [removingSkill, setRemovingSkill] = useState<{ agent: string; skill: string } | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [installedSearchQuery, setInstalledSearchQuery] = useState('');
  const [selectedSkillsToInstall, setSelectedSkillsToInstall] = useState<Set<string>>(new Set());
  const [selectedSkillsToUninstall, setSelectedSkillsToUninstall] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSkills, setTotalSkills] = useState(0);
  
  // Login state - load from localStorage on init
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = checking

  // Check for existing session on mount - try to verify with web
  useEffect(() => {
    const checkSession = async () => {
      // First check localStorage
      const savedSession = localStorage.getItem('skillshub_session');
      
      // Try to verify with web API
      try {
        const response = await invoke<{ logged_in: boolean }>('check_web_session');
        if (response.logged_in) {
          localStorage.setItem('skillshub_session', 'active');
          setIsLoggedIn(true);
          loadAgents();
          loadSkillsPaginated(1);
          loadInstalledSkills();
          return;
        }
      } catch (error) {
        console.log('Web session check failed, using local session');
      }
      
      // Fallback to local storage
      if (savedSession === 'active') {
        setIsLoggedIn(true);
        loadAgents();
        loadSkillsPaginated(1);
        loadInstalledSkills();
      } else {
        setIsLoggedIn(false);
      }
    };
    
    checkSession();
  }, []);

  // Poll for session while not logged in (check every 3 seconds if user signed in on web)
  useEffect(() => {
    if (isLoggedIn === false) {
      const interval = setInterval(async () => {
        try {
          const response = await invoke<{ logged_in: boolean }>('check_web_session');
          if (response.logged_in) {
            localStorage.setItem('skillshub_session', 'active');
            setIsLoggedIn(true);
            loadAgents();
            loadSkillsPaginated(1);
            loadInstalledSkills();
          }
        } catch (error) {
          // Ignore errors during polling
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
    loadSkillsPaginated(1);
    loadInstalledSkills();
  }, []);

  // Natural language search
  useEffect(() => {
    let result = naturalSearch(searchQuery, skills);

    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    setFilteredSkills(result);
  }, [searchQuery, selectedCategory, skills]);

  const handleLogout = () => {
    localStorage.removeItem('skillshub_session');
    setIsLoggedIn(false);
    setSkills(FALLBACK_SKILLS);
    setFilteredSkills(FALLBACK_SKILLS);
    setAgents([]);
    setInstalledSkillsList([]);
  };

  const openExternalUrl = async (url: string) => {
    try {
      await invoke('open_external_url', { url });
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const detectedAgents = await invoke<Agent[]>('detect_agents');
      setAgents(detectedAgents);
      const installedIds = detectedAgents
        .filter((a) => a.installed)
        .map((a) => a.id);
      setSelectedAgents(installedIds);
    } catch (error) {
      console.error('Failed to detect agents:', error);
      setAgents([
        { id: 'claude-code', name: 'Claude Code', installed: true, install_path: null, skills_dir: null },
        { id: 'cursor', name: 'Cursor', installed: false, install_path: null, skills_dir: null },
        { id: 'opencode', name: 'OpenCode', installed: false, install_path: null, skills_dir: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillsPaginated = async (page: number) => {
    setLoadingSkills(true);
    setSkillsLoadError(null);
    console.log(`[loadSkillsPaginated] Fetching page ${page}...`);

    try {
      const response = await invoke<{
        skills: Skill[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>('fetch_skills_paginated', { page, pageSize: 30 });

      console.log(`[loadSkillsPaginated] ✓ Returned ${response.skills.length} skills (page ${response.page} of ${response.totalPages})`);

      if (response.skills.length > 0) {
        setSkills(response.skills);
        setFilteredSkills(response.skills);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        setTotalSkills(response.total);
        console.log(`[loadSkillsPaginated] ✓ Loaded page ${response.page} with ${response.skills.length} skills`);
      } else {
        console.warn('[loadSkillsPaginated] ⚠ Returned empty array, using fallback');
        setSkills(FALLBACK_SKILLS);
        setFilteredSkills(FALLBACK_SKILLS);
        setTotalSkills(FALLBACK_SKILLS.length);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('[loadSkillsPaginated] ✗ ERROR:', error);
      setSkillsLoadError(String(error));
      console.log('[loadSkillsPaginated] Using fallback catalog due to error');
      setSkills(FALLBACK_SKILLS);
      setFilteredSkills(FALLBACK_SKILLS);
      setTotalSkills(FALLBACK_SKILLS.length);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadInstalledSkills = async () => {
    try {
      const installed = await invoke<AgentInstalledSkills[]>('get_installed_skills');
      setInstalledSkillsList(installed);
    } catch (error) {
      console.error('Failed to load installed skills:', error);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const toggleExpandAgent = (agentId: string) => {
    setExpandedAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const toggleSkillToInstall = (skillId: string) => {
    setSelectedSkillsToInstall((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const toggleSkillToUninstall = (agentId: string, skillName: string) => {
    const key = `${agentId}:${skillName}`;
    setSelectedSkillsToUninstall((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const installSkill = async (skill: Skill) => {
    if (selectedAgents.length === 0) {
      alert('Select at least one agent to install the skill');
      return;
    }

    setInstallingSkill(skill.id);
    setInstallResults([]);

    try {
      const results = await invoke<InstallResult[]>('install_skill_to_multiple', {
        skill,
        agentIds: selectedAgents,
      });
      setInstallResults(results);
      loadInstalledSkills();
    } catch (error) {
      console.error('Installation failed:', error);
      setInstallResults([
        {
          success: false,
          message: `Error: ${error}`,
          agent: selectedAgents.join(', '),
        },
      ]);
    } finally {
      setInstallingSkill(null);
    }
  };

  const installSelectedSkills = async () => {
    if (selectedSkillsToInstall.size === 0 || selectedAgents.length === 0) {
      return;
    }

    const skillsToInstall = filteredSkills.filter(s => selectedSkillsToInstall.has(s.id));
    setInstallingSkill('batch');

    for (const skill of skillsToInstall) {
      try {
        const results = await invoke<InstallResult[]>('install_skill_to_multiple', {
          skill,
          agentIds: selectedAgents,
        });
        setInstallResults(prev => [...prev, ...results]);
      } catch (error) {
        setInstallResults(prev => [...prev, {
          success: false,
          message: `Error installing ${skill.name}: ${error}`,
          agent: selectedAgents.join(', '),
        }]);
      }
    }

    setInstallingSkill(null);
    setSelectedSkillsToInstall(new Set());
    loadInstalledSkills();
  };

  const uninstallSkill = async (skillName: string, agentId: string) => {
    setRemovingSkill({ agent: agentId, skill: skillName });

    try {
      const result = await invoke<InstallResult>('uninstall_skill', {
        skillName,
        agentId,
      });

      if (result.success) {
        loadInstalledSkills();
      } else {
        alert(`Error uninstalling: ${result.message}`);
      }
    } catch (error) {
      console.error('Uninstall failed:', error);
      alert(`Error: ${error}`);
    } finally {
      setRemovingSkill(null);
    }
  };

  const uninstallSelectedSkills = async () => {
    if (selectedSkillsToUninstall.size === 0) return;

    setRemovingSkill({ agent: 'batch', skill: 'batch' });

    for (const key of selectedSkillsToUninstall) {
      const [agentId, skillName] = key.split(':');
      try {
        const result = await invoke<InstallResult>('uninstall_skill', {
          skillName,
          agentId,
        });
        if (!result.success) {
          alert(`Error uninstalling ${skillName} from ${agentId}: ${result.message}`);
        }
      } catch (error) {
        alert(`Error: ${error}`);
      }
    }

    setRemovingSkill(null);
    setSelectedSkillsToUninstall(new Set());
    loadInstalledSkills();
  };

  const isSkillInstalledForAgent = (skillName: string): boolean => {
    return installedSkillsList.some((agent) =>
      agent.skills.some((s) => s.toLowerCase() === skillName.toLowerCase())
    );
  };

  const getInstalledAgentsForSkill = (skillName: string): string[] => {
    return installedSkillsList
      .filter((agent) => agent.skills.some((s) => s.toLowerCase() === skillName.toLowerCase()))
      .map((agent) => agent.agent_name);
  };

  const categories = ['all', ...new Set(skills.map((s) => s.category))];
  const installedAgents = agents.filter((a) => a.installed);

  // Filter installed skills by search query
  const filteredInstalledSkills = useMemo(() => {
    if (!installedSearchQuery.trim()) return installedSkillsList;

    return installedSkillsList.map(agent => ({
      ...agent,
      skills: agent.skills.filter(skillName =>
        naturalSearch(installedSearchQuery, [{ id: skillName, name: skillName, description: '', owner: '', repo: '', category: '', agents: [], install_command: '', tags: [] }]).length > 0
      ),
    })).filter(agent => agent.skills.length > 0);
  }, [installedSkillsList, installedSearchQuery]);

  // Check if any operation is in progress
  const isOperating = installingSkill !== null || removingSkill !== null;

  // Loading state while checking for existing session
  if (isLoggedIn === null) {
    return (
      <div className="app">
        <div className="loading-screen">
          <Loader2 className="loading-spinner" />
          <p>Loading...</p>
        </div>
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            gap: 1rem;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            color: var(--accent-cyan);
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .loading-screen p {
            color: var(--text-secondary);
          }
        `}</style>
      </div>
    );
  }

  // Login screen if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="login-screen">
          <div className="login-container">
            <div className="login-logo">
              <Sparkles className="login-sparkle" />
              <span className="login-logo-text">Skills<span className="login-hub">Hub</span></span>
            </div>
            
            <h1 className="login-title">Sign in to continue</h1>
            <p className="login-subtitle">Access your account to use the desktop app</p>
            
            <div className="web-login-prompt">
              <div className="web-login-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
              </div>
              <h3>Sign in on the website</h3>
              <p>Click the button below to sign in with your account. Once signed in, you'll be automatically logged into this app.</p>
              
              <button 
                type="button" 
                className="web-login-btn"
                onClick={() => openExternalUrl('https://universal-skills-hub.vercel.app/login?callbackUrl=app')}
              >
                Sign In on Website
              </button>
              
              <div className="login-status">
                <p className="status-text">Waiting for sign in...</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            
            <div className="login-divider">
              <span>or</span>
            </div>
            
            <button 
              type="button" 
              className="github-login-btn"
              onClick={() => openExternalUrl('https://universal-skills-hub.vercel.app/api/auth/signin?callbackUrl=app')}
            >
              <svg viewBox="0 0 24 24" className="github-icon">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
            
            <div className="login-register-section">
              <span className="register-text">Don't have an account?</span>
              <button 
                type="button" 
                className="register-link"
                onClick={() => openExternalUrl('https://universal-skills-hub.vercel.app/login?callbackUrl=app')}
              >
                Register here
              </button>
            </div>
          </div>
        </div>
        
        <style>{`
          .login-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            padding: 2rem;
          }
          
          .login-container {
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          
          .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 2rem;
          }
          
          .login-logo-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            border: 1px solid rgba(0, 212, 255, 0.25);
            background: rgba(0, 212, 255, 0.1);
          }
          
          .login-sparkle {
            width: 24px;
            height: 24px;
            color: var(--accent-cyan);
          }
          
          .login-logo-text {
            font-family: 'Geist Mono', monospace;
            font-size: 1.5rem;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: white;
          }
          
          .login-hub {
            color: var(--accent-cyan);
          }
          
          .login-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: white;
            margin-bottom: 0.5rem;
          }
          
          .login-subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
          }
          
          .login-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .form-group {
            text-align: left;
          }
          
          .form-group label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
          }
          
          .web-login-prompt {
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: 1rem;
            padding: 1.5rem;
            text-align: center;
          }
          
          .web-login-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 212, 255, 0.1);
            border-radius: 50%;
          }
          
          .web-login-icon svg {
            width: 24px;
            height: 24px;
            color: var(--accent-cyan);
          }
          
          .web-login-prompt h3 {
            font-size: 1.125rem;
            font-weight: 600;
            color: white;
            margin-bottom: 0.5rem;
          }
          
          .web-login-prompt p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          
          .web-login-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-violet));
            border: none;
            border-radius: 0.75rem;
            color: #000;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          
          .web-login-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
          }
          
          .login-status {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-subtle);
          }
          
          .status-text {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
          }
          
          .loading-dots {
            display: flex;
            justify-content: center;
            gap: 0.375rem;
          }
          
          .loading-dots span {
            width: 6px;
            height: 6px;
            background: var(--accent-cyan);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          
          .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
          .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
          
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          
          .login-input {
            width: 100%;
            padding: 0.875rem 1rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: 0.75rem;
            color: var(--text-primary);
            font-size: 1rem;
          }
          
          .login-input:focus {
            outline: none;
            border-color: var(--accent-cyan);
          }
          
          .login-input::placeholder {
            color: var(--text-muted);
          }
          
          .login-error {
            padding: 0.75rem;
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.3);
            border-radius: 0.5rem;
            color: var(--accent-crimson);
            font-size: 0.875rem;
          }
          
          .login-btn {
            width: 100%;
            padding: 0.875rem;
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-violet));
            border: none;
            border-radius: 0.75rem;
            color: #000;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          
          .login-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
          }
          
          .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .login-divider {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin: 1.5rem 0;
          }
          
          .login-divider::before,
          .login-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border-subtle);
          }
          
          .login-divider span {
            color: var(--text-muted);
            font-size: 0.875rem;
          }
          
          .github-login-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.875rem;
            background: #24292e;
            border: 1px solid #444c56;
            border-radius: 0.75rem;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          
          .github-login-btn:hover {
            background: #2f363d;
            border-color: #586069;
          }
          
          .github-icon {
            width: 20px;
            height: 20px;
            fill: white;
          }
          
          .login-register-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 1rem;
          }
          
          .register-text {
            color: var(--text-secondary);
            font-size: 0.875rem;
          }
          
          .register-link {
            color: var(--accent-cyan);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            background: none;
            border: none;
            text-decoration: underline;
            padding: 0;
          }
          
          .register-link:hover {
            color: var(--accent-cyan);
            opacity: 0.8;
          }
            text-decoration: underline;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Blocking Overlay */}
      {isOperating && (
        <div className="blocking-overlay">
          <div className="overlay-content">
            <Loader2 className="spinner" />
            <h3>{installingSkill ? 'Installing...' : 'Removing...'}</h3>
            <p>Please wait, this operation is in progress</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <Sparkles className="logo-sparkle" />
            </div>
            <span className="logo-text">Skills<span className="logo-hub">Hub</span></span>
          </div>
          <div className="header-badge">
            <Sparkles className="header-badge-icon" />
            Desktop App
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <BookOpen className="tab-icon" />
          Skills Catalog
        </button>
        <button
          className={`tab-btn ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          <HardDrive className="tab-icon" />
          Installed Skills
          {installedSkillsList.reduce((acc, agent) => acc + agent.skills.length, 0) > 0 && (
            <span className="tab-badge">
              {installedSkillsList.reduce((acc, agent) => acc + agent.skills.length, 0)}
            </span>
          )}
        </button>
      </div>

      <main className="main">
        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <>
            {/* Agents Panel */}
            <section className="agents-panel">
              <div className="panel-header">
                <h2>
                  <Terminal className="panel-icon" />
                  Installed Agents
                </h2>
                <span className="agent-count">{installedAgents.length} detected</span>
              </div>

              {loading ? (
                <div className="loading">Detecting agents...</div>
              ) : (
                <div className="agents-grid">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      className={`agent-card ${agent.installed ? 'installed' : 'not-installed'} ${
                        selectedAgents.includes(agent.id) ? 'selected' : ''
                      }`}
                      onClick={() => agent.installed && toggleAgent(agent.id)}
                      disabled={!agent.installed || isOperating}
                    >
                      <div className="agent-status">
                        {agent.installed ? (
                          <Check className="status-icon installed" />
                        ) : (
                          <X className="status-icon not-installed" />
                        )}
                      </div>
                      <div className="agent-info">
                        <span className="agent-name">{agent.name}</span>
                        <span className="agent-status-text">
                          {agent.installed ? 'Available' : 'Not installed'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedAgents.length > 0 && (
                <div className="selected-agents">
                  <span className="selected-label">Install in:</span>
                  <div className="selected-tags">
                    {selectedAgents.map((id) => {
                      const agent = agents.find((a) => a.id === id);
                      return agent ? (
                        <span key={id} className="selected-tag">
                          {agent.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Bulk install section */}
              {selectedSkillsToInstall.size > 0 && (
                <div className="bulk-actions">
                  <span className="bulk-count">{selectedSkillsToInstall.size} skills selected</span>
                  <button
                    className="bulk-install-btn"
                    onClick={installSelectedSkills}
                    disabled={isOperating || selectedAgents.length === 0}
                  >
                    <Download className="btn-icon" />
                    Install Selected
                  </button>
                </div>
              )}
            </section>

            {/* Skills Panel */}
            <section className="skills-panel">
              {/* Search */}
              <div className="search-bar">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search skills... (e.g., 'I need a skill for frontend design')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  disabled={isOperating}
                />
              </div>

              {/* Category Filter */}
              <div className="category-filter">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                    disabled={isOperating}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              {/* Loading indicator for skills */}
              {loadingSkills && (
                <div className="skills-loading">
                  <Loader2 className="spinner" />
                  <span>Cargando skills de la API... (esto puede tomar un momento)</span>
                </div>
              )}

              {/* Error message */}
              {skillsLoadError && (
                <div className="skills-error">
                  <X className="error-icon" />
                  <span>Error: {skillsLoadError}</span>
                </div>
              )}

              {/* Results count with pagination */}
              {!loadingSkills && !skillsLoadError && (
                <div className="pagination-info">
                  <div className="skills-count">
                    Showing {((currentPage - 1) * 30) + 1}-{Math.min(currentPage * 30, totalSkills)} of {totalSkills} skills
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <button
                        className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                        onClick={() => loadSkillsPaginated(currentPage - 1)}
                        disabled={currentPage === 1 || loadingSkills}
                      >
                        Previous
                      </button>
                      
                      <span className="page-indicator">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                        onClick={() => loadSkillsPaginated(currentPage + 1)}
                        disabled={currentPage === totalPages || loadingSkills}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Install Results */}
              {installResults.length > 0 && (
                <div className="install-results">
                  {installResults.map((result, i) => (
                    <div
                      key={i}
                      className={`result-item ${result.success ? 'success' : 'error'}`}
                    >
                      {result.success ? (
                        <Check className="result-icon" />
                      ) : (
                        <X className="result-icon" />
                      )}
                      <span>{result.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills Grid */}
              <div className="skills-grid">
                {filteredSkills.map((skill) => {
                  const installedAgentsList = getInstalledAgentsForSkill(skill.name);
                  const isInstalled = isSkillInstalledForAgent(skill.name);

                  return (
                    <div key={skill.id} className={`skill-card ${selectedSkillsToInstall.has(skill.id) ? 'selected-to-install' : ''}`}>
                      {/* Selection checkbox */}
                      <label className="skill-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSkillsToInstall.has(skill.id)}
                          onChange={() => toggleSkillToInstall(skill.id)}
                          disabled={isOperating}
                        />
                        <span className="checkmark"></span>
                      </label>

                      <div className="skill-header">
                        <span className="skill-category">{skill.category}</span>
                        <span className="skill-owner">{skill.owner}/{skill.repo}</span>
                      </div>
                      <h3 className="skill-name">{skill.name}</h3>
                      <p className="skill-description">{skill.description}</p>

                      {/* Installed agents indicator */}
                      {isInstalled && (
                        <div className="skill-installed-badge">
                          <Check className="installed-badge-icon" />
                          Installed in: {installedAgentsList.join(', ')}
                        </div>
                      )}

                      <div className="skill-agents">
                        {skill.agents.slice(0, 4).map((agent) => (
                          <span key={agent} className="skill-agent-tag">
                            {agent}
                          </span>
                        ))}
                        {skill.agents.length > 4 && (
                          <span className="skill-agent-more">+{skill.agents.length - 4}</span>
                        )}
                      </div>

                      {/* Action button - Install or Delete */}
                      {isInstalled ? (
                        <button
                          className="uninstall-btn"
                          onClick={() => {
                            // Uninstall from first agent that has it
                            const agentWithSkill = installedSkillsList.find(a =>
                              a.skills.some(s => s.toLowerCase() === skill.name.toLowerCase())
                            );
                            if (agentWithSkill) {
                              uninstallSkill(skill.name, agentWithSkill.agent_id);
                            }
                          }}
                          disabled={isOperating}
                        >
                          <Trash2 className="btn-icon" />
                          Delete
                        </button>
                      ) : (
                        <button
                          className={`install-btn ${installingSkill === skill.id ? 'installing' : ''}`}
                          onClick={() => installSkill(skill)}
                          disabled={isOperating || selectedAgents.length === 0}
                        >
                          <Download className="install-icon" />
                          {installingSkill === skill.id ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Installed Skills Tab (Dashboard) */}
        {activeTab === 'installed' && (
          <section className="installed-panel">
            <div className="installed-header">
              <h2>Installed Skills</h2>
              <p className="installed-subtitle">Manage skills installed in each agent</p>
            </div>

            {/* Search in installed skills */}
            <div className="search-bar installed-search">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search installed skills... (e.g., 'skills for testing')"
                value={installedSearchQuery}
                onChange={(e) => setInstalledSearchQuery(e.target.value)}
                className="search-input"
                disabled={isOperating}
              />
            </div>

            {/* Bulk uninstall section */}
            {selectedSkillsToUninstall.size > 0 && (
              <div className="bulk-actions">
                <span className="bulk-count">{selectedSkillsToUninstall.size} skills selected</span>
                <button
                  className="bulk-uninstall-btn"
                  onClick={uninstallSelectedSkills}
                  disabled={isOperating}
                >
                  <Trash2 className="btn-icon" />
                  Remove Selected
                </button>
              </div>
            )}

            {filteredInstalledSkills.length === 0 ? (
              <div className="empty-state">
                <HardDrive className="empty-icon" />
                <p>No installed skills found</p>
                <span>Install some from the catalog</span>
              </div>
            ) : (
              <div className="installed-list">
                {filteredInstalledSkills.map((agent) => (
                  <div key={agent.agent_id} className="agent-installed-section">
                    <button
                      className="agent-installed-header"
                      onClick={() => toggleExpandAgent(agent.agent_id)}
                      disabled={isOperating}
                    >
                      <div className="agent-header-left">
                        {expandedAgents.has(agent.agent_id) ? (
                          <ChevronDown className="expand-icon" />
                        ) : (
                          <ChevronRight className="expand-icon" />
                        )}
                        <span className="agent-installed-name">{agent.agent_name}</span>
                      </div>
                      <span className="agent-installed-count">{agent.skills.length} skills</span>
                    </button>

                    {expandedAgents.has(agent.agent_id) && (
                      <div className="agent-skills-list">
                        {agent.skills.length === 0 ? (
                          <span className="no-skills">No skills installed</span>
                        ) : (
                          agent.skills.map((skillName) => {
                            const key = `${agent.agent_id}:${skillName}`;
                            return (
                              <div key={skillName} className={`installed-skill-item ${selectedSkillsToUninstall.has(key) ? 'selected-to-remove' : ''}`}>
                                <label className="skill-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={selectedSkillsToUninstall.has(key)}
                                    onChange={() => toggleSkillToUninstall(agent.agent_id, skillName)}
                                    disabled={isOperating}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                                <span className="installed-skill-name">{skillName}</span>
                                <button
                                  className="uninstall-btn-small"
                                  onClick={() => uninstallSkill(skillName, agent.agent_id)}
                                  disabled={removingSkill !== null}
                                  title="Remove skill"
                                >
                                  <Trash2 className="uninstall-icon" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <style>{`
        .app {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          position: relative;
        }

        /* Blocking Overlay */
        .blocking-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .overlay-content {
          text-align: center;
          color: white;
        }

        .overlay-content h3 {
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem;
        }

        .overlay-content p {
          color: #aaa;
        }

        .spinner {
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
          color: var(--accent-cyan);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          padding: 1rem 1.5rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          background: rgba(0, 212, 255, 0.1);
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
        }

        .logo-sparkle {
          width: 18px;
          height: 18px;
          color: var(--accent-cyan);
        }

        .logo-text {
          font-family: 'Geist Mono', monospace;
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: white;
        }

        .logo-hub {
          color: var(--accent-cyan);
        }

        .header-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-violet);
        }

        .header-badge-icon {
          width: 14px;
          height: 14px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: 0.5rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .logout-btn:hover {
          border-color: var(--accent-crimson);
          color: var(--accent-crimson);
        }

        .tab-nav {
          display: flex;
          gap: 0;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          padding: 0 1.5rem;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--accent-cyan);
          border-bottom-color: var(--accent-cyan);
        }

        .tab-icon {
          width: 18px;
          height: 18px;
        }

        .tab-badge {
          background: var(--accent-cyan);
          color: #000;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
        }

        .main {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr;
          overflow: hidden;
        }

        .agents-panel {
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-subtle);
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .panel-icon {
          width: 16px;
          height: 16px;
          color: var(--accent-cyan);
        }

        .agent-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .loading {
          color: var(--text-muted);
          font-size: 0.875rem;
          text-align: center;
          padding: 2rem;
        }

        .agents-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .agent-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .agent-card:not(:disabled):hover {
          border-color: var(--accent-cyan);
        }

        .agent-card.selected {
          border-color: var(--accent-cyan);
          background: rgba(0, 212, 255, 0.08);
        }

        .agent-card.not-installed {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agent-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agent-status {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-icon {
          width: 16px;
          height: 16px;
        }

        .status-icon.installed {
          color: var(--accent-emerald);
        }

        .status-icon.not-installed {
          color: var(--text-muted);
        }

        .agent-info {
          display: flex;
          flex-direction: column;
        }

        .agent-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .agent-status-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .selected-agents {
          margin-top: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .selected-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .selected-tag {
          padding: 0.25rem 0.5rem;
          background: rgba(0, 212, 255, 0.15);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 0.375rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent-cyan);
        }

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 0.75rem;
          margin-top: auto;
        }

        .bulk-count {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent-cyan);
        }

        .bulk-install-btn, .bulk-uninstall-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bulk-install-btn {
          background: var(--accent-cyan);
          color: #000;
        }

        .bulk-install-btn:hover:not(:disabled) {
          background: #00c8e0;
        }

        .bulk-uninstall-btn {
          background: var(--accent-crimson);
          color: white;
        }

        .bulk-uninstall-btn:hover:not(:disabled) {
          background: #ff4d6a;
        }

        .bulk-install-btn:disabled, .bulk-uninstall-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 14px;
          height: 14px;
        }

        .skills-panel {
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .search-bar {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.75rem;
          color: var(--text-primary);
          font-size: 0.9375rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-btn {
          padding: 0.375rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .category-btn:hover:not(:disabled) {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .category-btn.active {
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
          color: #000;
        }

        .category-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .skills-count {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .pagination-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-btn:hover:not(:disabled) {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .page-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .skills-loading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 0.75rem;
          color: var(--accent-cyan);
          font-size: 0.875rem;
        }

        .skills-loading .spinner {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        .skills-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: 0.5rem;
          color: var(--accent-crimson);
          font-size: 0.8125rem;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .install-results {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
        }

        .result-item.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
        }

        .result-item.error {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: var(--accent-crimson);
        }

        .result-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .skill-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          padding: 1.25rem;
          padding-left: 3rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.15s ease;
          position: relative;
        }

        .skill-card:hover {
          border-color: rgba(0, 212, 255, 0.4);
          transform: translateY(-2px);
        }

        .skill-card.selected-to-install {
          border-color: var(--accent-cyan);
          background: rgba(0, 212, 255, 0.05);
        }

        .skill-checkbox {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          display: flex;
          align-items: center;
        }

        .skill-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--accent-cyan);
        }

        .skill-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .skill-category {
          padding: 0.25rem 0.5rem;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 0.375rem;
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .skill-owner {
          font-family: 'Geist Mono', monospace;
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .skill-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .skill-description {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .skill-installed-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--accent-emerald);
        }

        .installed-badge-icon {
          width: 14px;
          height: 14px;
        }

        .skill-agents {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .skill-agent-tag {
          padding: 0.1875rem 0.4375rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.25rem;
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .skill-agent-more {
          padding: 0.1875rem 0.4375rem;
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .install-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-violet));
          border: none;
          border-radius: 0.5rem;
          color: #000;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: auto;
        }

        .install-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        }

        .install-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .install-btn.installing {
          opacity: 0.7;
        }

        .install-icon {
          width: 14px;
          height: 14px;
        }

        .uninstall-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: 0.5rem;
          color: var(--accent-crimson);
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: auto;
        }

        .uninstall-btn:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.2);
          border-color: rgba(244, 63, 94, 0.5);
        }

        .uninstall-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Installed Panel Styles */
        .installed-panel {
          grid-column: 1 / -1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .installed-header {
          margin-bottom: 0.5rem;
        }

        .installed-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .installed-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .installed-search {
          margin-bottom: 0.5rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          color: var(--text-muted);
          margin-bottom: 1rem;
        }

        .empty-state p {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .empty-state span {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .installed-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .agent-installed-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          overflow: hidden;
        }

        .agent-installed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1rem 1.25rem;
          background: var(--bg-tertiary);
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .agent-installed-header:hover:not(:disabled) {
          background: rgba(0, 212, 255, 0.1);
        }

        .agent-installed-header:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agent-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .expand-icon {
          width: 20px;
          height: 20px;
          color: var(--text-muted);
        }

        .agent-installed-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .agent-installed-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .agent-skills-list {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .no-skills {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 0.5rem;
        }

        .installed-skill-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: 0.5rem;
          transition: all 0.15s ease;
        }

        .installed-skill-item:hover {
          border-color: rgba(0, 212, 255, 0.3);
        }

        .installed-skill-item.selected-to-remove {
          border-color: var(--accent-crimson);
          background: rgba(244, 63, 94, 0.05);
        }

        .installed-skill-item .skill-checkbox {
          position: relative;
          top: auto;
          right: auto;
        }

        .installed-skill-name {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .uninstall-btn-small {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.3);
          border-radius: 0.375rem;
          color: var(--accent-crimson);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .uninstall-btn-small:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.2);
          border-color: rgba(244, 63, 94, 0.5);
        }

        .uninstall-btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .uninstall-icon {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  );
}
