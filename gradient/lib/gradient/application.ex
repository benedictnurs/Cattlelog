defmodule Gradient.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Run the startup on initial load
      {Gradient.Grades, []},
      GradientWeb.Telemetry,
      Gradient.Repo,
      {Ecto.Migrator,
        repos: Application.fetch_env!(:gradient, :ecto_repos),
        skip: skip_migrations?()},
      {DNSCluster, query: Application.get_env(:gradient, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Gradient.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Gradient.Finch},
      # Start a worker by calling: Gradient.Worker.start_link(arg)
      # {Gradient.Worker, arg},
      # Start to serve requests, typically the last entry
      GradientWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Gradient.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    GradientWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp skip_migrations?() do
    # By default, sqlite migrations are run when using a release
    System.get_env("RELEASE_NAME") != nil
  end
end
