import asyncio
import unicodedata
from typing import Any

from langchain_core.tools import tool

# The order also defines the priority for suggestions with multiple matches.
SCENARIOS = (
    {
        "keywords": ("vpn", "private network", "remote access"),
        "tickets": [
            {
                "id": "TKT-1042",
                "title": "VPN connects but cannot access the internal network",
                "status": "Resolved",
                "resolution": "Corrected the VPN routes and DNS settings.",
            },
            {
                "id": "TKT-1086",
                "title": "VPN access lost after switching networks",
                "status": "In progress",
                "resolution": None,
            },
        ],
        "articles": [
            {
                "id": "KB-101",
                "title": "Troubleshoot VPN network access",
                "steps": [
                    "Check the internet connection and VPN status.",
                    "Check the IP address, routes, and internal DNS resolution.",
                    "Reconnect the VPN and verify access to an authorized resource.",
                ],
            }
        ],
        "category": {
            "category": "Network",
            "subcategory": "VPN",
            "id": "CAT-101",
            "reason": "The description indicates an access issue with the virtual private network.",
        },
        "solution": {
            "hypothesis": "The VPN routes or DNS settings may be incorrect.",
            "steps": [
                "Confirm the scope of the issue and collect the error message.",
                "Check routes and DNS while connected to the VPN.",
                "Reconnect the client and test an internal resource.",
            ],
            "validation": "Confirm that the user can access the internal resource through the VPN.",
        },
    },
    {
        "keywords": ("printer", "printing", "print queue"),
        "tickets": [
            {
                "id": "TKT-1073",
                "title": "Network printer appears offline",
                "status": "Resolved",
                "resolution": "Restored the network connection and disabled offline printing.",
            }
        ],
        "articles": [
            {
                "id": "KB-202",
                "title": "Restore an offline printer",
                "steps": [
                    "Check power, cables, and the network connection.",
                    "Check the IP address and print queue.",
                    "Disable offline mode and print a test page.",
                ],
            }
        ],
        "category": {
            "category": "Hardware",
            "subcategory": "Printers",
            "id": "CAT-202",
            "reason": "The description indicates that a printer is unavailable.",
        },
        "solution": {
            "hypothesis": "The printer may be disconnected or its queue may be in offline mode.",
            "steps": [
                "Check power and the network connection.",
                "Check the queue and offline mode.",
                "Print a test page.",
            ],
            "validation": "Confirm a successful test print and a print job from the user.",
        },
    },
    {
        "keywords": ("account", "locked", "password", "login", "sign-in"),
        "tickets": [
            {
                "id": "TKT-1091",
                "title": "Account locked after failed sign-in attempts",
                "status": "Resolved",
                "resolution": "After verifying identity, the administrator unlocked the account and updated the saved credential.",
            }
        ],
        "articles": [
            {
                "id": "KB-303",
                "title": "Investigate a locked account",
                "steps": [
                    "Verify identity according to the internal procedure.",
                    "Check sign-in attempts and outdated saved credentials.",
                    "Ask an authorized administrator to unlock the account and verify sign-in.",
                ],
            }
        ],
        "category": {
            "category": "Access",
            "subcategory": "Locked account",
            "id": "CAT-303",
            "reason": "The description indicates an account lockout or authentication issue.",
        },
        "solution": {
            "hypothesis": "Repeated attempts with an old password may have locked the account.",
            "steps": [
                "Verify identity using the internal procedure.",
                "Identify devices with outdated credentials.",
                "Refer the unlock request to an authorized administrator.",
            ],
            "validation": "Confirm successful sign-in and no further lockouts.",
        },
    },
)


def matching_scenarios(text: str) -> list[dict[str, Any]]:
    normalized = "".join(
        c
        for c in unicodedata.normalize("NFKD", text.casefold())
        if not unicodedata.combining(c)
    )
    return [
        scenario
        for scenario in SCENARIOS
        if any(word in normalized for word in scenario["keywords"])
    ]


@tool
async def find_similar_tickets(query: str) -> dict:
    """Search demo tickets for similar issues and recorded resolutions."""
    await asyncio.sleep(5)
    return {
        "tickets": [
            ticket
            for scenario in matching_scenarios(query)
            for ticket in scenario["tickets"]
        ]
    }


@tool
async def search_knowledge_base(query: str) -> dict:
    """Search demo knowledge articles for procedures related to the issue."""
    await asyncio.sleep(5)
    return {
        "articles": [
            article
            for scenario in matching_scenarios(query)
            for article in scenario["articles"]
        ]
    }


@tool
async def suggest_ticket_category(description: str) -> dict:
    """Suggest a category and subcategory without changing any tickets."""
    await asyncio.sleep(5)
    matches = matching_scenarios(description)
    return {"suggestion": matches[0]["category"] if matches else None}


@tool
async def suggest_solution(description: str) -> dict:
    """Suggest a hypothesis, next steps, and verification without performing actions or confirming a resolution."""
    await asyncio.sleep(5)
    matches = matching_scenarios(description)
    return {"suggestion": matches[0]["solution"] if matches else None}


TOOLS = [
    find_similar_tickets,
    search_knowledge_base,
    suggest_ticket_category,
    suggest_solution,
]
