import type { AgentDefinition, AgentId } from '@/types';
import claudeCodeImage from '../../public/images/claudecode.svg';
import opencodeImage from '../../public/images/opencode.svg';
import cursorImage from '../../public/images/cursor.svg';
import windsurfImage from '../../public/images/windsurf.svg';
import geminicliImage from '../../public/images/geminicli.svg';
import clineImage from '../../public/images/cline.svg';
import githubCopilotImage from '../../public/images/github-copilot.svg';
import codexImage from '../../public/images/codex.svg';

export const AGENTS: AgentDefinition[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    description: 'Terminal coding agent from Anthropic with first-class support for reusable skills.',
    installSummary: 'Install the Claude Code CLI, authenticate with Anthropic, then add skills from a repository.',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    websiteUrl: 'https://www.anthropic.com/claude-code',
    imagePath: claudeCodeImage,
    installSteps: [
      'Install Node.js 20+ if you do not already have it.',
      'Install Claude Code following Anthropic\'s official CLI instructions.',
      'Authenticate with your Anthropic account from the terminal.',
      'Add skills from trusted GitHub repositories and review their SKILL.md before use.',
    ],
    skillLocation: 'Typically distributed as repositories containing a SKILL.md file.',
    skillNotes: [
      'Review permissions and commands before installing third-party skills.',
      'Prefer small, focused skills with clear instructions over huge prompt dumps.',
    ],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    vendor: 'OpenCode',
    description: 'Open-source terminal agent focused on extensibility and model flexibility.',
    installSummary: 'Install OpenCode, configure your provider keys, then add compatible skills or agent instructions.',
    docsUrl: 'https://opencode.ai/docs',
    websiteUrl: 'https://opencode.ai',
    imagePath: opencodeImage,
    installSteps: [
      'Install OpenCode using the official package manager command for your OS.',
      'Configure your preferred model provider credentials.',
      'Create or import skill instructions into your OpenCode configuration.',
      'Run a small task first to validate the skill behavior before trusting it broadly.',
    ],
    skillLocation: 'Skill support varies by setup; use repository instructions as source of truth.',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    vendor: 'Cursor',
    description: 'AI-first editor with rules and reusable context patterns for project workflows.',
    installSummary: 'Install Cursor, open a workspace, then add rules/skills as project or user instructions.',
    docsUrl: 'https://docs.cursor.com',
    websiteUrl: 'https://cursor.com',
    imagePath: cursorImage,
    installSteps: [
      'Download and install Cursor from the official website.',
      'Sign in and configure your model/provider settings.',
      'Add project rules or skill instructions to the workspace configuration.',
      'Keep rules concise and specific to avoid noisy generations.',
    ],
    skillLocation: 'Cursor commonly uses rules and project instructions rather than a single universal skill format.',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    vendor: 'GitHub',
    description: 'GitHub-native coding assistant with repository instructions and chat workflows.',
    installSummary: 'Install Copilot in your editor or use GitHub surfaces, then add repository instructions.',
    docsUrl: 'https://docs.github.com/en/copilot',
    websiteUrl: 'https://github.com/features/copilot',
    imagePath: githubCopilotImage,
    installSteps: [
      'Enable GitHub Copilot on your GitHub account or organization.',
      'Install the Copilot extension in your editor.',
      'Add repository instructions or reusable prompt files where supported.',
      'Validate generated changes through tests and review, never by vibes.',
    ],
    skillLocation: 'Often implemented as repository instructions, prompt files, or extension-specific configuration.',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    vendor: 'Cognition',
    description: 'Agentic coding editor with persistent AI workflows and codebase context.',
    installSummary: 'Install Windsurf, configure account access, then add rules or reusable workflows.',
    docsUrl: 'https://docs.windsurf.com',
    websiteUrl: 'https://windsurf.com',
    imagePath: windsurfImage,
    installSteps: [
      'Install Windsurf from the official website.',
      'Sign in and open the target repository.',
      'Configure project rules or imported skill instructions.',
      'Start with a low-risk task and inspect the resulting diff carefully.',
    ],
    skillLocation: 'Usually project rules or workflow instructions; check each skill repository for exact mapping.',
  },
  {
    id: 'codex',
    name: 'Codex',
    vendor: 'OpenAI',
    description: 'OpenAI coding agent environment that can use local skills and project instructions.',
    installSummary: 'Use Codex with project AGENTS.md plus reusable skills for specialized workflows.',
    docsUrl: 'https://platform.openai.com/docs',
    websiteUrl: 'https://openai.com/codex',
    imagePath: codexImage,
    installSteps: [
      'Set up the Codex environment or CLI according to OpenAI\'s current docs.',
      'Add project-level AGENTS.md instructions for team rules.',
      'Install or reference reusable skills for specialized workflows.',
      'Keep humans in control: review plans, diffs, and verification output.',
    ],
    skillLocation: 'Local skills and project instructions; exact install path depends on your Codex setup.',
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    vendor: 'Google',
    description: 'Google Gemini command-line agent workflow for code and automation tasks.',
    installSummary: 'Install Gemini CLI, authenticate, then wire compatible instructions into your workflow.',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    websiteUrl: 'https://ai.google.dev',
    imagePath: geminicliImage,
    installSteps: [
      'Install the Gemini CLI or SDK tooling from Google\'s official docs.',
      'Authenticate and configure API credentials.',
      'Add reusable prompts or skill instructions to your project workflow.',
      'Run verification commands after agent-generated changes.',
    ],
    skillLocation: 'Varies by CLI workflow; use skill repository documentation for exact setup.',
  },
  {
    id: 'cline',
    name: 'Cline',
    vendor: 'Cline',
    description: 'AI coding agent for editor and terminal workflows with support for rules, skills, workflows, hooks, and project ignores.',
    installSummary: 'Install Cline in your editor or terminal, authenticate with your chosen model provider, then add rules or skills for repeatable workflows.',
    docsUrl: 'https://docs.cline.bot/',
    websiteUrl: 'https://cline.bot',
    imagePath: clineImage,
    installSteps: [
      'Install Cline from the official docs for your editor or CLI workflow.',
      'Connect the model provider you want to use.',
      'Create focused rule or skill files for coding standards, review workflows, and project conventions.',
      'Approve actions deliberately and inspect diffs before accepting changes.',
    ],
    skillLocation: 'Cline documents rules, skills, workflows, hooks, and .clineignore as customization surfaces.',
    skillNotes: [
      'Keep each rule or skill focused on one concern so it stays scannable.',
      'Use approval gates for file writes and terminal commands when trying third-party skills.',
    ],
  },
  {
    id: 'continue',
    name: 'Continue',
    vendor: 'Continue',
    description: 'Open-source AI code assistant for VS Code and JetBrains with local and Hub rules for reusable behavior.',
    installSummary: 'Install Continue, configure your assistant/model, then add local rules or Hub rules for repeatable coding workflows.',
    docsUrl: 'https://docs.continue.dev/',
    websiteUrl: 'https://continue.dev',
    installSteps: [
      'Install Continue for VS Code or JetBrains from the official docs.',
      'Configure your assistant and model provider.',
      'Add local rules in the workspace or reference shared Hub rules from your assistant configuration.',
      'Test rules on a small task and refine them before applying them broadly.',
    ],
    skillLocation: 'Continue commonly uses local rules under .continue/rules and Hub rules referenced from assistant configuration.',
    skillNotes: [
      'Local rules are best for project-specific guidance that should live with the repository.',
      'Hub rules are better for organization-wide standards shared across multiple assistants.',
    ],
  },
];

export const AGENT_NAMES: Record<AgentId, string> = Object.fromEntries(
  AGENTS.map((agent) => [agent.id, agent.name])
);

export function getAgentName(agentId: AgentId): string {
  return AGENT_NAMES[agentId] ?? agentId.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getAgentById(agentId: AgentId): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === agentId);
}
