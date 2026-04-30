// Universal Skills Hub - Desktop App Backend
// Handles agent detection, skill management, and installation

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use reqwest::blocking::Client;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};

// ============ TYPES ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub installed: bool,
    pub install_path: Option<String>,
    pub skills_dir: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner: String,
    pub repo: String,
    pub category: String,
    pub agents: Vec<String>,
    pub install_command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub agent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInstalledSkills {
    pub agent_id: String,
    pub agent_name: String,
    pub skills: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectorySkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner: Option<String>,
    #[serde(rename = "repoName")]
    pub repo_name: Option<String>,
    pub category: Option<String>,
    pub agents: Vec<String>,
    #[serde(rename = "installCommand")]
    pub install_command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillsApiResponse {
    pub skills: Vec<DirectorySkill>,
    pub total: i64,
    pub page: i64,
    #[serde(rename = "pageSize")]
    pub page_size: i64,
    #[serde(rename = "totalPages")]
    pub total_pages: i64,
}

// ============ AGENT DETECTION ============

fn get_home_dir() -> Option<PathBuf> {
    std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(PathBuf::from)
}

fn check_binary_exists(binary: &str) -> bool {
    #[cfg(target_os = "windows")]
    {
        Command::new("where")
            .arg(binary)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("which")
            .arg(binary)
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}

#[tauri::command]
fn detect_agents() -> Vec<Agent> {
    let mut agents = vec![];
    
    // Claude Code
    let claude_installed = check_binary_exists("claude");
    let claude_skills_dir = get_home_dir().map(|h| 
        h.join(".claude").join("plugins").join("skills").to_string_lossy().to_string()
    );
    
    agents.push(Agent {
        id: "claude-code".to_string(),
        name: "Claude Code".to_string(),
        installed: claude_installed,
        install_path: if claude_installed { Some("claude".to_string()) } else { None },
        skills_dir: claude_skills_dir,
    });
    
    // OpenCode
    let opencode_installed = check_binary_exists("opencode");
    let opencode_skills_dir = get_home_dir().map(|h| 
        h.join(".opencode").to_string_lossy().to_string()
    );
    
    agents.push(Agent {
        id: "opencode".to_string(),
        name: "OpenCode".to_string(),
        installed: opencode_installed,
        install_path: if opencode_installed { Some("opencode".to_string()) } else { None },
        skills_dir: opencode_skills_dir,
    });
    
    // Cursor
    let cursor_installed = check_binary_exists("cursor");
    let cursor_skills_dir = get_home_dir().map(|h| 
        h.join(".cursor").join("rules").to_string_lossy().to_string()
    );
    
    agents.push(Agent {
        id: "cursor".to_string(),
        name: "Cursor".to_string(),
        installed: cursor_installed,
        install_path: if cursor_installed { Some("cursor".to_string()) } else { None },
        skills_dir: cursor_skills_dir,
    });
    
    // Windsurf
    let windsurf_installed = check_binary_exists("windsurf");
    let windsurf_skills_dir = get_home_dir().map(|h| 
        h.join(".windsurf").join("rules").to_string_lossy().to_string()
    );
    
    agents.push(Agent {
        id: "windsurf".to_string(),
        name: "Windsurf".to_string(),
        installed: windsurf_installed,
        install_path: if windsurf_installed { Some("windsurf".to_string()) } else { None },
        skills_dir: windsurf_skills_dir,
    });
    
    // Cline
    let cline_installed = check_binary_exists("cline");
    let cline_skills_dir = get_home_dir().map(|h| 
        h.join(".cline").to_string_lossy().to_string()
    );
    
    agents.push(Agent {
        id: "cline".to_string(),
        name: "Cline".to_string(),
        installed: cline_installed,
        install_path: if cline_installed { Some("cline".to_string()) } else { None },
        skills_dir: cline_skills_dir,
    });
    
    // Gemini CLI
    let gemini_installed = check_binary_exists("gemini");
    
    agents.push(Agent {
        id: "gemini-cli".to_string(),
        name: "Gemini CLI".to_string(),
        installed: gemini_installed,
        install_path: if gemini_installed { Some("gemini".to_string()) } else { None },
        skills_dir: None,
    });

    // Codex
    let codex_installed = check_binary_exists("codex");
    let codex_skills_dir = get_home_dir().map(|h|
        h.join(".codex").join("skills").to_string_lossy().to_string()
    );

    agents.push(Agent {
        id: "codex".to_string(),
        name: "Codex".to_string(),
        installed: codex_installed,
        install_path: if codex_installed { Some("codex".to_string()) } else { None },
        skills_dir: codex_skills_dir,
    });

    // GitHub Copilot
    agents.push(Agent {
        id: "github-copilot".to_string(),
        name: "GitHub Copilot".to_string(),
        installed: false,
        install_path: None,
        skills_dir: None,
    });

    // Continue
    let continue_skills_dir = get_home_dir().map(|h|
        h.join(".continue").join("rules").to_string_lossy().to_string()
    );

    agents.push(Agent {
        id: "continue".to_string(),
        name: "Continue".to_string(),
        installed: false,
        install_path: None,
        skills_dir: continue_skills_dir,
    });

    // MCP
    agents.push(Agent {
        id: "mcp".to_string(),
        name: "MCP".to_string(),
        installed: false,
        install_path: None,
        skills_dir: None,
    });
    
    agents
}

// ============ SKILL MANAGEMENT ============

fn get_agent_skills_dir(agent_id: &str) -> Option<PathBuf> {
    get_home_dir().map(|h| {
        match agent_id {
            "claude-code" => h.join(".claude").join("skills"),
            "cursor" => h.join(".cursor").join("rules"),
            "windsurf" => h.join(".windsurf").join("rules"),
            "opencode" => h.join(".config").join("opencode").join("skills"),
            "gemini-cli" => h.join(".gemini").join("antigravity").join("skills"),
            "cline" => h.join(".cline"),
            "codex" => h.join(".codex").join("skills"),
            "continue" => h.join(".continue").join("rules"),
            _ => h,
        }
    })
}

fn check_skill_installed(skill: &Skill, agent_id: &str) -> bool {
    if let Some(skills_dir) = get_agent_skills_dir(agent_id) {
        if !skills_dir.exists() {
            return false;
        }

        let skill_patterns = [
            skills_dir.join(&skill.name),
            skills_dir.join(format!("{}.md", skill.name)),
            skills_dir.join(&skill.id),
            skills_dir.join(format!("{}.md", &skill.id)),
        ];

        for path in &skill_patterns {
            if path.exists() {
                return true;
            }
        }

        if agent_id == "claude-code" {
            let output = Command::new("npx")
                .args(["skills", "list", "-g"])
                .output();

            if let Ok(result) = output {
                let output_str = String::from_utf8_lossy(&result.stdout);
                return output_str.contains(&skill.name) || output_str.contains(&skill.id);
            }
        }
    }
    false
}

// ============ FETCH SKILLS FROM API ============

fn get_skills_api_base_url() -> String {
    std::env::var("UNIVERSAL_SKILLS_API_BASE_URL")
        .or_else(|_| std::env::var("NEXT_PUBLIC_SITE_URL"))
        .unwrap_or_else(|_| "https://universal-skills-hub.vercel.app".to_string())
        .trim_end_matches('/')
        .to_string()
}

#[tauri::command]
fn fetch_skills_from_api(page: i64, page_size: i64) -> Result<SkillsApiResponse, String> {
    let base_url = get_skills_api_base_url();
    let url = format!(
        "{}/api/skills?page={}&pageSize={}",
        base_url, page, page_size
    );

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("curl")
            .args(["-s", "-L", &url])
            .output()
            .map_err(|e| format!("curl failed for {}: {}", url, e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("API returned error for {}: {}", url, stderr));
        }

        let body = String::from_utf8_lossy(&output.stdout);
        let response: SkillsApiResponse = serde_json::from_str(&body)
            .map_err(|e| format!("Failed to parse JSON from {}: {} - Body: {}", url, e, &body))?;

        Ok(response)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("curl")
            .args(["-s", "-L", &url])
            .output()
            .map_err(|e| format!("curl failed for {}: {}", url, e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("API returned error for {}: {}", url, stderr));
        }

        let body = String::from_utf8_lossy(&output.stdout);
        let response: SkillsApiResponse = serde_json::from_str(&body)
            .map_err(|e| format!("Failed to parse JSON from {}: {}", url, e))?;

        Ok(response)
    }
}

#[tauri::command]
fn fetch_skills_paginated(page: i64, page_size: i64) -> Result<SkillsApiResponse, String> {
    let page = if page < 1 { 1 } else { page };
    let page_size = if page_size < 1 { 30 } else { page_size };
    fetch_skills_from_api(page, page_size)
}

#[tauri::command]
fn fetch_all_skills() -> Result<Vec<Skill>, String> {
    let mut all_skills = vec![];
    let mut page = 1;
    let page_size = 100;
    let max_pages = 1000;

    while page <= max_pages {
        let response = fetch_skills_from_api(page, page_size)?;
        
        if response.skills.is_empty() {
            break;
        }

        let skills_count = response.skills.len();

        for dir_skill in &response.skills {
            all_skills.push(Skill {
                id: dir_skill.id.clone(),
                name: dir_skill.name.clone(),
                description: dir_skill.description.clone(),
                owner: dir_skill.owner.clone().unwrap_or_else(|| "universal-skills-hub".to_string()),
                repo: dir_skill.repo_name.clone().unwrap_or_else(|| dir_skill.name.clone()),
                category: dir_skill.category.clone().unwrap_or_else(|| "General".to_string()),
                agents: dir_skill.agents.clone(),
                install_command: dir_skill.install_command.clone().unwrap_or_else(|| {
                    if let (Some(owner), Some(repo)) = (&dir_skill.owner, &dir_skill.repo_name) {
                        format!("npx skills add {}/{}", owner, repo)
                    } else {
                        format!("npx skills add {}", dir_skill.name)
                    }
                }),
            });
        }

        if skills_count < page_size as usize {
            break;
        }

        page += 1;
    }

    Ok(all_skills)
}

// ============ SKILL COMMANDS ============

#[tauri::command]
fn verify_skill_installed(skill: Skill, agent_id: String) -> bool {
    check_skill_installed(&skill, &agent_id)
}

#[tauri::command]
fn install_skill(skill: Skill, agent_id: String) -> InstallResult {
    let agent_name = match agent_id.as_str() {
        "claude-code" => "Claude Code",
        "cursor" => "Cursor",
        "windsurf" => "Windsurf",
        "opencode" => "OpenCode",
        "cline" => "Cline",
        "gemini-cli" => "Gemini CLI",
        _ => &agent_id,
    }.to_string();

    let command = format!("npx skills add {}/{}", skill.owner, skill.repo);

    let output = Command::new("cmd")
        .args(["/C", &command])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                if check_skill_installed(&skill, &agent_id) {
                    InstallResult {
                        success: true,
                        message: format!("Skill \"{}\" instalada en {}", skill.name, agent_name),
                        agent: agent_id,
                    }
                } else {
                    InstallResult {
                        success: false,
                        message: format!("Comando ejecutado pero no se encontró la skill. Verificá la instalación manual."),
                        agent: agent_id,
                    }
                }
            } else {
                let stderr = String::from_utf8_lossy(&result.stderr);
                InstallResult {
                    success: false,
                    message: format!("Error: {}", stderr),
                    agent: agent_id,
                }
            }
        }
        Err(e) => InstallResult {
            success: false,
            message: format!("Error al ejecutar: {}", e),
            agent: agent_id,
        },
    }
}

