extern crate rocket;
use once_cell::sync::Lazy;
use rocket::get;
use rocket::response::content::RawJson;
use serde_json::{Value, from_str};
use std::sync::Arc;
use tokio::fs;
use whirlwind::ShardMap;

static GLOBAL_SHARD_MAP: Lazy<Arc<ShardMap<String, String>>> = Lazy::new(|| {
    let map = ShardMap::new();
    Arc::new(map)
});

pub async fn startup_course_shard() {
    let json_string: String = fs::read_to_string("./all_courses.json")
        .await
        .expect("Should have read json file.");

    let parsed: Value = from_str(json_string.as_str()).expect("Invalid JSON");

    let json_output = match parsed {
        Value::Array(items) => items.into_iter().map(|item| item.to_string()).collect(),
        _ => vec![],
    };

    let mut course_ids = Vec::<String>::new();

    // Load each line of JSON into the shared hashmap
    for single_line in json_output {
        let json_bits: Vec<&str> = single_line.split("\"").into_iter().collect();
        let course_id_key_loc = json_bits.iter().position(|&r| r == "course_id").unwrap();
        let course_id = json_bits[course_id_key_loc + 2];

        course_ids.push(course_id.to_string());

        GLOBAL_SHARD_MAP
            .insert(course_id.to_string(), single_line.clone())
            .await;
    }
}

#[get("/<key>")]
pub async fn get_course_by_key(key: &str) -> RawJson<Option<String>> {
    let key = key.to_uppercase();
    let map = GLOBAL_SHARD_MAP.clone();

    let result = map.get(&key).await.map(|entry| entry.value().clone());

    RawJson(result)
}
