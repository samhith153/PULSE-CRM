"""
Pipeline API tests.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _create_deal(client: AsyncClient, headers: dict, name: str) -> dict:
    response = await client.post("/api/v1/deals", headers=headers, json={"name": name, "amount": "1000.00"})
    assert response.status_code == 201, response.text
    return response.json()["data"]


@pytest.mark.asyncio
async def test_pipeline_board_and_stage_crud(client: AsyncClient, auth_headers: dict):
    board = await client.get("/api/v1/pipeline", headers=auth_headers)
    assert board.status_code == 200, board.text
    assert len(board.json()["data"]["stages"]) >= 1

    create_response = await client.post(
        "/api/v1/pipeline/stages",
        headers=auth_headers,
        json={
            "name": "QA Stage",
            "slug": "qa-stage",
            "color": "#112233",
            "sort_order": 99,
            "probability": 42,
            "is_default": False,
        },
    )
    assert create_response.status_code == 201, create_response.text
    stage = create_response.json()["data"]

    update_response = await client.put(
        f"/api/v1/pipeline/stages/{stage['id']}",
        headers=auth_headers,
        json={
            "name": "QA Stage Updated",
            "color": "#223344",
            "probability": 55,
        },
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["data"]["name"] == "QA Stage Updated"

    delete_response = await client.delete(f"/api/v1/pipeline/stages/{stage['id']}", headers=auth_headers)
    assert delete_response.status_code == 204, delete_response.text


@pytest.mark.asyncio
async def test_pipeline_move_updates_board(client: AsyncClient, auth_headers: dict):
    deal = await _create_deal(client, auth_headers, "Pipeline Move Deal")

    stages_response = await client.get("/api/v1/pipeline/stages", headers=auth_headers)
    assert stages_response.status_code == 200, stages_response.text
    stages = stages_response.json()["data"]
    assert len(stages) >= 2

    target_stage = stages[1]

    move_response = await client.patch(
        "/api/v1/pipeline/move",
        headers=auth_headers,
        json={"deal_id": deal["id"], "stage_id": target_stage["id"]},
    )
    assert move_response.status_code == 200, move_response.text

    board = move_response.json()["data"]
    target_summary = next(item for item in board["stages"] if item["stage"]["id"] == target_stage["id"])
    assert target_summary["deal_count"] >= 1


@pytest.mark.asyncio
async def test_pipeline_stage_move_requires_close_reason_for_terminal_stages(client: AsyncClient, auth_headers: dict):
    deal = await _create_deal(client, auth_headers, "Terminal Stage Deal")

    stages_response = await client.get("/api/v1/pipeline/stages", headers=auth_headers)
    stages = stages_response.json()["data"]
    won_stage = next(stage for stage in stages if stage["slug"] == "won")

    response = await client.patch(
        "/api/v1/pipeline/move",
        headers=auth_headers,
        json={"deal_id": deal["id"], "stage_id": won_stage["id"]},
    )
    assert response.status_code == 422
