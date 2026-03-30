defmodule Gradient.Grades do
  use GenServer

  @json_path "priv/data/grades.json"
  @table :grades_data

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  @impl true
  def init(_) do
    :ets.new(@table, [:named_table, :public, read_concurrency: true])
    load_data()
    {:ok, nil}
  end

  defp load_data do
    with {:ok, body} <- File.read(@json_path),
         {:ok, data} <- Jason.decode(body) do
      Enum.each(data, fn {code, info} ->
        :ets.insert(@table, {code, info})
      end)
    end
  end

  def get(code) do
    case :ets.lookup(@table, code) do
      [{^code, info}] -> {:ok, info}
      [] -> :error
    end
  end
end