#[tauri::command]
fn install_skill_to_multiple(skill: Skill, agent_ids: Vec<String>) -> Vec<InstallResult> {
    agent_ids
        .into_iter()
        .map(|agent_id| install_skill(skill.clone(), agent_id))
        .collect()
}

#[tauri::command]
fn get_installed_skills() -> Vec<AgentInstalledSkills> {
    let agents = detect_agents();
    let mut result = vec![];

    for agent in agents {
        if !agent.installed {
            continue;
        }

        if let Some(skills_dir) = get_agent_skills_dir(&agent.id) {
            if !skills_dir.exists() {
                result.push(AgentInstalledSkills {
                    agent_id: agent.id.clone(),
                    agent_name: agent.name.clone(),
                    skills: vec![],
                });
                continue;
            }

            let mut skills = vec![];

            if let Ok(entries) = std::fs::read_dir(&skills_dir) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let name = name.trim_end_matches(".md").to_string();
                    if !name.starts_with('.') && !name.is_empty() {
                        skills.push(name);
                    }
                }
            }

            if agent.id == "claude-code" {
                let output = Command::new("npx")
                    .args(["skills", "list", "-g"])
                    .output();

                if let Ok(cmd_result) = output {
                    let output_str = String::from_utf8_lossy(&cmd_result.stdout);
                    for line in output_str.lines() {
                        let trimmed = line.trim();
                        if !trimmed.is_empty() && !trimmed.starts_with('@') && !trimmed.starts_with("info") && !trimmed.contains("~") && !trimmed.contains(":") {
                            let name = trimmed.split('@').next().unwrap_or(trimmed).to_string();
                            if !name.is_empty() && !skills.contains(&name) {
                                skills.push(name);
                            }
                        }
                    }
                }
            }

            result.push(AgentInstalledSkills {
                agent_id: agent.id.clone(),
                agent_name: agent.name.clone(),
                skills,
            });
        } else {
            if agent.id == "gemini-cli" {
                let output = Command::new("npx")
                    .args(["skills", "list", "-g"])
                    .output();

                if let Ok(cmd_result) = output {
                    let output_str = String::from_utf8_lossy(&cmd_result.stdout);
                    let mut skills = vec![];
                    for line in output_str.lines() {
                        let trimmed = line.trim();
                        if !trimmed.is_empty() && !trimmed.starts_with('@') && !trimmed.starts_with("info") && !trimmed.contains("~") && !trimmed.contains(":") {
                            let name = trimmed.split('@').next().unwrap_or(trimmed).to_string();
                            if !name.is_empty() && !skills.contains(&name) {
                                skills.push(name);
                            }
                        }
                    }
                    result.push(AgentInstalledSkills {
                        agent_id: agent.id.clone(),
                        agent_name: agent.name.clone(),
                        skills,
                    });
                } else {
                    result.push(AgentInstalledSkills {
                        agent_id: agent.id.clone(),
                        agent_name: agent.name.clone(),
                        skills: vec![],
                    });
                }
            } else {
                result.push(AgentInstalledSkills {
                    agent_id: agent.id.clone(),
                    agent_name: agent.name.clone(),
                    skills: vec![],
                });
            }
        }
    }

    result
}

