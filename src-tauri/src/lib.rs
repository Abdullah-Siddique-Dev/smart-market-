use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

fn is_port_listening(port: u16) -> bool {
    TcpStream::connect(("127.0.0.1", port)).is_ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            if !is_port_listening(4000) {
                let resource_dir = app.path().resource_dir().unwrap_or_default();
                let is_windows = cfg!(target_os = "windows");
                let node_name = if is_windows { "node.exe" } else { "node" };

                let bundled_node = resource_dir.join("resources").join("bin").join(node_name);
                let fallback_node = resource_dir.join("bin").join(node_name);
                
                let node_bin = if bundled_node.exists() {
                    bundled_node
                } else if fallback_node.exists() {
                    fallback_node
                } else {
                    std::path::PathBuf::from(node_name)
                };

                let bundled_server = resource_dir.join("resources").join("server").join("dist").join("server.js");
                let fallback_server = resource_dir.join("server").join("dist").join("server.js");
                let dev_server = std::path::PathBuf::from("server/dist/server.js");

                let server_script = if bundled_server.exists() {
                    bundled_server
                } else if fallback_server.exists() {
                    fallback_server
                } else {
                    dev_server
                };

                let mut cmd = Command::new(&node_bin);
                cmd.arg(&server_script);

                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                }

                match cmd.spawn() {
                    Ok(child) => {
                        let state = app.state::<BackendProcess>();
                        *state.0.lock().unwrap() = Some(child);

                        for _ in 0..30 {
                            if is_port_listening(4000) {
                                break;
                            }
                            std::thread::sleep(Duration::from_millis(200));
                        }
                    }
                    Err(e) => {
                        eprintln!("[Tauri] Failed to spawn backend process: {}", e);
                    }
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let state = app_handle.state::<BackendProcess>();
                let mut child_to_kill = None;
                if let Ok(mut lock) = state.0.lock() {
                    child_to_kill = lock.take();
                }
                if let Some(mut child) = child_to_kill {
                    let _ = child.kill();
                }
            }
        });
}
