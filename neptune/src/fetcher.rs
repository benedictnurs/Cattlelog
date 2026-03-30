extern crate rocket;
use futures::StreamExt;
use futures::stream;
use reqwest::Client;
use serde_json::{Value, from_str};
use std::collections::HashMap;
use tokio::fs;

pub fn get_course_ids() -> Vec<String> {
    let json_string: String =
        std::fs::read_to_string("./all_courses.json").expect("Should have read json file.");

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
    }

    return course_ids;
}

pub async fn fetch_all_courses(course_ids: Vec<String>) -> HashMap<String, String> {
    let client = Client::new();

    let stream = stream::iter(course_ids.into_iter().map(|course_id| {
        let client = client.clone();
        async move {
            let url = format!(
                "https://course-recommender-backend.onrender.com/courses/{}",
                &course_id
            );
            println!("Fetching {}", url);

            match client.get(&url).send().await {
                Ok(resp) => match resp.text().await {
                    Ok(body) => Some((course_id, body)),
                    Err(_) => None,
                },
                Err(_) => None,
            }
        }
    }));

    let results = stream.buffer_unordered(10).collect::<Vec<_>>().await;

    results.into_iter().filter_map(|r| r).collect()
}

pub async fn startup_grade_data() {
    let course_ids = get_course_ids();

    let map = fetch_all_courses(course_ids).await;

    let json = serde_json::to_string_pretty(&map).unwrap();
    fs::write("output.json", json)
        .await
        .expect("Unable to write JSON to file");
}
