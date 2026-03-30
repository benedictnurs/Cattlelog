import boto3


def read_config(file_path):
    config = {}

    with open(file_path, "r") as file:
        for line in file:
            line = line.strip()

            if not line or line.startswith("#"):
                continue

            key, value = line.split("=", 1)

            config[key.strip()] = value.strip().replace('"', '').strip()

    return config

config = read_config("config.txt")

r2_access_key_id = config.get("r2_access_key_id")
r2_secret_access_key = config.get("r2_secret_access_key")
r2_endpoint_url = config.get("r2_endpoint_url")

bucket_name = "json-test"
object_key = "all_courses.1.json.gz"
local_file_path = "all_courses.1.json.gz"

session = boto3.session.Session()

s3 = session.client(
    service_name='s3',
    aws_access_key_id=r2_access_key_id,
    aws_secret_access_key=r2_secret_access_key,
    endpoint_url=r2_endpoint_url,
)

with open(local_file_path, 'rb') as file_data:
    s3.put_object(
        Bucket=bucket_name,
        Key=object_key,
        Body=file_data,
        ContentType='application/json',
        ContentEncoding='gzip',
        Metadata={"Content-Encoding": "gzip"}
    )

print("Successfully re-uploaded with updated metadata!")

