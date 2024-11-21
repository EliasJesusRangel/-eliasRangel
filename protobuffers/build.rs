use std::fmt::Error;

extern crate prost_build;

fn main() -> Result<(), Error> {
    let mut config: prost_build::Config = prost_build::Config::new();

    config.type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]");

    config.type_attribute(".", "#[serde(default)]");

    let result: Result<(), std::io::Error> = config.compile_protos(
        &["./src/shared/git.proto", "./src/shared/file.proto"],
        &["./src/"],
    );

    return Ok::<(), Error>(result.unwrap());
}
