// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod error_utilities;
mod git_utilities;

fn main() {
    dependency_viewer_lib::run()
}
