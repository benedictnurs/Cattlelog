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

pub async fn add_all_grade_data(grade_data: Value) {
    let courses = grade_data.get("courses").expect("Should read courses.");
    let course_array = courses.as_array().expect("Should get array");

    for course in course_array {
        if let Value::Object(pair) = course {
            for (course_id, value) in pair {
                GLOBAL_SHARD_MAP
                    .insert(course_id.to_string(), value.to_string())
                    .await;
            }
        }
    }
}

pub async fn startup_grade_shard() {
    let json_string: String = fs::read_to_string("./output.json")
        .await
        .expect("Should have read json file.");

    let parsed: Value = from_str(json_string.as_str()).expect("Invalid JSON");

    add_all_grade_data(parsed).await;
}

#[get("/<key>")]
pub async fn get_grade_by_key(key: &str) -> RawJson<Option<String>> {
    let key = key.to_uppercase();
    let map = GLOBAL_SHARD_MAP.clone();

    let result = map.get(&key).await.map(|entry| entry.value().clone());

    RawJson(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[rocket::async_test]
    async fn test_add_grade_data() {
        let test_json = json!({
            "courses": [
                {
                    "ECS999": {
                        "course_id": "ECS999",
                        "course_title": "Test Class",
                        "units": 1
                    }
                }
            ]
        });

        add_all_grade_data(test_json).await;

        let map = GLOBAL_SHARD_MAP.clone();
        let result = map
            .get(&String::from("ECS999"))
            .await
            .map(|entry| entry.value().clone());

        assert_eq!(
            result.expect("To get value"),
            r#"{"course_id":"ECS999","course_title":"Test Class","units":1}"#
        );
    }
}
