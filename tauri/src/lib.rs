use error_utilities::AppError;
use git2::{ObjectType, Repository, Tree};
use serde::{de::Error, Deserialize, Serialize};
use serde_json::{self, json, Value};
use std::env;
use std::fs;
use std::io::prelude::*;
use std::path::Path;
use tauri::ipc::{InvokeError, IpcResponse};
mod error_utilities;
mod git_utilities;

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

fn repo_crawl(repo: &Tree, entries: &mut Vec<String>, repository_root: &Repository) {
    for entry in repo.iter() {
        match entry.kind() {
            Some(ObjectType::Any) => {
                println!("### Any");
            }
            Some(ObjectType::Blob) => {
                entries.push(String::from(entry.name().unwrap()));
            }
            Some(ObjectType::Commit) => {
                println!("### Commit")
            }
            Some(ObjectType::Tag) => {
                println!("### Tag")
            }
            Some(ObjectType::Tree) => {
                let entry_as_tree = entry.to_object(repository_root);
                let t = entry_as_tree.unwrap().into_tree().unwrap();
                repo_crawl(&t, entries, repository_root);
                continue;
            }
            None => todo!(),
        }
    }
}

#[tauri::command]
fn clone_repo(repo_url: &str) -> Result<String, AppError> {
    let repo: git_utilities::R = git_utilities::open(Path::new(repo_url).to_str().unwrap())?;
    let mut repo_or_error;
    match repo {
        git_utilities::R::Repo(repo) => {
            let head: git2::Reference<'_> = repo.head()?;

            let commit: git2::Commit<'_> = head.peel_to_commit()?;

            let tree: Tree<'_> = commit.tree()?;

            let mut entries: Vec<String> = Vec::new();
            repo_crawl(&tree, &mut entries, &repo);

            let json_obj: protobuffers::CloneDto = CloneDto {
                entries: entries,
                root: String::from(repo_url),
                repository: String::from(repo_url),
            };

            let repo_dto = json!(json_obj);

            let obj = serde_json::from_value::<CloneDto>(repo_dto)?;
            match serde_json::to_string(&obj) {
                Ok(json_string) => repo_or_error = Ok(json_string),
                Err(err) => repo_or_error = Err(AppError::InvokeError(err.to_string())),
            };
        }

        git_utilities::R::Error(_err) => {
            let json_value = CloneDto {
                entries: [].to_vec(),
                root: String::from(repo_url),
                package: String::from(repo_url),
            };
            let repo_dto = json!(json_value);
            let repo_dto = repo_dto;

            let str = serde_json::from_value::<CloneDto>(repo_dto)?;

            match serde_json::to_string(&str) {
                Ok(json_string) => repo_or_error = Ok(json_string),
                Err(err) => repo_or_error = Err(AppError::InvokeError(err.to_string())),
            }
        }
    };
    return repo_or_error;
}

#[tauri::command]
fn read_file(file_name: &str) -> Result<String, AppError> {
    let mut file = fs::File::open(file_name)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

#[tauri::command]
fn pull_repository(repo_path: &str) -> Result<(), AppError> {
    // Use a Git library or command-line Git to pull the changes.
    // For simplicity, this example uses the command-line Git.
    let output = std::process::Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .arg("pull")
        .output()?;

    if !output.status.success() {
        return Err(AppError::Error(format!(
            "Failed to pull changes: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    Ok(())
}

#[tauri::command]
fn delete_repository(repo_path: &str) -> Result<(), String> {
    // Remove the directory and its contents.
    fs::remove_dir_all(repo_path).map_err(|e| format!("Failed to delete repository: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            clone_repo,
            read_file,
            pull_repository,
            delete_repository
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
