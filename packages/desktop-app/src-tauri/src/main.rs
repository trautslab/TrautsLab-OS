// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 1. Setup macOS Menu Bar System Tray
            let toggle_item = MenuItem::with_id(app, "toggle", "Mostrar / Ocultar Cockpit", true, None::<&str>)?;
            let voice_item = MenuItem::with_id(app, "voice", "Activar Enlace de Voz (Cmd+Shift+Space)", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir de TrautsLab OS", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&toggle_item, &voice_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("TrautsLab OS — Centro de Mando Activo")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "voice" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.openVoiceModal && window.openVoiceModal();");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // 2. Setup Global Hotkey (Cmd+Shift+Space)
            #[cfg(desktop)]
            {
                let app_handle = app.handle().clone();
                let shortcut: Shortcut = "CommandOrControl+Shift+Space".parse().unwrap();
                let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.eval("window.openVoiceModal && window.openVoiceModal();");
                    }
                });
            }

            println!("🚀 [Tauri Cockpit] TrautsLab OS Desktop Shell inicializado con éxito.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error al inicializar la aplicación de escritorio Tauri");
}
