import networkx as nx
from fastapi import APIRouter
from models.schemas import CPARequest, CPAResponse

router = APIRouter()


def build_cpa_graph(phases):
    """Build a directed graph from phase dependencies and compute CPA."""
    # Define construction tasks with dependencies
    tasks_data = [
        {"id": "T1", "name": "Site Clearance", "duration": 5, "deps": [], "phase": "Foundation", "workers": 8},
        {"id": "T2", "name": "Soil Testing", "duration": 3, "deps": ["T1"], "phase": "Foundation", "workers": 3},
        {"id": "T3", "name": "Foundation Excavation", "duration": 10, "deps": ["T2"], "phase": "Foundation", "workers": 15},
        {"id": "T4", "name": "Footing & PCC", "duration": 8, "deps": ["T3"], "phase": "Foundation", "workers": 12},
        {"id": "T5", "name": "Foundation Concrete", "duration": 12, "deps": ["T4"], "phase": "Foundation", "workers": 18},
        {"id": "T6", "name": "Ground Floor Slab", "duration": 15, "deps": ["T5"], "phase": "Structure", "workers": 22},
        {"id": "T7", "name": "Column & Beam (F1)", "duration": 20, "deps": ["T6"], "phase": "Structure", "workers": 20},
        {"id": "T8", "name": "Brickwork (F1)", "duration": 18, "deps": ["T7"], "phase": "Structure", "workers": 15},
        {"id": "T9", "name": "First Floor Slab", "duration": 14, "deps": ["T7"], "phase": "Structure", "workers": 22},
        {"id": "T10", "name": "Column & Beam (F2)", "duration": 18, "deps": ["T9"], "phase": "Structure", "workers": 18},
        {"id": "T11", "name": "Brickwork (F2)", "duration": 16, "deps": ["T10"], "phase": "Structure", "workers": 14},
        {"id": "T12", "name": "Roof Slab", "duration": 14, "deps": ["T10"], "phase": "Structure", "workers": 20},
        {"id": "T13", "name": "Electrical Conduit", "duration": 14, "deps": ["T8", "T11"], "phase": "MEP", "workers": 8},
        {"id": "T14", "name": "Plumbing Rough-in", "duration": 12, "deps": ["T8", "T11"], "phase": "MEP", "workers": 7},
        {"id": "T15", "name": "Plastering", "duration": 18, "deps": ["T13", "T14"], "phase": "Finishing", "workers": 14},
        {"id": "T16", "name": "Flooring & Tiling", "duration": 20, "deps": ["T15"], "phase": "Finishing", "workers": 10},
        {"id": "T17", "name": "Painting Internal", "duration": 15, "deps": ["T16"], "phase": "Finishing", "workers": 8},
        {"id": "T18", "name": "Electrical Finishing", "duration": 10, "deps": ["T17"], "phase": "Finishing", "workers": 6},
        {"id": "T19", "name": "Plumbing Fixtures", "duration": 8, "deps": ["T17"], "phase": "Finishing", "workers": 5},
        {"id": "T20", "name": "Exterior Work", "duration": 12, "deps": ["T12"], "phase": "Finishing", "workers": 10},
        {"id": "T21", "name": "Painting External", "duration": 10, "deps": ["T20"], "phase": "Finishing", "workers": 8},
        {"id": "T22", "name": "Final Inspection", "duration": 3, "deps": ["T18", "T19", "T21"], "phase": "Handover", "workers": 3},
        {"id": "T23", "name": "Snag Fixing", "duration": 5, "deps": ["T22"], "phase": "Handover", "workers": 5},
        {"id": "T24", "name": "Handover", "duration": 2, "deps": ["T23"], "phase": "Handover", "workers": 2},
    ]

    G = nx.DiGraph()
    for task in tasks_data:
        G.add_node(task["id"], **task)

    for task in tasks_data:
        for dep in task["deps"]:
            G.add_edge(dep, task["id"])

    # Forward pass: compute ES and EF
    for node in nx.topological_sort(G):
        task = G.nodes[node]
        if not list(G.predecessors(node)):
            task["es"] = 0
        else:
            task["es"] = max(G.nodes[p]["ef"] for p in G.predecessors(node))
        task["ef"] = task["es"] + task["duration"]

    # Get project duration
    project_duration = max(G.nodes[n]["ef"] for n in G.nodes)

    # Backward pass: compute LS and LF
    for node in reversed(list(nx.topological_sort(G))):
        task = G.nodes[node]
        if not list(G.successors(node)):
            task["lf"] = project_duration
        else:
            task["lf"] = min(G.nodes[s]["ls"] for s in G.successors(node))
        task["ls"] = task["lf"] - task["duration"]
        task["slack"] = task["ls"] - task["es"]
        task["is_critical"] = task["slack"] == 0

    # Find critical path
    critical_path = [n for n in nx.topological_sort(G) if G.nodes[n]["is_critical"]]

    return G, tasks_data, critical_path, project_duration


@router.post("/critical-path", response_model=CPAResponse)
async def critical_path_analysis(request: CPARequest):
    G, tasks_data, critical_path, project_duration = build_cpa_graph(request.phases)

    tasks = []
    for task in tasks_data:
        node = G.nodes[task["id"]]
        tasks.append({
            "id": task["id"],
            "name": task["name"],
            "duration": task["duration"],
            "dependencies": task["deps"],
            "es": node["es"],
            "ef": node["ef"],
            "ls": node["ls"],
            "lf": node["lf"],
            "slack": node["slack"],
            "is_critical": node["is_critical"],
            "workers": task["workers"],
            "phase": task["phase"],
        })

    # Build nodes and edges for react-flow visualization
    nodes = []
    positions = {
        "T1": (0, 0), "T2": (1, 0), "T3": (2, 0), "T4": (3, 0), "T5": (4, 0),
        "T6": (5, 0), "T7": (6, 1), "T8": (7, 2), "T9": (6, 0), "T10": (7, 1),
        "T11": (8, 2), "T12": (8, 0), "T13": (9, 1), "T14": (9, 2),
        "T15": (10, 1), "T16": (11, 1), "T17": (12, 1), "T18": (13, 0),
        "T19": (13, 2), "T20": (9, 0), "T21": (10, 0), "T22": (14, 1),
        "T23": (15, 1), "T24": (16, 1),
    }

    for t in tasks:
        pos = positions.get(t["id"], (0, 0))
        nodes.append({
            "id": t["id"],
            "data": {"label": t["name"], "task": t},
            "position": {"x": pos[0] * 160, "y": pos[1] * 120},
            "style": {
                "background": "#F59E0B" if t["is_critical"] else "#06B6D4",
                "color": "#000",
                "border": "2px solid #fff",
                "borderRadius": "8px",
                "padding": "8px",
                "fontSize": "11px",
            }
        })

    edges = []
    for task in tasks_data:
        for dep in task["deps"]:
            edges.append({
                "id": f"{dep}-{task['id']}",
                "source": dep,
                "target": task["id"],
                "animated": G.nodes[task["id"]]["is_critical"] and G.nodes[dep]["is_critical"],
                "style": {"stroke": "#F59E0B" if G.nodes[task["id"]]["is_critical"] else "#06B6D4"}
            })

    return {
        "tasks": tasks,
        "critical_path": critical_path,
        "project_duration": project_duration,
        "nodes": nodes,
        "edges": edges,
    }