#[tauri::command]
fn uninstall_skill(skill_name: String, agent_id: String) -> InstallResult {
    let agent_name = match agent_id.as_str() {
        "claude-code" => "Claude Code",
        "cursor" => "Cursor",
        "windsurf" => "Windsurf",
        "opencode" => "OpenCode",
        "cline" => "Cline",
        _ => &agent_id,
    }.to_string();

    let command = format!("npx skills remove {}", skill_name);
    let output = Command::new("cmd")
        .args(["/C", &command])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                InstallResult {
                    success: true,
                    message: format!("Skill \"{}\" eliminada de {}", skill_name, agent_name),
                    agent: agent_id,
                }
            } else {
                if let Some(skills_dir) = get_agent_skills_dir(&agent_id) {
                    let patterns = [
                        skills_dir.join(&skill_name),
                        skills_dir.join(format!("{}.md", skill_name)),
                        skills_dir.join("skills").join(&skill_name),
                        skills_dir.join("skills").join(format!("{}.md", skill_name)),
                    ];

                    let mut deleted = false;
                    for path in &patterns {
                        if path.exists() {
                            if std::fs::remove_file(path).is_ok() {
                                deleted = true;
                            }
                        }
                    }

                    if deleted {
                        return InstallResult {
                            success: true,
                            message: format!("Skill \"{}\" eliminada de {}", skill_name, agent_name),
                            agent: agent_id,
                        };
                    }
                }

                let stderr = String::from_utf8_lossy(&result.stderr);
                InstallResult {
                    success: false,
                    message: format!("Error al desinstalar: {}", stderr),
                    agent: agent_id,
                }
            }
        }
        Err(e) => InstallResult {
            success: false,
            message: format!("Error al ejecutar: {}", e),
            agent: agent_id,
        },
    }
}

