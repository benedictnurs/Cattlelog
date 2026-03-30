from bs4 import BeautifulSoup

with open("out.html", "r") as file:
    html = file.read()

soup = BeautifulSoup(html, "html.parser")

rows = soup.select("tr.DataTable__row")

for row in rows:
    cells = row.find_all("td")
    email = cells[0].text.strip()
    status = cells[1].text.strip()
    url = cells[2].find("a")["href"] if cells[2].find("a") else ""
    uuid = cells[3].text.strip()
    timestamp = cells[4].text.strip()

    if "may-tabling-giveaway" in url:
        print(f"{email},{status},{url},{uuid},{timestamp}")
