# Test Company Data Script — CLI Flags

Script: `backend/scripts/seed_test_companies.py`

## Commands

| Command    | Description                        |
|------------|------------------------------------|
| `seed`     | Insert/generate company test data  |
| `export`   | Export companies to JSON           |
| `validate` | Verify company data integrity      |

## Global Options

| Flag                              | Description                                           |
|-----------------------------------|-------------------------------------------------------|
| `--source {mock,database}`        | Data source: mock (fake) or database (real DB). Default: mock. Can also set `PULSE_DATA_SOURCE` env var. |

## Per-Command Flags

### `seed`

| Flag             | Default | Description                                 |
|------------------|---------|---------------------------------------------|
| `--count`        | 50      | Number of companies to generate             |

### `export`

| Flag             | Default | Description                                 |
|------------------|---------|---------------------------------------------|
| `--count`        | 50      | Number of companies to generate (mock mode) |

### `validate`

(No extra flags beyond `--source`.)

## Environment Variable

- `PULSE_DATA_SOURCE` — overrides `--source` if set.

## Examples

```
python -m scripts.seed_test_companies seed
python -m scripts.seed_test_companies seed --source mock --count 100
python -m scripts.seed_test_companies export --source database
python -m scripts.seed_test_companies validate
set PULSE_DATA_SOURCE=database
python -m scripts.seed_test_companies seed
```
