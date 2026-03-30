import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
# Run `mix help test` for more information.
config :gradient, Gradient.Repo,
  database: Path.expand("../gradient_test.db", __DIR__),
  pool_size: 5,
  pool: Ecto.Adapters.SQL.Sandbox

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :gradient, GradientWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  # ONLY USED LOCALLY
  secret_key_base: "TZZKPomBhoIpvPxHNGOfINC05F5cBP3P1tfdlE6dovsUiKNSX4EYszY6NfzyAZT/",
  server: false

# In test we don't send emails
config :gradient, Gradient.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
