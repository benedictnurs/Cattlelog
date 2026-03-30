import json

with open("./all_courses.json", 'r') as file:
    data = json.load(file)

for item in data:
    print(f"<url><loc>https://daviscattlelog.com/course/{item['course_id']}</loc></url>")
    print(f"<url><loc>https://daviscattlelog.com/grade/{item['course_id']}</loc></url>")
