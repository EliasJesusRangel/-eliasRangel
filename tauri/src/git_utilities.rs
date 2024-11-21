use git2::{Error, Repository};
use std::path::Path;
use std::{any::Any, collections::btree_set::Union, io::stdout};
pub enum R {
    Repo(Repository),
    Error(Error),
}

pub fn open(repo_url: &str) -> Result<R, Error> {
    let mut repo: R = match Repository::open(repo_url) {
        Ok(repo) => R::Repo(repo),
        Err(e) => R::Error(e),
    };

    return Ok(repo);
}
