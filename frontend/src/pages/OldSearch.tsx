import React, { useState, useEffect } from "react";
import getCourseCodes from "../components/home/utils/course_codes";

export default function OldSearch() {
  const [courses, setCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [unitsFilter, setUnitsFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    import("98.css");
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("https://api.daviscattlelog.com/courses/all");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    }
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) => {
    const titleOrCode = `${c.course_id} ${c.course_title}`.toLowerCase();
    const matchesSearch = titleOrCode.includes(searchText.toLowerCase());
    const matchesUnits = !unitsFilter || c.units === Number(unitsFilter);
    const matchesDept = !deptFilter || c.course_id.startsWith(deptFilter);
    return matchesSearch && matchesUnits && matchesDept;
  });

  return (
    <div
      className="window custom-window"
      style={{ width: "1000px", maxWidth: "95vw", margin: "20px auto" }}
    >
      <div className="title-bar">
        <div className="title-bar-text">Davis Cattlelog</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>

      <div className="window-body" style={{ display: "flex", gap: "10px" }}>
        {/* Sidebar Filters */}
        <div style={{ width: "300px" }}>
          <fieldset>
            <legend>Search & Filters</legend>

            <div className="field-row-stacked">
              <label htmlFor="search">Search for classes:</label>
              <input
                id="search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="field-row-stacked">
              <label htmlFor="units">Units:</label>
              <select
                id="units"
                value={unitsFilter}
                onChange={(e) => setUnitsFilter(e.target.value)}
              >
                <option value="">Any</option>
                <option value="3">3 Units</option>
                <option value="4">4 Units</option>
              </select>
            </div>

            <div className="field-row-stacked">
              <label htmlFor="department">Department:</label>

              <select
                id="department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">None</option>
                {getCourseCodes().map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        </div>

        {/* Course List */}
        <div style={{ flex: 1 }}>
          <fieldset style={{ height: "600px", overflow: "auto" }}>
            <legend>Courses</legend>
            <div id="course-list">
              {filteredCourses.map((c, i) => (
                <a
                  key={i}
                  href={`/course/${c.course_id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    className="course-item"
                    style={{
                      padding: "4px",
                      borderBottom: "1px solid #ccc",
                      display: "flex",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      {c.course_id} — {c.course_title} (Units: {c.units}, GPA:{" "}
                      {c.average_gpa?.toFixed(2)})
                    </span>
                    <span
                      className="rating-badge"
                      style={{
                        padding: "2px 6px",
                        fontWeight: "bold",
                        backgroundColor:
                          c.average_overall_rating >= 4
                            ? "#0f0"
                            : c.average_overall_rating >= 3.5
                              ? "#ff0"
                              : "#f00",
                      }}
                    >
                      {c.average_overall_rating?.toFixed(1)}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}
