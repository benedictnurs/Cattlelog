defmodule GradientWeb.HelloController do
  use GradientWeb, :controller

  def index(conn, _params) do
    json(conn, %{message: "Hello, world!"})
  end

  def grade(conn, %{"code" => code}) do
    case Gradient.Grades.get(code) do
      {:ok, info} -> json(conn, info)
      :error -> send_resp(conn, 404, "Course not found")
    end
  end
end
