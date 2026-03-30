extern crate rocket;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::Header;
use rocket::routes;
use rocket::{Request, Response};

use courses::{get_all_courses, startup_load_gzip};

// Routes:
// (get_all_courses)    GET /courses/all
// (get_course_by_key)  GET /course/<key>
// (get_grade_by_key)  GET /grade/<key>
//
// There are also a plethora of /benchmark/ routes. These were the intermediate steps involved in
// making the /courses/all route extremely fast.

use course::{get_course_by_key, startup_course_shard};
use fetcher::startup_grade_data;
use grade::{get_grade_by_key, startup_grade_shard};

pub mod course;
pub mod courses;
pub mod fetcher;
pub mod grade;

const SHOULD_FETCH: bool = false;

struct CorsFairing;

#[rocket::async_trait]
impl Fairing for CorsFairing {
    fn info(&self) -> Info {
        Info {
            name: "CORS Fairing",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        // Get the origin from the request
        if let Some(origin) = request.headers().get_one("Origin") {
            // Check if the origin is in our allowed list
            let allowed_origins = vec![
                "https://daviscattlelog.com",
                "https://staging.daviscattlelog.com",
                "http://localhost:5173"
            ];

            if allowed_origins.contains(&origin) {
                response.set_header(Header::new("Access-Control-Allow-Origin", origin));
            }
        }

        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

async fn startup() {
    // Courses
    startup_load_gzip().await;

    // Course
    startup_course_shard().await;

    if SHOULD_FETCH {
        startup_grade_data().await;
    }

    startup_grade_shard().await;
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    startup().await;

    let figment = rocket::Config::figment()
        .merge(("port", 8000))
        .merge(("address", "0.0.0.0"));

    let _ = rocket::custom(figment)
        .attach(CorsFairing)
        .mount("/courses/", routes![get_all_courses,])
        .mount("/course/", routes![get_course_by_key,])
        .mount("/grade/", routes![get_grade_by_key,])
        .launch()
        .await?;

    Ok(())
}
