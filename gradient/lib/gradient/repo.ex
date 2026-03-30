defmodule Gradient.Repo do
  use Ecto.Repo,
    otp_app: :gradient,
    adapter: Ecto.Adapters.SQLite3
end
