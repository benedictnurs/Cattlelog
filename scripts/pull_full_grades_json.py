import json
import requests
from datetime import datetime

with open("./all_courses.json", 'r') as file:
    data = json.load(file)

OUT = {}

times = []

for item in data:
    start = datetime.now()
    url = f"https://course-recommender-backend.onrender.com/courses/{item['course_id']}"
    res = requests.get(url)
    end = datetime.now()
    total = end - start
    print(total, res)
    times.append(total)

    OUT[item['course_id']] = res.json()


with open("outfile.json", "w") as outfile:
    json.dump(OUT, outfile)