#[tauri::command]
fn open_terminal_with_command(command: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &command])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        let script = format!("tell app \"Terminal\" to do script \"{}\"", command);
        Command::new("osascript")
            .args(["-e", &script])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("x-terminal-emulator")
            .arg("-e")
            .arg(&command)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// ============ EXTERNAL BROWSER ============

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// ============ CHECK SESSION ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceSessionCheckResponse {
    pub authenticated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevicePairResponse {
    pub ok: bool,
    pub session_token: String,
}

#[tauri::command]
fn validate_device_session(session_token: String) -> Result<DeviceSessionCheckResponse, String> {
    let base_url = get_skills_api_base_url();
    let url = format!("{}/api/desktop/session", base_url);
    let client = Client::new();

    let response = client
        .get(&url)
        .header(AUTHORIZATION, format!("Bearer {}", session_token))
        .send()
        .map_err(|e| format!("Failed to validate desktop session: {}", e))?;

    if response.status().is_success() {
        return Ok(DeviceSessionCheckResponse {
            authenticated: true,
        });
    }

    Ok(DeviceSessionCheckResponse {
        authenticated: false,
    })
}

#[tauri::command]
fn pair_device_with_code(token: String, device_name: String) -> Result<DevicePairResponse, String> {
    let base_url = get_skills_api_base_url();
    let url = format!("{}/api/desktop/session", base_url);
    let client = Client::new();

    let response = client
        .post(&url)
        .header(CONTENT_TYPE, "application/json")
        .json(&serde_json::json!({
            "token": token,
            "deviceName": device_name,
        }))
        .send()
        .map_err(|e| format!("Failed to link desktop app: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().unwrap_or_else(|_| "Unknown error".to_string());
        let parsed: serde_json::Value = serde_json::from_str(&body).unwrap_or_default();
        let message = parsed
            .get("error")
            .and_then(|value| value.as_str())
            .unwrap_or(body.as_str());
        return Err(format!("Desktop pairing failed ({}): {}", status, message));
    }

    let parsed: serde_json::Value = response
        .json()
        .map_err(|e| format!("Invalid pairing response: {}", e))?;

    let session_token = parsed
        .get("sessionToken")
        .and_then(|value| value.as_str())
        .ok_or_else(|| "Desktop pairing response did not include a session token".to_string())?
        .to_string();

    Ok(DevicePairResponse {
        ok: true,
        session_token,
    })
}

#[tauri::command]
fn revoke_device_session(session_token: String) -> Result<(), String> {
    let base_url = get_skills_api_base_url();
    let url = format!("{}/api/desktop/session", base_url);
    let client = Client::new();

    client
        .delete(&url)
        .header(AUTHORIZATION, format!("Bearer {}", session_token))
        .send()
        .map_err(|e| format!("Failed to revoke desktop session: {}", e))?;

    Ok(())
}

// ============ MAIN ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_agents,
            install_skill,
            install_skill_to_multiple,
            verify_skill_installed,
            get_installed_skills,
            uninstall_skill,
            open_terminal_with_command,
            fetch_skills_from_api,
            fetch_skills_paginated,
            fetch_all_skills,
            open_external_url,
            validate_device_session,
            pair_device_with_code,
            revoke_device_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
