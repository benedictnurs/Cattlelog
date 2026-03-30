# Gradient

Grade data server experiment in Elixir.

## Experiment

Research Question: Can serving grade data JSON from a server running on the Erlang VM have significant performance benefits over FastAPI in Python.

Tentative Result: There isn't enough evidence to suggest that this causes significant improvements, but more experimentation is needed.

## Docs

<img width="1900" height="451" alt="image" src="https://github.com/user-attachments/assets/41270ed0-61b8-4968-a789-df71ded125bd" />

You can see this page by visiting [http://127.0.0.1:4000/](http://127.0.0.1:4000/) after running the server.

## Usage

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Calling the API

You can then run a curl command for specific grade data like [http://127.0.0.1:4000/api/grade/ECS150](http://127.0.0.1:4000/api/grade/ECS150).

<img width="1876" height="348" alt="image" src="https://github.com/user-attachments/assets/99223885-bcee-4994-972f-4680d54270f3" />

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix
