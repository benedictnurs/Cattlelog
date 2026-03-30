import matplotlib.pyplot as plt


data = {
    "second_fetch_all": 1748995455.7358117,
    "course_subquery": 1748995455.2404954,
    "assemble_courses": 1748995455.36278,
    "second_query": 1748995455.5677593,
    "create_embed": 1748995455.5667274,
    "second_assemble": 1748995455.736025,
    "first_query": 1748995455.2410927,
    "top_subqeury": 1748995455.5670946,
    "function_start_time": 1748995455.239309,
    "fetch_all": 1748995455.362779,
}

sorted_items = sorted(data.items(), key=lambda x: x[1])
labels, timestamps = zip(*sorted_items)

base_time = timestamps[0]
relative_times = [t - base_time for t in timestamps]

plt.figure(figsize=(10, 5))
plt.plot(labels, relative_times, marker='o', linestyle='-')
plt.xticks(rotation=45, ha='right')
plt.ylabel("Time since first event (seconds)")
plt.title("Event Timing Line Chart")
plt.tight_layout()
plt.grid(True)
plt.show()
