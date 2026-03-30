use once_cell::sync::OnceCell;
use rocket::Request;
use rocket::http::{ContentType, Header, Status};
use rocket::tokio::fs::File;
use rocket::tokio::io::AsyncReadExt;
use rocket::{Response, get, response::Responder};
use std::io::Cursor;

static GZIPPED_COURSE_9: OnceCell<Vec<u8>> = OnceCell::new();

static GZIPPED_COURSE_ARRAY: [&OnceCell<Vec<u8>>; 1] = [&GZIPPED_COURSE_9];

// Preload the gzip data
pub async fn startup_load_gzip() {
    let name = "./all_courses.json.9.gz";
    let mut gzip_file = File::open(name).await.expect("Failed to open gzip-6 file");

    let mut gzip_contents = Vec::new();
    gzip_file
        .read_to_end(&mut gzip_contents)
        .await
        .expect("Failed to read gzip-6 file");

    GZIPPED_COURSE_ARRAY
        .get(0)
        .copied()
        .expect("Should get array")
        .set(gzip_contents)
        .unwrap();
}

pub struct GzippedJson(Vec<u8>);

#[rocket::async_trait]
impl<'r> Responder<'r, 'static> for GzippedJson {
    fn respond_to(self, _: &'r Request<'_>) -> rocket::response::Result<'static> {
        Response::build()
            .header(ContentType::JSON)
            .header(Header::new("Content-Encoding", "gzip"))
            .sized_body(self.0.len(), Cursor::new(self.0))
            .ok()
    }
}

// Final fastest version
#[get("/all")]
pub async fn get_all_courses() -> Result<GzippedJson, Status> {
    match GZIPPED_COURSE_9.get() {
        Some(contents) => Ok(GzippedJson(contents.to_owned())),
        None => Err(Status::InternalServerError),
    }
}
